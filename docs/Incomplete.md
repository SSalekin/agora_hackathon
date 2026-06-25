# NestFind Incomplete Work

Last verified against source: 2026-06-25

This file summarizes the major work that is still incomplete after reviewing the current source code under `apps/nestfind` and `programs/escrow`.

## 1. Durable auth and user storage

Role-based login, registration, cookie sessions, middleware protection, and demo users are implemented.

Still missing:

- Persist users in durable storage instead of the current in-memory map.
- Persist profile data across server restarts.
- Tie application users more cleanly to escrow wallet identities.
- Remove demo-user reseeding from runtime auth paths so `/api/auth/login`, `/api/auth/register`, and `/api/auth/me` do not depend on process-local bootstrap state.

## 2. Auth and API security hardening

The app has a working lightweight auth flow, but several parts are still prototype-grade from a security perspective.

Still missing:

- Replace the custom password hashing with a modern password KDF such as Argon2, scrypt, or bcrypt.
- Replace the custom JWT signing/verification with a standard JOSE/JWT implementation.
- Verify JWT signatures in middleware instead of only base64-decoding payload claims.
- Remove the development fallback JWT secret and require a real secret in deployed environments.
- Add authorization checks on escrow persistence routes so arbitrary clients cannot write agreement, transaction, evidence, or indexer state without proving identity and role.
- Add request validation and rate limiting on public POST/GET API surfaces such as auth, token generation, chat completions, and agent lifecycle routes.

## 3. Wallet-standard hardening

The browser client now has typed wallet helpers and shared Solana utilities, but it still depends on injected `window.solana`.

Still missing:

- Full Wallet Standard registry support or `@solana/wallet-adapter`.
- Multi-wallet browser support beyond the current Phantom-oriented flow.
- A stronger production RPC strategy than directly exposing browser RPC configuration.
- Better wallet lifecycle handling around reconnect, account switching, missing capabilities, and non-Phantom providers.

## 4. Escrow persistence, indexing, and data integrity

Escrow persistence exists in Couchbase for agreements, transactions, users, evidence, and indexed events. The UI also writes to those APIs after successful actions.

Still missing:

- Move escrow documents out of the shared `listings` collection into a dedicated Couchbase collection.
- Replace best-effort browser-triggered persistence with a more reliable server-side write path.
- Upgrade the indexer from account scans plus synthetic events to real event/signature ingestion with durable cursors.
- Improve recovery and replay after Couchbase or indexer failures.
- Preserve stronger listing linkage in indexed agreement records.
- Stop building N1QL queries by string interpolation for wallet/state/PDA values; switch to parameterized queries.
- Add idempotency and conflict-control rules so repeated POST/PATCH calls cannot silently overwrite valid agreement or evidence state.
- Add a durable mapping between application users, landlord profiles, and listing ownership instead of trusting client-submitted wallet/listing metadata.

## 5. Escrow correctness gaps

The on-chain program and the web persistence layer cover the main happy paths, but they still have correctness gaps that should be fixed before calling the escrow flow complete.

Still missing:

- Fix dispute refunds so moderator resolution to tenant actually transfers the escrowed lamports back instead of only changing state and closing the account.
- Add automated tests that explicitly assert final balances for every terminal path: tenant release, landlord release after deadline, dispute refund, dispute release, and cancellation.
- Prevent off-chain API state from drifting away from the actual on-chain result when browser-triggered persistence fails partway through a transaction flow.

## 6. Evidence and moderator workflow depth

Dispute text evidence can be stored off-chain and hash-checked against the on-chain agreement.

Still missing:

- File upload or richer evidence storage.
- A fuller moderator review workflow that loads and compares stored evidence more directly inside the dispute-resolution UI.
- Stronger evidence authenticity guarantees than storing plain submitted text plus a hash in Couchbase.

## 7. Landlord reputation completion

The program now has landlord profile/stake PDAs, stake enforcement on approval, and multiple stake/risk UI panels.

Still missing:

- Automatic updates to `completed_rentals`.
- Automatic updates to `disputes_lost`.
- A cleaner first-time landlord profile initialization UX in the browser stake flow.
- A real landlord directory or wallet-to-user mapping instead of the current demo-wallet assumptions in listing data and dashboards.

## 8. Demo-data and product workflow completion

The app demonstrates the flow well, but several user-facing surfaces still rely on static or demo-only data.

Still missing:

- Replace hard-coded local listings and demo landlord wallets with landlord-created listings backed by durable storage.
- Fix the login-page demo landlord shortcut so it points to a real seeded landlord account instead of a non-existent `landlord@demo.com`.
- Add listing ownership, editing, publishing, and archival workflows for landlords.
- Replace local/demo notification behavior with a real saved-search and push-notification pipeline.

## 9. Frontend and integration test gaps

The repo has Bankrun tests, devnet e2e coverage, and some verification scripts.

Still missing:

- Frontend unit tests for PDA derivation, listing-hash derivation, state decoding, amount conversion, and wallet/account mapping.
- Mocked wallet/UI tests for rejection, RPC failures, failed confirmation, disconnect, and account changes.
- Devnet coverage for `release_after_deadline`.
- A recorded successful `pnpm run verify` pass for the PWA.
- Production-build verification for install/offline behavior and responsive escrow flows.
- API tests for auth/session behavior, authorization enforcement, and Couchbase-backed escrow document routes.

## 10. Product-level follow-on work

Still missing:

- Landlord listing creation and listing-management workflows.
- Push notifications and saved-search alerts beyond the local demo notification flow.
- Analytics, monitoring, and richer historical activity views.
- Production deployment hardening and operational readiness.
