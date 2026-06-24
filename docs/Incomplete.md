# NestFind Incomplete Work

Last verified against source: 2026-06-24

This file condenses the major incomplete work after reviewing the current codebase and cross-checking:

- [`docs/NestFind Progress.md`](./NestFind%20Progress.md)
- [`docs/TODO_anchor.md`](./TODO_anchor.md)

## 1. Off-chain persistence and indexing

**Mostly implemented, with important gaps.** Couchbase-backed persistence exists and is wired into the escrow UI, but the indexing layer is still lightweight and not a full event-ingestion pipeline.

What was added:
- `types/escrow-persistence.ts` — `EscrowUser`, `PersistedAgreement`, `TransactionRecord`, `DisputeEvidence`, `IndexedEvent`
- `lib/db/escrow-collection.ts` — shared collection accessor (`COUCHBASE_ESCROW_COLLECTION` env, defaults to `listings`)
- `lib/db/escrow-users.ts` — wallet-to-display-name CRUD
- `lib/db/agreements.ts` — agreement metadata CRUD with state updates
- `lib/db/transactions.ts` — per-transaction signature log
- `lib/db/dispute-evidence.ts` — dispute text storage with SHA-256 hash verification
- `lib/db/events.ts` — indexed event append/read
- `lib/event-indexer.ts` — pull-based reconciliation: scans agreement accounts, persists new agreements, reconciles state drift
- `app/api/escrow/` — 6 API routes (users, agreements list/create, single get/patch, transactions, evidence, indexer trigger)
- `scripts/seed-escrow-users.ts` — seeds demo wallet-to-user mappings
- Persistence wired into `TenantAgreementPanel.tsx` and `LandlordDashboard.tsx` (best-effort after each confirmed tx)

Still missing or weak:

- Move escrow documents out of the shared `listings` collection into a dedicated Couchbase collection.
- Replace best-effort browser-triggered persistence with a more reliable server-side write path.
- Upgrade the indexer from account scans plus synthetic events to real on-chain event/signature ingestion with durable cursors.
- Reconcile `listingId` more accurately in indexed agreement records; the current indexer persists empty `listingId` values for chain-discovered agreements.

## 2. End-to-end devnet verification

**Largely implemented, but not complete.** The repo now contains a real devnet test suite in `programs/escrow/tests/devnet-e2e.ts`.

What was added:
- `programs/escrow/tests/devnet-e2e.ts` — 4 test scenarios covering all on-chain paths on devnet
- `pnpm run verify:escrow` — runs the devnet e2e test from the repo root
- `programs/escrow/Anchor.toml` — added `test:devnet` script

Test coverage:
- Happy path: create → approve → fund → release by tenant (account closure verified)
- Landlord cancel: create → approve → cancel (pre-funding cancellation verified)
- Unauthorized outsider: cannot approve or fund (role separation enforced)
- Dispute + refund: create → approve → fund → dispute → moderator refund (dispute flow verified)

Still missing:

- Devnet coverage for `releaseAfterDeadline`.
- Source-backed evidence that the browser PWA flow itself was run end-to-end with separate wallets; the current devnet suite is program/client-script level.
- Install/offline verification for the production PWA build.
- Responsive escrow UI verification in a production build.

## 3. Wallet and client hardening

**Partially implemented.** The code is cleaner and typed now, but full Wallet Standard support is not actually present.

What was added:
- `types/solana-wallet.ts` — `SolanaWalletProvider`, `AnchorWalletAdapter`, `SolanaRpcConfig` typed interfaces
- `lib/solana.ts` — `getWalletProvider()`, `prepareAnchorClient()`, `deriveAgreementPda()`, `deriveConfigPda()`, `sha256Bytes()`, `sha256Hex()`, `bytesToHex()`, `explorerUrl()` shared utilities
- `use-phantom-wallet.ts` refactored to use typed `SolanaWalletProvider` and `getWalletProvider()` instead of `window as any`
- `TenantAgreementPanel.tsx` and `LandlordDashboard.tsx` refactored to use shared `prepareAnchorClient()` from `lib/solana.ts` — eliminated duplicated wallet adapter code and `@ts-ignore` directives
- `env.local.example` updated with `NEXT_PUBLIC_SOLANA_RPC_URL` and `NEXT_PUBLIC_SOLANA_CLUSTER` env vars for centralized RPC configuration
- Error handlers use `unknown` type with `instanceof Error` narrowing instead of `any`

Still missing:

- Real Wallet Standard registry support or `@solana/wallet-adapter` integration for multi-wallet support.
- Removal of the remaining dependency on injected `window.solana` provider discovery.
- A safer production RPC strategy such as a private RPC proxy or restricted backend mediation.

## 4. Test coverage for frontend escrow utilities

The on-chain program is tested, but the browser escrow layer still lacks focused automated coverage.

Still missing:

- Unit tests for:
  - PDA derivation;
  - listing hash derivation;
  - state decoding;
  - amount conversion;
  - account-to-role mapping.
- Mocked wallet/UI tests for:
  - signature rejection;
  - RPC failure;
  - failed confirmation;
  - disconnect and account-change behavior.

## 5. Product/platform work beyond the hackathon core

These are still not implemented in the current source and remain larger follow-on tasks:

- Real authentication and server-side user profiles.
- Landlord listing creation and listing-management workflows.
- Landlord reputation derived from completed agreements and dispute outcomes.
- Analytics, monitoring, and historical on-chain activity views.
- Production deployment validation and operational readiness.
