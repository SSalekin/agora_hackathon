# NestFind Rental Deposit Escrow

Hackathon Anchor program for holding an apartment rental deposit in native SOL until a tenant accepts the apartment, opens a dispute, or misses the inspection deadline.

> This is prototype custody software for devnet test SOL only. It is not audited or production-ready.

## Roles

- **Tenant:** creates and funds an agreement, accepts the apartment, or opens a dispute.
- **Landlord:** approves/rejects the proposed agreement and may claim an undisputed deposit after the deadline.
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

The web app should SHA-256 the Couchbase listing ID into `listing_hash`. Full listing details, profiles, and dispute evidence stay off-chain. A compact reason code and evidence hash are stored on-chain.

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

## Events

`ConfigInitialized`, `AgreementCreated`, `LandlordApproved`, `DepositFunded`, `DisputeOpened`, `DepositReleased`, `DepositRefunded`, and `AgreementCancelled`.

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

The Bankrun suite covers tenant release, moderator refund, unauthorized moderator rejection, pre-funding cancellation, and deadline-gated landlord release.

## Devnet deployment

- Program: `9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X`
- Config PDA: `7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq`
- Moderator: `34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e`

The program is deployed and initialized on Solana devnet. The local IDL is generated at `target/idl/escrow.json`; it was intentionally not uploaded on-chain.

To verify or idempotently initialize the config using the wallet configured as moderator:

```bash
ANCHOR_WALLET="$HOME/.config/solana/id.json" \
pnpm run anchor:initialize:devnet
```

The `anchor:initialize:devnet` script loads `SOLANA_DEVNET_RPC_URL` from the root `.env` automatically.

NestFind Phantom integration remains tracked in [TODO.md](TODO.md).
