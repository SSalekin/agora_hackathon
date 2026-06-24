import { createHash } from "node:crypto";
import anchor from "@anchor-lang/core";
import {
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { BankrunProvider } from "anchor-bankrun";
import { assert } from "chai";
import { Clock, type ProgramTestContext, startAnchor } from "solana-bankrun";
import IDL from "../target/idl/escrow.json" with { type: "json" };
import type { Escrow } from "../target/types/escrow";

const BN = anchor.BN;
const PROGRAM_ID = new PublicKey(IDL.address);
const DEPOSIT_LAMPORTS = 2n * BigInt(LAMPORTS_PER_SOL);
const MIN_LANDLORD_STAKE = 500_000_000; // 0.5 SOL

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

function landlordProfileAddress(landlord: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("landlord-profile"), landlord.toBuffer()],
    PROGRAM_ID,
  )[0];
}

describe("rental deposit escrow", () => {
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let program: anchor.Program<Escrow>;
  let tenant: Keypair;
  let landlord: Keypair;
  let moderator: Keypair;
  let outsider: Keypair;
  let config: PublicKey;
  let landlordProfile: PublicKey;

  before(async () => {
    context = await startAnchor(
      "programs/escrow",
      [{ name: "escrow", programId: PROGRAM_ID }],
      [],
    );
    provider = new BankrunProvider(context);
    program = new anchor.Program<Escrow>(IDL, provider);
    [tenant, landlord, moderator, outsider] = [
      Keypair.generate(),
      Keypair.generate(),
      Keypair.generate(),
      Keypair.generate(),
    ];

    const fundUsers = new Transaction();
    for (const recipient of [tenant, landlord, moderator, outsider]) {
      fundUsers.add(
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: recipient.publicKey,
          lamports: 10 * LAMPORTS_PER_SOL,
        }),
      );
    }
    await provider.sendAndConfirm!(fundUsers);

    config = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID,
    )[0];
    await program.methods
      .initializeConfig(moderator.publicKey)
      .accountsStrict({
        payer: provider.publicKey,
        config,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    landlordProfile = landlordProfileAddress(landlord.publicKey);
    await program.methods
      .initializeLandlordProfile()
      .accountsStrict({
        landlord: landlord.publicKey,
        landlordProfile,
        systemProgram: SystemProgram.programId,
      })
      .signers([landlord])
      .rpc();

    await program.methods
      .stakeLandlord(new BN(MIN_LANDLORD_STAKE))
      .accountsStrict({
        landlord: landlord.publicKey,
        landlordProfile,
        systemProgram: SystemProgram.programId,
      })
      .signers([landlord])
      .rpc();
  });

  async function createAgreement(
    listingId: string,
    deadlineOffsetSeconds = 3_600,
  ) {
    const hash = listingHash(listingId);
    const agreement = agreementAddress(
      tenant.publicKey,
      landlord.publicKey,
      hash,
    );
    const clock = await context.banksClient.getClock();
    const deadline = clock.unixTimestamp + BigInt(deadlineOffsetSeconds);

    await program.methods
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

    return { agreement, deadline, hash };
  }

  async function approveAndFund(agreement: PublicKey) {
    await program.methods
      .approveAgreement()
      .accountsStrict({
        landlord: landlord.publicKey,
        landlordProfile,
        agreement,
      })
      .signers([landlord])
      .rpc();

    const balanceBeforeFunding =
      await context.banksClient.getBalance(agreement);
    await program.methods
      .fundAgreement()
      .accountsStrict({
        tenant: tenant.publicKey,
        agreement,
        systemProgram: SystemProgram.programId,
      })
      .signers([tenant])
      .rpc();
    const balanceAfterFunding = await context.banksClient.getBalance(agreement);
    assert.equal(balanceAfterFunding - balanceBeforeFunding, DEPOSIT_LAMPORTS);
  }

  it("creates, approves, funds, and releases a SOL deposit to the landlord", async () => {
    const { agreement } = await createAgreement("fpt-garden-studio");
    const created = await program.account.agreement.fetch(agreement);
    assert(created.tenant.equals(tenant.publicKey));
    assert(created.landlord.equals(landlord.publicKey));
    assert(created.moderator.equals(moderator.publicKey));
    assert.deepEqual(created.state, { awaitingLandlordApproval: {} });

    await approveAndFund(agreement);
    const funded = await program.account.agreement.fetch(agreement);
    assert.deepEqual(funded.state, { funded: {} });

    const landlordBalanceBefore = await context.banksClient.getBalance(
      landlord.publicKey,
    );
    await program.methods
      .releaseByTenant()
      .accountsStrict({
        tenant: tenant.publicKey,
        landlord: landlord.publicKey,
        agreement,
      })
      .signers([tenant])
      .rpc();

    const landlordBalanceAfter = await context.banksClient.getBalance(
      landlord.publicKey,
    );
    assert.equal(
      landlordBalanceAfter - landlordBalanceBefore,
      DEPOSIT_LAMPORTS,
    );
    assert.isNull(await context.banksClient.getAccount(agreement));
  });

  it("allows the configured moderator to refund a disputed deposit", async () => {
    const { agreement } = await createAgreement("greenwich-loft");
    await approveAndFund(agreement);
    const evidenceHash = listingHash("couchbase:evidence:greenwich-loft:1");

    await program.methods
      .openDispute(1, evidenceHash)
      .accountsStrict({ authority: tenant.publicKey, agreement })
      .signers([tenant])
      .rpc();

    const disputed = await program.account.agreement.fetch(agreement);
    assert.deepEqual(disputed.state, { disputed: {} });
    assert.equal(disputed.disputeReasonCode, 1);
    assert.deepEqual(disputed.evidenceHash, evidenceHash);

    const tenantBalanceBefore = await context.banksClient.getBalance(
      tenant.publicKey,
    );
    await program.methods
      .resolveDispute(false)
      .accountsStrict({
        moderator: moderator.publicKey,
        tenant: tenant.publicKey,
        landlord: landlord.publicKey,
        agreement,
      })
      .signers([moderator])
      .rpc();

    const tenantBalanceAfter = await context.banksClient.getBalance(
      tenant.publicKey,
    );
    assert.isAtLeast(
      Number(tenantBalanceAfter - tenantBalanceBefore),
      Number(DEPOSIT_LAMPORTS),
      "tenant receives the deposit plus reclaimed account rent",
    );
    assert.isNull(await context.banksClient.getAccount(agreement));
  });

  it("rejects dispute resolution by any wallet other than the configured moderator", async () => {
    const { agreement } = await createAgreement("marble-mountain-flat");
    await approveAndFund(agreement);
    await program.methods
      .openDispute(2, listingHash("couchbase:evidence:marble:1"))
      .accountsStrict({ authority: landlord.publicKey, agreement })
      .signers([landlord])
      .rpc();

    try {
      await program.methods
        .resolveDispute(true)
        .accountsStrict({
          moderator: outsider.publicKey,
          tenant: tenant.publicKey,
          landlord: landlord.publicKey,
          agreement,
        })
        .signers([outsider])
        .rpc();
      assert.fail("an unauthorized wallet resolved the dispute");
    } catch (error) {
      assert.include(String(error), "ConstraintHasOne");
    }

    const stillDisputed = await program.account.agreement.fetch(agreement);
    assert.deepEqual(stillDisputed.state, { disputed: {} });

    await program.methods
      .resolveDispute(true)
      .accountsStrict({
        moderator: moderator.publicKey,
        tenant: tenant.publicKey,
        landlord: landlord.publicKey,
        agreement,
      })
      .signers([moderator])
      .rpc();
  });

  it("allows either party to cancel before funding and returns rent to the tenant", async () => {
    const { agreement } = await createAgreement("student-house-share");
    await program.methods
      .approveAgreement()
      .accountsStrict({
        landlord: landlord.publicKey,
        landlordProfile,
        agreement,
      })
      .signers([landlord])
      .rpc();

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

    assert.isNull(await context.banksClient.getAccount(agreement));
  });

  it("allows the landlord to release an undisputed deposit only after the deadline", async () => {
    const { agreement, deadline } = await createAgreement(
      "han-river-modern",
      30,
    );
    await approveAndFund(agreement);

    try {
      await program.methods
        .releaseAfterDeadline()
        .accountsStrict({
          landlord: landlord.publicKey,
          tenant: tenant.publicKey,
          agreement,
        })
        .preInstructions([
          ComputeBudgetProgram.setComputeUnitLimit({ units: 180_000 }),
        ])
        .signers([landlord])
        .rpc();
      assert.fail("landlord released the deposit before the deadline");
    } catch (error) {
      assert.include(String(error), "InspectionDeadlineNotReached");
    }

    const clock = await context.banksClient.getClock();
    context.setClock(
      new Clock(
        clock.slot,
        clock.epochStartTimestamp,
        clock.epoch,
        clock.leaderScheduleEpoch,
        deadline + 1n,
      ),
    );

    const landlordBalanceBefore = await context.banksClient.getBalance(
      landlord.publicKey,
    );
    await program.methods
      .releaseAfterDeadline()
      .accountsStrict({
        landlord: landlord.publicKey,
        tenant: tenant.publicKey,
        agreement,
      })
      .signers([landlord])
      .rpc();
    const landlordBalanceAfter = await context.banksClient.getBalance(
      landlord.publicKey,
    );

    assert.equal(
      landlordBalanceAfter - landlordBalanceBefore,
      DEPOSIT_LAMPORTS,
    );
    assert.isNull(await context.banksClient.getAccount(agreement));
  });

  it("landlord initializes profile and stakes SOL", async () => {
    const freshLandlord = Keypair.generate();
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: freshLandlord.publicKey,
        lamports: 10 * LAMPORTS_PER_SOL,
      }),
    );
    await provider.sendAndConfirm!(fundTx);

    const profile = landlordProfileAddress(freshLandlord.publicKey);
    await program.methods
      .initializeLandlordProfile()
      .accountsStrict({
        landlord: freshLandlord.publicKey,
        landlordProfile: profile,
        systemProgram: SystemProgram.programId,
      })
      .signers([freshLandlord])
      .rpc();

    const fetched = await program.account.landlordProfile.fetch(profile);
    assert.equal(fetched.totalStakedLamports.toNumber(), 0);
    assert.equal(fetched.activeStakeLamports.toNumber(), 0);

    await program.methods
      .stakeLandlord(new BN(MIN_LANDLORD_STAKE))
      .accountsStrict({
        landlord: freshLandlord.publicKey,
        landlordProfile: profile,
        systemProgram: SystemProgram.programId,
      })
      .signers([freshLandlord])
      .rpc();

    const afterStake = await program.account.landlordProfile.fetch(profile);
    assert.equal(afterStake.totalStakedLamports.toNumber(), MIN_LANDLORD_STAKE);
    assert.equal(afterStake.activeStakeLamports.toNumber(), MIN_LANDLORD_STAKE);
  });

  it("rejects agreement approval when landlord stake is too low", async () => {
    const poorLandlord = Keypair.generate();
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: poorLandlord.publicKey,
        lamports: 10 * LAMPORTS_PER_SOL,
      }),
    );
    await provider.sendAndConfirm!(fundTx);

    const poorProfile = landlordProfileAddress(poorLandlord.publicKey);
    await program.methods
      .initializeLandlordProfile()
      .accountsStrict({
        landlord: poorLandlord.publicKey,
        landlordProfile: poorProfile,
        systemProgram: SystemProgram.programId,
      })
      .signers([poorLandlord])
      .rpc();

    const hash = listingHash("low-stake-listing");
    const agreement = agreementAddress(
      tenant.publicKey,
      poorLandlord.publicKey,
      hash,
    );
    const clock = await context.banksClient.getClock();
    const deadline = clock.unixTimestamp + BigInt(3_600);

    await program.methods
      .createAgreement(
        hash,
        new BN(DEPOSIT_LAMPORTS.toString()),
        new BN(deadline.toString()),
      )
      .accountsStrict({
        tenant: tenant.publicKey,
        landlord: poorLandlord.publicKey,
        config,
        agreement,
        systemProgram: SystemProgram.programId,
      })
      .signers([tenant])
      .rpc();

    try {
      await program.methods
        .approveAgreement()
        .accountsStrict({
          landlord: poorLandlord.publicKey,
          landlordProfile: poorProfile,
          agreement,
        })
        .signers([poorLandlord])
        .rpc();
      assert.fail("approval succeeded with insufficient stake");
    } catch (error) {
      assert.include(String(error), "InsufficientLandlordStake");
    }
  });

  it("allows landlord to unstake unused stake", async () => {
    const profile = landlordProfileAddress(landlord.publicKey);
    const before = await program.account.landlordProfile.fetch(profile);
    const unstakeAmount = 100_000_000; // 0.1 SOL

    const landlordBalanceBefore = await context.banksClient.getBalance(
      landlord.publicKey,
    );
    await program.methods
      .unstakeLandlord(new BN(unstakeAmount))
      .accountsStrict({
        landlord: landlord.publicKey,
        landlordProfile: profile,
        systemProgram: SystemProgram.programId,
      })
      .signers([landlord])
      .rpc();

    const after = await program.account.landlordProfile.fetch(profile);
    assert.equal(
      after.activeStakeLamports.toNumber(),
      before.activeStakeLamports.toNumber() - unstakeAmount,
    );
    assert.equal(
      after.totalStakedLamports.toNumber(),
      before.totalStakedLamports.toNumber() - unstakeAmount,
    );

    const landlordBalanceAfter = await context.banksClient.getBalance(
      landlord.publicKey,
    );
    assert.isAtLeast(
      Number(landlordBalanceAfter - landlordBalanceBefore),
      unstakeAmount,
    );
  });
});
