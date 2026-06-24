# NestFind Rental Deposit Escrow

Hackathon Anchor program for holding an apartment rental deposit in native SOL until a tenant accepts the apartment, opens a dispute, or misses the inspection deadline.

> This is prototype custody software for devnet test SOL only. It is not audited or production-ready.

## Roles

- **Tenant:** creates and funds an agreement, accepts the apartment, or opens a dispute.
- **Landlord:** approves or rejects the proposed agreement, maintains a minimum on-chain stake profile for approval, and may claim an undisputed deposit after the deadline.
- **Moderator:** one program-wide wallet configured once for the hackathon; it makes a final full-release or full-refund decision for disputes.

## Lifecycle

```text
AwaitingLandlordApproval
  ├─ cancel/reject → Cancelled (account closes)
  └─ landlord approves → AwaitingFunding
       ├─ either party cancels → Cancelled (account closes)
       └─ tenant funds → Funded
            ├─ tenant accepts → Released to landlord
            ├─ tenant or landlord disputes before deadline → Disputed
            │    ├─ moderator releases → Released to landlord
            │    └─ moderator refunds → Refunded to tenant
            └─ deadline passes without dispute → landlord releases
```

Terminal agreements close. The deposit goes to the selected recipient and account rent returns to the tenant.

## Program accounts

- `Config` PDA: seeds `["config"]`; stores the fixed moderator wallet.
- `Agreement` PDA: seeds `["agreement", tenant, landlord, listing_hash]`; stores authorization-critical agreement state and holds the native-SOL deposit.
- `LandlordProfile` PDA: seeds `["landlord_profile", landlord]`; stores landlord stake and basic reputation counters.

The web app SHA-256 hashes the Couchbase listing ID into `listing_hash`. Full listing details, user profiles, and dispute evidence remain off-chain. Only compact agreement and evidence-hash data are stored on-chain.

## Instructions

- `initialize_config(moderator)`
- `create_agreement(listing_hash, deposit_lamports, inspection_deadline)`
- `approve_agreement()`
- `cancel_agreement()`
- `fund_agreement()`
- `release_by_tenant()`
- `open_dispute(reason_code, evidence_hash)`
- `resolve_dispute(release_to_landlord)`
- `release_after_deadline()`
- `initialize_landlord_profile()`
- `stake_landlord(amount)`
- `unstake_landlord(amount)`

## Events

- `ConfigInitialized`
- `AgreementCreated`
- `LandlordApproved`
- `DepositFunded`
- `DisputeOpened`
- `DepositReleased`
- `DepositRefunded`
- `AgreementCancelled`
- `LandlordProfileInitialized`
- `LandlordStaked`
- `LandlordUnstaked`

## Stake model

The current program requires a landlord to maintain a minimum active stake before approving an agreement. The profile tracks:

- `total_staked_lamports`
- `active_stake_lamports`
- `completed_rentals`
- `disputes_lost`

Current limitation:

- The source enforces minimum stake, but the current agreement handlers do not yet update `completed_rentals` or `disputes_lost`, so the reputation model is only partially implemented.

## Prerequisites

Install these once:

- Git and `curl`
- Node.js 22 or newer and pnpm 10
- Rust and Cargo
- Solana CLI 3.1.x, including the SBF build tools
- Anchor CLI 1.0.2

The official installer provides Rust, Solana CLI, and Anchor CLI:

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
```

Restart the terminal, then verify:

```bash
node --version
pnpm --version
rustc --version
cargo --version
cargo-build-sbf --version
solana --version
anchor --version
```

## Local verification

```bash
pnpm install
cargo check --manifest-path programs/escrow/Cargo.toml
pnpm run anchor:build
pnpm run anchor:typecheck
pnpm test
```

Bankrun coverage includes:

- tenant release;
- moderator refund;
- unauthorized moderator rejection;
- pre-funding cancellation;
- deadline-gated landlord release;
- landlord profile initialization and staking;
- low-stake approval rejection;
- landlord unstaking.

## Devnet verification

- Program: `9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X`
- Config PDA: `7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq`
- Moderator: `34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e`

The repo also contains a devnet e2e suite at `programs/escrow/tests/devnet-e2e.ts` and exposes it through:

```bash
pnpm run verify:escrow
```

Current limitation:

- The devnet suite does not yet cover `release_after_deadline`.

## Devnet config initialization

To verify or idempotently initialize the config using the moderator wallet:

```bash
ANCHOR_WALLET="$HOME/.config/solana/id.json" \
pnpm run anchor:initialize:devnet
```

The `anchor:initialize:devnet` script loads `SOLANA_DEVNET_RPC_URL` from the root `.env`.
