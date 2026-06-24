import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import anchor from "@anchor-lang/core";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { assert } from "chai";
import IDL from "../target/idl/escrow.json" with { type: "json" };

const BN = anchor.BN;
const PROGRAM_ID = new PublicKey(IDL.address);
const RPC_URL = process.env.SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com";
// Adaptive deposit: use whatever the payer can afford. With devnet faucet
// rate limits, we must work within the payer's remaining balance.
const DEPOSIT_LAMPORTS = 10_000_000n; // 0.01 SOL — minimal but valid

function listingHash(listingId: string): number[] {
  return [...createHash("sha256").update(listingId).digest()];
}

function agreementAddress(
  tenant: PublicKey,
  landlord: PublicKey,
  hash: number[],
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("agreement"),
      tenant.toBuffer(),
      landlord.toBuffer(),
      Buffer.from(hash),
    ],
    PROGRAM_ID,
  )[0];
}

function stateName(state: unknown): string {
  if (typeof state === "object" && state !== null) {
    const keys = Object.keys(state);
    if (keys.length === 1) return keys[0];
  }
  return String(state);
}

async function confirmTx(
  connection: Connection,
  signature: string,
): Promise<{ err: unknown | null }> {
  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  const result = await connection.confirmTransaction(
    { signature, ...latestBlockhash },
    "confirmed",
  );
  return { err: result.value.err };
}

