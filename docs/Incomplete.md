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

The Anchor program has Bankrun coverage and the browser client implements the main flows, but the docs still call out missing real devnet validation.

Still missing:

- Run and record a full multi-wallet devnet scenario:
  - tenant creates agreement;
  - landlord approves;
  - tenant funds;
  - tenant release or dispute;
  - moderator resolution or landlord timeout release.
- Verify `createAgreement` and the full browser flow with distinct devnet wallets.
- Confirm all protected actions fail from unauthorized wallets in the real browser/devnet path.
- Run the complete PWA verification pipeline and record the final result.
- Verify the production PWA build for install/offline behavior and responsive escrow UI.

## 3. Wallet and client hardening

The current implementation still uses Phantom-specific browser access.

Still missing:

- Replace direct `window.solana` usage, `any`, and `@ts-ignore` wallet handling with Wallet Standard or `@solana/wallet-adapter`.
- Decide and implement a safer production RPC strategy instead of depending on unrestricted browser RPC configuration.
- Add stronger typed wallet interfaces across the escrow client.

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
