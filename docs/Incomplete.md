# NestFind Incomplete Work

Last verified against source: 2026-06-24

This file condenses the major incomplete work after reviewing the current codebase and cross-checking:

- [`docs/NestFind Progress.md`](./NestFind%20Progress.md)
- [`docs/TODO_anchor.md`](./TODO_anchor.md)

## 1. Off-chain persistence and indexing

**Implemented.** Couchbase-backed persistence reuses the existing `listings` collection with `escrow::` document ID prefixes. The `USE_COUCHBASE=false` fallback returns empty arrays so the UI relies solely on on-chain reads.

What was added:
- `types/escrow-persistence.ts` — `EscrowUser`, `PersistedAgreement`, `TransactionRecord`, `DisputeEvidence`, `IndexedEvent`
- `lib/db/escrow-collection.ts` — shared collection accessor (`COUCHBASE_ESCROW_COLLECTION` env, defaults to `listings`)
- `lib/db/escrow-users.ts` — wallet-to-display-name CRUD
- `lib/db/agreements.ts` — agreement metadata CRUD with state updates
- `lib/db/transactions.ts` — per-transaction signature log
- `lib/db/dispute-evidence.ts` — dispute text storage with SHA-256 hash verification
- `lib/db/events.ts` — indexed event append/read
- `lib/event-indexer.ts` — pull-based reconciliation: polls chain, persists new agreements, reconciles state drift
- `app/api/escrow/` — 6 API routes (users, agreements list/create, single get/patch, transactions, evidence, indexer trigger)
- `scripts/seed-escrow-users.ts` — seeds demo wallet-to-user mappings
- Persistence wired into `TenantAgreementPanel.tsx` and `LandlordDashboard.tsx` (best-effort after each confirmed tx)

**Post-hackathon TODO:** Migrate escrow documents from the shared `listings` collection to a dedicated `escrow` Couchbase collection. Add `COUCHBASE_ESCROW_COLLECTION` env var (already supported) and create the collection in Capella. Currently both the apartment catalog and escrow data share the same collection, which works for the hackathon but should be separated for production.

## 2. End-to-end devnet verification

**Implemented.** Created `programs/escrow/tests/devnet-e2e.ts` — a Mocha test suite that runs the full escrow lifecycle against Solana devnet using ephemeral wallets and real transactions.

What was added:
- `programs/escrow/tests/devnet-e2e.ts` — 4 test scenarios covering all on-chain paths on devnet
- `pnpm run verify:escrow` — runs the devnet e2e test from the repo root
- `programs/escrow/Anchor.toml` — added `test:devnet` script

Test coverage:
- Happy path: create → approve → fund → release by tenant (account closure verified)
- Landlord cancel: create → approve → cancel (pre-funding cancellation verified)
- Unauthorized outsider: cannot approve or fund (role separation enforced)
- Dispute + refund: create → approve → fund → dispute → moderator refund (dispute flow verified)

**Post-hackathon:** Add a `releaseAfterDeadline` test on devnet (requires waiting the real deadline or using a very short one). Add PWA install/offline verification and responsive escrow UI testing.

## 3. Wallet and client hardening

**Implemented.** Replaced direct `window.solana` access, `@ts-ignore`, and `any` usage with typed interfaces and a shared Anchor client builder.

What was added:
- `types/solana-wallet.ts` — `SolanaWalletProvider`, `AnchorWalletAdapter`, `SolanaRpcConfig` typed interfaces
- `lib/solana.ts` — `getWalletProvider()`, `prepareAnchorClient()`, `deriveAgreementPda()`, `deriveConfigPda()`, `sha256Bytes()`, `sha256Hex()`, `bytesToHex()`, `explorerUrl()` shared utilities
- `use-phantom-wallet.ts` refactored to use typed `SolanaWalletProvider` and `getWalletProvider()` instead of `window as any`
- `TenantAgreementPanel.tsx` and `LandlordDashboard.tsx` refactored to use shared `prepareAnchorClient()` from `lib/solana.ts` — eliminated duplicated wallet adapter code and `@ts-ignore` directives
- `env.local.example` updated with `NEXT_PUBLIC_SOLANA_RPC_URL` and `NEXT_PUBLIC_SOLANA_CLUSTER` env vars for centralized RPC configuration
- Error handlers use `unknown` type with `instanceof Error` narrowing instead of `any`

**Post-hackathon:** Migrate from `window.solana` to the full Wallet Standard (`@solana/wallet-adapter`) for multi-wallet support. Add a private RPC proxy endpoint to avoid exposing API keys in the browser.

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