function loadKeypair(path: string): Keypair {
  const secretKey = JSON.parse(readFileSync(path, "utf-8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

function generateOrLoadKeypair(name: string): Keypair {
  const path = join("/tmp", `devnet-${name}.json`);
  if (existsSync(path)) {
    const kp = loadKeypair(path);
    console.log(`    Loaded ${name} from ${path} (${kp.publicKey.toBase58()})`);
    return kp;
  }
  const kp = Keypair.generate();
  console.log(`    Generated new ${name}: ${kp.publicKey.toBase58()}`);
  return kp;
}

describe("devnet escrow e2e", () => {
  const connection = new Connection(RPC_URL, "confirmed");
  // Unique suffix per test run so PDA addresses never collide with prior runs.
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let payer: Keypair;
  let tenant: Keypair;
  let landlord: Keypair;
  let moderator: Keypair;
  let outsider: Keypair;
  let program: anchor.Program;
  let config: PublicKey;

  before(async () => {
    console.log(`  Connecting to devnet: ${RPC_URL}`);
    console.log(`  Program ID: ${PROGRAM_ID.toBase58()}`);

    // Load the deployer/payer keypair.
    const keypairPath = join(homedir(), ".config", "solana", "id.json");
    payer = loadKeypair(keypairPath);
    console.log(`  Payer: ${payer.publicKey.toBase58()}`);

    // The on-chain config stores the moderator. On this devnet deployment
    // the moderator is the deployer wallet (payer).
    moderator = payer;

    // Set up Anchor program.
    const wallet = new anchor.Wallet(payer);
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    program = new anchor.Program(IDL, provider);

    // Verify config PDA.
    config = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID)[0];
    console.log(`  Config PDA: ${config.toBase58()}`);

    const configAccount = await program.account.config.fetch(config);
    const moderatorPubkey = configAccount.moderator;
    console.log(`  On-chain moderator: ${moderatorPubkey.toBase58()}`);

    assert(
      moderatorPubkey.equals(moderator.publicKey),
      `On-chain moderator (${moderatorPubkey.toBase58()}) must match payer (${moderator.publicKey.toBase58()})`,
    );
    console.log("  Config verified. Moderator matches payer.\n");

    // Load or generate ephemeral keypairs for tenant, landlord, outsider.
    // Landlord is separate from payer so we can test distinct-role signing.
    tenant = generateOrLoadKeypair("tenant");
    landlord = generateOrLoadKeypair("landlord");
    outsider = generateOrLoadKeypair("outsider");

    // Fund wallets from the payer. The tenant needs enough for the deposit
    // plus tx fees. Landlord and outsider only need enough for tx fees.
    const payerBalance = await connection.getBalance(payer.publicKey);
    const payerSol = payerBalance / LAMPORTS_PER_SOL;
    console.log(`  Payer balance: ${payerSol.toFixed(4)} SOL`);

    // What each wallet needs in total (deposit + buffer for tx fees).
    const tenantNeed = Number(DEPOSIT_LAMPORTS) + 5_000_000; // deposit + 0.005 SOL buffer
    const landlordNeed = 20_000_000; // 0.02 SOL total
    const outsiderNeed = 10_000_000; // 0.01 SOL total

    const transfers = [
      { keypair: tenant, need: tenantNeed, label: "tenant" },
      { keypair: landlord, need: landlordNeed, label: "landlord" },
      { keypair: outsider, need: outsiderNeed, label: "outsider" },
    ];

    console.log("  Funding wallets from payer...");
    for (const { keypair, need, label } of transfers) {
      const existingBalance = await connection.getBalance(keypair.publicKey);
      const deficit = need - existingBalance;
      if (deficit <= 0) {
        console.log(`    ${label}: sufficient (${(existingBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL, need ${(need / LAMPORTS_PER_SOL).toFixed(4)})`);
        continue;
      }
      // Transfer the deficit, limited by what the payer can afford.
      const currentPayerBalance = await connection.getBalance(payer.publicKey);
      const reserve = 50_000; // keep 0.00005 SOL for payer's own tx fees
      const transferAmount = Math.min(deficit, currentPayerBalance - reserve);
      if (transferAmount <= 0) {
        console.log(`    ${label}: skipped (payer too low, deficit ${(deficit / LAMPORTS_PER_SOL).toFixed(4)} SOL)`);
        continue;
      }
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: keypair.publicKey,
          lamports: transferAmount,
        }),
      );
      const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
      console.log(`    ${label}: +${(transferAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL → ${((existingBalance + transferAmount) / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    }

    // Final balance check.
    const finalPayerBalance = await connection.getBalance(payer.publicKey);
    console.log(`\n  Final payer balance: ${(finalPayerBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

    for (const { keypair, label } of transfers) {
      const balance = await connection.getBalance(keypair.publicKey);
      console.log(`  ${label}: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    }
    console.log();
  });

  async function createAgreement(
    listingId: string,
    deadlineOffsetSeconds = 3600,
  ) {
    const hash = listingHash(listingId);
    const agreement = agreementAddress(tenant.publicKey, landlord.publicKey, hash);
    const nowSec = Math.floor(Date.now() / 1000);
    const deadline = nowSec + deadlineOffsetSeconds;

    const tx = await program.methods
      .createAgreement(
        hash,
        new BN(DEPOSIT_LAMPORTS.toString()),
        new BN(deadline.toString()),
      )
      .accountsStrict({
        tenant: tenant.publicKey,
        landlord: landlord.publicKey,
        config,
        agreement,
        systemProgram: SystemProgram.programId,
      })
      .signers([tenant])
      .rpc();

    return { agreement, deadline, hash, tx };
  }

  async function approveAndFund(agreement: PublicKey) {
    await program.methods
      .approveAgreement()
      .accountsStrict({ landlord: landlord.publicKey, agreement })
      .signers([landlord])
      .rpc();

    const balanceBefore = await connection.getBalance(agreement);
    await program.methods
      .fundAgreement()
      .accountsStrict({
        tenant: tenant.publicKey,
        agreement,
        systemProgram: SystemProgram.programId,
      })
      .signers([tenant])
      .rpc();
    const balanceAfter = await connection.getBalance(agreement);
    assert.equal(
      balanceAfter - balanceBefore,
      Number(DEPOSIT_LAMPORTS),
      "agreement balance increased by deposit amount",
    );
  }

  it("creates, approves, funds, and releases a deposit to the landlord", async () => {
    const { agreement } = await createAgreement(`happy-path-${runId}`);

    const created = await program.account.agreement.fetch(agreement);
    assert(created.tenant.equals(tenant.publicKey), "tenant matches");
    assert(created.landlord.equals(landlord.publicKey), "landlord matches");
    assert(created.moderator.equals(moderator.publicKey), "moderator matches");
    assert.equal(stateName(created.state), "awaitingLandlordApproval");

    await approveAndFund(agreement);
    const funded = await program.account.agreement.fetch(agreement);
    assert.equal(stateName(funded.state), "funded");

    const landlordBalanceBefore = await connection.getBalance(landlord.publicKey);
    const releaseTx = await program.methods
      .releaseByTenant()
      .accountsStrict({
        tenant: tenant.publicKey,
        landlord: landlord.publicKey,
        agreement,
      })
      .signers([tenant])
      .rpc();

    const { err } = await confirmTx(connection, releaseTx);
    assert.isNull(err, "release confirmed");

    const landlordBalanceAfter = await connection.getBalance(landlord.publicKey);
    assert.isAtLeast(
      landlordBalanceAfter - landlordBalanceBefore,
      Number(DEPOSIT_LAMPORTS),
      "landlord received deposit",
    );

    const accountInfo = await connection.getAccountInfo(agreement);
    assert.isNull(accountInfo, "agreement account closed");
    console.log(`    tx: ${releaseTx}`);
  });

  it("allows landlord to cancel before funding", async () => {
    const { agreement } = await createAgreement(`cancel-${runId}`);

    await program.methods
      .approveAgreement()
      .accountsStrict({ landlord: landlord.publicKey, agreement })
      .signers([landlord])
      .rpc();

    const approved = await program.account.agreement.fetch(agreement);
    assert.equal(stateName(approved.state), "awaitingFunding");

    const cancelTx = await program.methods
      .cancelAgreement()
      .accountsStrict({
        authority: landlord.publicKey,
        tenant: tenant.publicKey,
        landlord: landlord.publicKey,
        agreement,
      })
      .signers([landlord])
      .rpc();

    const { err } = await confirmTx(connection, cancelTx);
    assert.isNull(err, "cancel confirmed");

    const accountInfo = await connection.getAccountInfo(agreement);
    assert.isNull(accountInfo, "agreement account closed");
    console.log(`    tx: ${cancelTx}`);
  });

  it("rejects actions from an unauthorized outsider wallet", async () => {
    const { agreement } = await createAgreement(`unauth-${runId}`);

    try {
      await program.methods
        .approveAgreement()
        .accountsStrict({ landlord: outsider.publicKey, agreement })
        .signers([outsider])
        .rpc();
      assert.fail("outsider approved the agreement");
    } catch (error) {
      const msg = String(error);
      assert(
        msg.includes("ConstraintHasOne") || msg.includes("constraint") || msg.includes("2003"),
        `expected ConstraintHasOne, got: ${msg.slice(0, 200)}`,
      );
    }

    try {
      await program.methods
        .fundAgreement()
        .accountsStrict({
          tenant: outsider.publicKey,
          agreement,
          systemProgram: SystemProgram.programId,
        })
        .signers([outsider])
        .rpc();
      assert.fail("outsider funded the agreement");
    } catch (error) {
      const msg = String(error);
      assert(
        msg.includes("ConstraintHasOne") || msg.includes("constraint") || msg.includes("2003"),
        `expected ConstraintHasOne, got: ${msg.slice(0, 200)}`,
      );
    }

    const account = await program.account.agreement.fetch(agreement);
    assert.equal(stateName(account.state), "awaitingLandlordApproval");

    await program.methods
      .cancelAgreement()
      .accountsStrict({
        authority: landlord.publicKey,
        tenant: tenant.publicKey,
        landlord: landlord.publicKey,
        agreement,
      })
      .signers([landlord])
      .rpc();
  });

  it("opens a dispute and resolves with moderator refund", async () => {
    // Generate a fresh tenant for this test since prior tests depleted the
    // shared tenant's balance (deposits transfer SOL to the landlord on release).
    const disputeTenant = Keypair.generate();
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: disputeTenant.publicKey,
        lamports: Number(DEPOSIT_LAMPORTS) + 5_000_000,
      }),
    );
    await sendAndConfirmTransaction(connection, fundTx, [payer]);

    const hash = listingHash(`dispute-${runId}`);
    const agreement = agreementAddress(disputeTenant.publicKey, landlord.publicKey, hash);
    const nowSec = Math.floor(Date.now() / 1000);
    const deadline = nowSec + 3600;

    await program.methods
      .createAgreement(
        hash,
        new BN(DEPOSIT_LAMPORTS.toString()),
        new BN(deadline.toString()),
      )
      .accountsStrict({
        tenant: disputeTenant.publicKey,
        landlord: landlord.publicKey,
        config,
        agreement,
        systemProgram: SystemProgram.programId,
      })
      .signers([disputeTenant])
      .rpc();

    await program.methods
      .approveAgreement()
      .accountsStrict({ landlord: landlord.publicKey, agreement })
      .signers([landlord])
      .rpc();

    const balanceBefore = await connection.getBalance(agreement);
    await program.methods
      .fundAgreement()
      .accountsStrict({
        tenant: disputeTenant.publicKey,
        agreement,
        systemProgram: SystemProgram.programId,
      })
      .signers([disputeTenant])
      .rpc();
    const balanceAfter = await connection.getBalance(agreement);
    assert.equal(balanceAfter - balanceBefore, Number(DEPOSIT_LAMPORTS));

    const evidenceHash = listingHash("devnet-evidence:1");
    const disputeTx = await program.methods
      .openDispute(1, evidenceHash)
      .accountsStrict({ authority: disputeTenant.publicKey, agreement })
      .signers([disputeTenant])
      .rpc();

    const { err: disputeErr } = await confirmTx(connection, disputeTx);
    assert.isNull(disputeErr, "dispute opened");

    const disputed = await program.account.agreement.fetch(agreement);
    assert.equal(stateName(disputed.state), "disputed");
    assert.equal(disputed.disputeReasonCode, 1);
    assert.deepEqual(disputed.evidenceHash, evidenceHash);

    // Outsider tries to resolve — should fail.
    try {
      await program.methods
        .resolveDispute(true)
        .accountsStrict({
          moderator: outsider.publicKey,
          tenant: disputeTenant.publicKey,
          landlord: landlord.publicKey,
          agreement,
        })
        .signers([outsider])
        .rpc();
      assert.fail("outsider resolved the dispute");
    } catch (error) {
      const msg = String(error);
      assert(
        msg.includes("ConstraintHasOne") || msg.includes("constraint") || msg.includes("2003"),
        `expected ConstraintHasOne, got: ${msg.slice(0, 200)}`,
      );
    }

    // Moderator resolves with refund.
    const tenantBalanceBefore = await connection.getBalance(disputeTenant.publicKey);
    const resolveTx = await program.methods
      .resolveDispute(false)
      .accountsStrict({
        moderator: moderator.publicKey,
        tenant: disputeTenant.publicKey,
        landlord: landlord.publicKey,
        agreement,
      })
      .signers([moderator])
      .rpc();

    const { err: resolveErr } = await confirmTx(connection, resolveTx);
    assert.isNull(resolveErr, "resolve confirmed");

    const tenantBalanceAfter = await connection.getBalance(disputeTenant.publicKey);
    assert.isAtLeast(
      tenantBalanceAfter - tenantBalanceBefore,
      Number(DEPOSIT_LAMPORTS),
      "tenant received refund",
    );

    const accountInfo = await connection.getAccountInfo(agreement);
    assert.isNull(accountInfo, "agreement account closed");
    console.log(`    dispute tx: ${disputeTx}`);
    console.log(`    resolve tx: ${resolveTx}`);
  });
});
