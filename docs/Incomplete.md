# NestFind Incomplete Work

Last verified against source: 2026-06-24

This file summarizes the major work that is still incomplete after reviewing the current source code under `apps/nestfind` and `programs/escrow`.

## 1. Durable auth and user storage

Role-based login, registration, cookie sessions, middleware protection, and demo users are implemented.

Still missing:

- Persist users in durable storage instead of the current in-memory map.
- Persist profile data across server restarts.
- Tie application users more cleanly to escrow wallet identities.

## 2. Wallet-standard hardening

The browser client now has typed wallet helpers and shared Solana utilities, but it still depends on injected `window.solana`.

Still missing:

- Full Wallet Standard registry support or `@solana/wallet-adapter`.
- Multi-wallet browser support beyond the current Phantom-oriented flow.
- A stronger production RPC strategy than directly exposing browser RPC configuration.

## 3. Stronger escrow persistence and indexing

Escrow persistence exists in Couchbase for agreements, transactions, users, evidence, and indexed events. The UI also writes to those APIs after successful actions.

Still missing:

- Move escrow documents out of the shared `listings` collection into a dedicated Couchbase collection.
- Replace best-effort browser-triggered persistence with a more reliable server-side write path.
- Upgrade the indexer from account scans plus synthetic events to real event/signature ingestion with durable cursors.
- Improve recovery and replay after Couchbase or indexer failures.
- Preserve stronger listing linkage in indexed agreement records.

## 4. Evidence and moderator workflow depth

Dispute text evidence can be stored off-chain and hash-checked against the on-chain agreement.

Still missing:

- File upload or richer evidence storage.
- A fuller moderator review workflow that loads and compares stored evidence more directly inside the dispute-resolution UI.

## 5. Landlord reputation completion

The program now has landlord profile/stake PDAs, stake enforcement on approval, and multiple stake/risk UI panels.

Still missing:

- Automatic updates to `completed_rentals`.
- Automatic updates to `disputes_lost`.
- A cleaner first-time landlord profile initialization UX in the browser stake flow.

## 6. Frontend and integration test gaps

The repo has Bankrun tests, devnet e2e coverage, and some verification scripts.

Still missing:

- Frontend unit tests for PDA derivation, listing-hash derivation, state decoding, amount conversion, and wallet/account mapping.
- Mocked wallet/UI tests for rejection, RPC failures, failed confirmation, disconnect, and account changes.
- Devnet coverage for `release_after_deadline`.
- A recorded successful `pnpm run verify` pass for the PWA.
- Production-build verification for install/offline behavior and responsive escrow flows.

## 7. Product-level follow-on work

Still missing:

- Landlord listing creation and listing-management workflows.
- Push notifications and saved-search alerts beyond the local demo notification flow.
- Analytics, monitoring, and richer historical activity views.
- Production deployment hardening and operational readiness.
