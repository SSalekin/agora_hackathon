# NestFind Escrow TODO

> Source-audited on 2026-06-24. This is the current escrow backlog after reconciling the docs with the codebase.

## Current milestone

Turn the existing devnet escrow prototype into a more durable, production-like demo:

1. Persist auth and escrow state reliably.
2. Replace the Phantom-specific wallet path with proper multi-wallet support.
3. Improve event indexing and evidence handling.
4. Finish production-build verification for the PWA flows.

## Completed foundations

### Core escrow flow

- [x] Deploy and initialize the escrow program on Solana devnet.
- [x] Repair and synchronize the PWA IDL copy.
- [x] Implement `create_agreement`, `approve_agreement`, `fund_agreement`, `cancel_agreement`, `release_by_tenant`, `open_dispute`, `resolve_dispute`, and `release_after_deadline`.
- [x] Remove the duplicate browser-side transfer in the funding flow.
- [x] Decode Anchor enum state objects into stable UI state names.
- [x] Show transaction phases, signatures, errors, and Solana Explorer links.
- [x] Validate landlord public keys, role separation, deadlines, wrong network, and balance before submission.
- [x] Display the listing hash and derived agreement PDA before submission.
- [x] Load agreement state again after refresh instead of keeping it only in local component state.

### Role-specific workspaces

- [x] Tenant agreement panel with all main escrow actions.
- [x] Landlord agreement queue with approve, cancel, timeout release, dispute, and resolve actions.
- [x] Moderator dispute queue with final release/refund actions and centralized-moderator disclaimer.

### Persistence and off-chain support

- [x] Add Couchbase-backed escrow persistence helpers for users, agreements, transactions, evidence, and events.
- [x] Add escrow API routes for agreement CRUD, transaction logs, evidence storage/verification, and indexer triggering.
- [x] Persist agreement creation and follow-up actions from the browser on a best-effort basis.
- [x] Store text evidence off-chain and expose hash verification through the evidence route.
- [x] Add a lightweight account-scan indexer that persists agreements and reconciles state drift.

### Landlord profile and stake support

- [x] Add on-chain landlord profile PDA support.
- [x] Add `initialize_landlord_profile`, `stake_landlord`, and `unstake_landlord`.
- [x] Enforce minimum active landlord stake during agreement approval.
- [x] Surface landlord stake/risk information in listing, tenant, landlord, and moderator UI.

### Testing

- [x] Pass Bankrun coverage for agreement lifecycle, authorization checks, stake initialization, low-stake rejection, and unstaking.
- [x] Add a devnet e2e suite for happy path, cancellation, outsider rejection, and dispute refund flows.
- [x] Confirm unauthorized outsider actions fail in automated coverage.

## Still left

### Persistence and indexing

- [ ] Move escrow documents out of the shared Couchbase `listings` collection into a dedicated collection.
- [ ] Replace best-effort browser-triggered escrow persistence with a more reliable server-side write path.
- [ ] Upgrade indexing from account scans plus synthetic events to real event/signature ingestion with durable cursors.
- [ ] Persist stronger linkage between indexed agreements and listing IDs; the current indexer falls back to empty `listingId` for chain-discovered agreements.
- [ ] Add stronger recovery/replay behavior after indexer or Couchbase failures.

### Evidence handling

- [ ] Support dispute file uploads or richer evidence storage instead of text-only evidence records.
- [ ] Wire moderator review screens to load and compare stored evidence records more explicitly during dispute resolution.

### Wallet and client hardening

- [ ] Replace injected `window.solana` discovery with Wallet Standard registry support or `@solana/wallet-adapter`.
- [ ] Add multi-wallet browser support beyond the current Phantom-oriented path.
- [ ] Move to a safer production RPC strategy than exposing browser RPC configuration directly.

### Authentication and user persistence

- [ ] Replace in-memory user storage with durable server-side persistence.
- [ ] Persist role-based user profiles instead of reseeding only demo accounts in memory.
- [ ] Connect app users more cleanly to escrow wallet identities.

### Reputation and landlord profile completion

- [ ] Update `completed_rentals` automatically from completed agreements.
- [ ] Update `disputes_lost` automatically from dispute outcomes.
- [ ] Add automated coverage for landlord profile lifecycle in the browser UI.
- [ ] Fix the landlord stake UI initialization path so first-time landlords can initialize a profile explicitly instead of relying on stake flow assumptions.

### Testing and verification

- [ ] Add focused frontend tests for PDA derivation, listing hash derivation, state decoding, amount conversion, and wallet/account mapping.
- [ ] Add mocked wallet tests for signature rejection, RPC failure, failed confirmation, disconnect, and account-change behavior.
- [ ] Add devnet coverage for `release_after_deadline`.
- [ ] Run and record the full `pnpm run verify` result from the PWA side.
- [ ] Verify install/offline behavior and responsive escrow UI in a production PWA build.

## Out of scope for the current prototype

- Mainnet or real-money use.
- Production custody claims or security-audit claims.
- Moderator rotation, multisig governance, or appeals.
- Partial dispute payouts.
- SPL Token, Token-2022, or stablecoin deposits.
- Protocol fees.
