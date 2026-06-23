import fs from "node:fs";
import anchor from "@anchor-lang/core";
import { PublicKey, SystemProgram } from "@solana/web3.js";

const idl = JSON.parse(
  fs.readFileSync(
    new URL("../target/idl/escrow.json", import.meta.url),
    "utf8",
  ),
);
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = new anchor.Program(idl, provider);
const [config] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId,
);
const existing = await program.account.config.fetchNullable(config);

if (existing) {
  if (!existing.moderator.equals(provider.wallet.publicKey)) {
    throw new Error(
      `Config is already initialized with moderator ${existing.moderator.toBase58()}`,
    );
  }
  console.log(`Config already initialized: ${config.toBase58()}`);
  console.log(`Moderator: ${existing.moderator.toBase58()}`);
  process.exit(0);
}

const signature = await program.methods
  .initializeConfig(provider.wallet.publicKey)
  .accountsStrict({
    payer: provider.wallet.publicKey,
    config,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

console.log(`Config initialized: ${config.toBase58()}`);
console.log(`Moderator: ${provider.wallet.publicKey.toBase58()}`);
console.log(`Signature: ${signature}`);
