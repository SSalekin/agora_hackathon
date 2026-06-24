# NestFind Escrow TODO

> Source-audited on 2026-06-23. This is the actionable backlog for the hackathon prototype. Completed product features are summarized in [`NestFind Progress.md`](./NestFind%20Progress.md).

## Current milestone

Complete a browser-based, multi-wallet devnet demonstration:

1. A tenant finds a listing and creates an agreement.
2. The landlord reviews and approves or rejects the exact terms.
3. The tenant funds the approved agreement with devnet SOL.
4. The tenant releases the deposit or opens a dispute.
5. The landlord claims an undisputed deposit after the deadline, or the moderator resolves a dispute.

## Critical blockers

- [x] Repair `apps/nestfind/idl/escrow.json`; it is valid JSON, matches `programs/escrow/target/idl/escrow.json` semantically, and no longer breaks PWA typecheck.
- [x] Add a repeatable IDL synchronization command so the PWA copy cannot drift from the deployed Anchor program.
- [x] Align and install the browser client on `@anchor-lang/core` 1.0.2, refresh the lockfile, and restore a successful production build.
- [x] Remove the extra `SystemProgram.transfer` from `TenantAgreementPanel.fundAgreement()` so the on-chain instruction performs the deposit exactly once.
- [x] Decode Anchor enum state objects into stable names such as `awaitingLandlordApproval`, `awaitingFunding`, and `funded`. Implemented in `lib/escrow.ts` via `decodeAgreementState`.
- [x] Require and validate an explicit landlord public key. Implemented via `landlordWallet` on `ApartmentListing`, read-only display, and base58 validation.

## PWA escrow integration

### Wallet foundation — implemented

- [x] Add Solana Web3 and Anchor browser dependencies.
- [x] Copy an escrow IDL into the PWA repository. It must still be repaired and synchronized as described above.
- [x] Add a listing-card action that opens a tenant agreement panel.
- [x] Add minimal Phantom detection through `window.solana`.
- [x] Show transaction phases, signatures, errors, and Solana Explorer links.
- [x] Handle wallet disconnect and account changes via shared `usePhantomWallet` hook.
- [x] Replace direct `window.solana` access and `any`/`@ts-ignore` usage with Wallet Standard support and typed wallet interfaces.
- [x] Handle wrong network, unavailable wallet, rejected signatures, and insufficient balance.
- [x] Decide how browser RPC access is provided without exposing an unrestricted provider API key.

### Listing and agreement terms

- [x] Add the landlord wallet address to each local and Couchbase listing.
- [x] Add the landlord-proposed deposit amount and default inspection period/deadline to listing or agreement-term data.
- [x] Stop asking tenants to type trusted landlord/deposit values when those values should come from the selected listing. Landlord is read-only from listing; deposit remains user-input.
- [x] Validate SOL amount precision, future deadlines, role separation, and listing configuration before requesting a signature.
- [x] Display the listing ID hash and derived agreement PDA before submission.

### Tenant actions

- [x] Derive the listing SHA-256 hash and agreement PDA in the browser.
- [x] Implement an initial on-chain `create_agreement` transaction path.
- [x] Fetch the agreement account immediately after creation.
- [ ] Repair and verify `create_agreement` against the deployed program using two distinct devnet wallets.
- [x] Implement the client transaction for on-chain `fund_agreement` without a duplicate transfer.
- [x] Implement on-chain `cancel_agreement`.
- [x] Implement on-chain `release_by_tenant`.
- [x] Implement on-chain `open_dispute` with a non-zero reason code and a 32-byte evidence hash.
- [x] Load an existing agreement PDA after refresh instead of keeping the agreement only in component state.

### Landlord actions

- [x] Add a landlord dashboard or agreement view.
- [x] Discover agreements assigned to the connected landlord.
- [x] Display the exact tenant, listing hash, deposit amount, and deadline before approval.
- [x] Implement on-chain `approve_agreement`.
- [x] Implement landlord rejection/pre-funding cancellation through `cancel_agreement`.
- [x] Implement on-chain `release_after_deadline` with a clear countdown and early-release error state.

### Moderator actions

- [x] Add a moderator-only dispute queue with a disclaimer that the hackathon moderator is centralized and decisions are final.
- [ ] Load the off-chain reason/evidence record and verify its hash against the agreement account.
- [x] Implement `resolve_dispute(true)` for full release to the landlord.
- [x] Implement `resolve_dispute(false)` for full refund to the tenant.

### Persistence and indexing

- [ ] Map Couchbase users and landlords to Solana wallet public keys.
- [ ] Persist agreement PDA, listing hash, tenant, landlord, deposit, deadline, and current indexed state.
- [ ] Persist every transaction signature and its action/confirmation status.
- [ ] Store dispute descriptions/files off-chain and only the reason code plus evidence hash on-chain.
- [ ] Index `AgreementCreated`, `LandlordApproved`, `DepositFunded`, `DisputeOpened`, `DepositReleased`, `DepositRefunded`, and `AgreementCancelled` events.
- [ ] Make event processing idempotent and reconcile indexed state with the chain after failures.

## Testing and demo readiness

- [x] Pass Bankrun coverage for tenant release, moderator refund, unauthorized moderator rejection, pre-funding cancellation, and deadline-gated landlord release.
- [x] Deploy program `9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X` to Solana devnet.
- [x] Initialize config PDA `7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq` with moderator `34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e`.
- [x] Pass apartment-search and API contract verification scripts.
- [x] Restore a passing PWA typecheck by repairing the malformed IDL.
- [ ] Add unit tests for PDA/hash derivation, state decoding, amount conversion, and account mapping.
- [ ] Add mocked wallet tests for signature rejection, RPC failure, failed confirmation, and account changes.
- [ ] Run the full tenant → landlord → tenant → moderator/timeout flow with separate devnet wallets.
- [ ] Confirm no action succeeds from an unauthorized connected wallet.
- [ ] Run `pnpm run verify` in the PWA with Node.js 22+ and record the final result.
- [ ] Verify install/offline behavior and responsive escrow UI in a production PWA build.
- [ ] Rotate the RPC API key exposed during deployment diagnostics and update the ignored local environment file.

## Completed foundations

### Agora and search

- [x] Agora Conversational AI join/leave lifecycle with server-side RTC/RTM token generation.
- [x] Live partial and completed transcripts, agent audio, microphone controls, connection status, and pipeline metrics.
- [x] Voice and text apartment searches with results hidden until the user asks to search.
- [x] Follow-up searches replace previous result sets.
- [x] Filters for budget, location, radius, move-in date, area, bedrooms, bathrooms, furnishing, parking, pets, and amenities.
- [x] Local listing catalog plus optional Couchbase catalog reads and seeding tools.
- [x] Installable PWA shell, offline fallback, saved listings, and local search history.

### On-chain program

- [x] Native devnet SOL escrow with no protocol fee.
- [x] One-time fixed moderator configuration.
- [x] Tenant/landlord/listing-hash agreement PDA and distinct-role checks.
- [x] Tenant creation, landlord approval, pre-funding cancellation, and tenant funding.
- [x] Tenant release, dispute creation, moderator full release/refund, and landlord timeout release.
- [x] Compact on-chain evidence references and lifecycle events.
- [x] Agreement account closure with reclaimed rent returned to the tenant.
- [x] Generated IDL/types, SBF artifact, Bankrun tests, and devnet deployment.

## Approved hackathon constraints

- Devnet test SOL only; never use mainnet or real funds.
- One fixed program-wide moderator; no rotation, multisig, or appeal in this prototype.
- Full release or full refund only; no split decisions.
- Human-readable listings, profiles, and evidence remain in Couchbase/off-chain storage.
- Authorization-critical fields and compact hashes remain on-chain.
- One active agreement per tenant/landlord/listing combination.
- No SPL Token, Token-2022, stablecoin, or protocol-fee support.
- This is unaudited prototype custody software and must not be represented as production-ready.
