# NestFind Progress

Last updated: 2026-06-24

## Current status

NestFind has a working Next.js PWA for Agora-powered apartment discovery, a native-SOL rental deposit escrow program deployed on Solana devnet, Couchbase-backed off-chain escrow persistence, and a lightweight role-based web auth flow. The browser app supports tenant, landlord, and moderator escrow actions against the deployed program. The codebase also now includes landlord stake/profile primitives and UI surfaces for risk/reputation display.

## Implemented

### Next.js application shell

- Next.js 16 and React 19 application with responsive layouts.
- Installable PWA manifest, icons, service-worker registration, shell caching, online/offline state, and offline fallback page.
- Browser install prompt and notification-permission control with local demo notifications.
- Public landing page and protected dashboard route groups.

### Authentication and role routing

- Registration and login pages with tenant, landlord, and moderator roles.
- JWT-like session cookie flow for login, registration, current-user lookup, and logout.
- Route middleware that protects `/tenant/*`, `/landlord/*`, and `/moderator/*` and redirects by role.
- Shared auth context for client-side session refresh and role-aware redirects.
- Seeded demo accounts for all three roles.

Current limitation:

- User storage is still in-memory only; accounts are not persisted across server restarts.

### Agora voice agent and apartment discovery

- Agora Conversational AI voice session start and stop lifecycle.
- Server-side RTC/RTM token generation without exposing the Agora App Certificate to the browser.
- Browser microphone selection and audio publishing.
- Spoken AI responses.
- Live partial transcripts and completed conversation history.
- Correct handling of user and agent transcript identities and interrupted turns.
- Agent prompt configured for the Da Nang apartment-search scenario.
- Voice requests trigger apartment searches after completed user turns.
- API routes for token generation, starting the agent, stopping the conversation, and custom chat completions.

### Apartment search

- Local apartment catalog with varied prices, neighborhoods, sizes, and amenities.
- Optional Couchbase-backed listing reads with local fallback.
- Typed and spoken natural-language searches.
- Search filtering for location, budget, area, radius, move-in date, beds, baths, furnishing, parking, pets, and amenities.
- Follow-up searches replace previous results instead of appending duplicates.
- Search history and favorites stored in `localStorage`.
- Listings remain hidden until the user performs a voice or text search.
- Active filter chips and empty-result states.

### Couchbase

- Couchbase connection configuration and connection-check script.
- Listing catalog schema validation.
- Script for seeding apartment listings into Couchbase.
- Separate escrow persistence helpers for agreements, transactions, users, evidence, and indexed events.
- Configurable escrow collection via `COUCHBASE_ESCROW_COLLECTION` with `listings` as the current default.
- Escrow API routes for agreement CRUD, transaction logging, evidence storage/verification, wallet lookup, and manual indexer triggering.
- Demo user-wallet seeding script for escrow metadata.

### Solana rental deposit escrow

- Native devnet SOL deposits; no SPL token and no protocol fee.
- One-time program-wide moderator configuration.
- Agreement PDA derived from tenant, landlord, and SHA-256 listing hash.
- Tenant agreement creation with deposit amount and inspection deadline.
- Landlord approval or pre-funding rejection/cancellation.
- Tenant funding into the program-owned agreement PDA.
- Pre-funding cancellation by an authorized party.
- Tenant release of the deposit to the landlord.
- Dispute creation by tenant or landlord with a reason code and evidence hash.
- Final moderator decision for full landlord release or full tenant refund.
- Landlord release after an undisputed inspection deadline.
- Agreement lifecycle events for off-chain indexing.
- Agreement account closure and rent return to the tenant.

Devnet addresses:

- Program: `9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X`
- Config PDA: `7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq`
- Moderator: `34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e`

### Landlord stake and profile primitives

- On-chain `LandlordProfile` PDA derived from landlord wallet.
- `initialize_landlord_profile`, `stake_landlord`, and `unstake_landlord` instructions.
- Minimum-stake enforcement during `approve_agreement`.
- Stake/profile reads in the browser through `useLandlordProfile`.
- Stake and risk badges shown in listing cards and tenant agreement views.
- Landlord stake summary and reputation panels in the landlord workspace.
- Moderator risk panel and landlord wallet lookup UI.

Current limitation:

- The program stores `completed_rentals` and `disputes_lost` fields, but the current source does not update those counters during agreement resolution, so reputation remains only partially realized.

### Wallet integration

- Shared typed `usePhantomWallet` hook with `disconnect` and `accountChanged` handling.
- Automatic wallet detection on page load.
- Shared Solana helper module for provider access, connection creation, PDA derivation, hashing, and Explorer links.
- Wallet disconnect clears component state.
- Account switching reloads relevant agreement queues.
- Base58 public key validation for listing landlord wallets.
- Wrong-network and insufficient-balance preflight checks.

Current limitation:

- Provider discovery still relies on injected `window.solana`; full Wallet Standard registry support or `@solana/wallet-adapter` integration is not implemented.

### Tenant escrow UI (`TenantAgreementPanel`)

- Read-only landlord wallet sourced from listing data.
- Listing hash and derived agreement PDA preview before submission.
- Landlord reputation panel sourced from on-chain landlord profile data.
- Invalid landlord wallet detection and tenant/landlord/moderator role checks.
- On-chain `createAgreement`, `fundAgreement`, `cancelAgreement`, `releaseByTenant`, `openDispute`, `approveAgreement`, `releaseAfterDeadline`, and `resolveDispute`.
- Role-based button visibility from on-chain account state.
- Per-transaction phase feedback, Explorer links, and refresh-time agreement reload.
- Best-effort persistence of created agreements, actions, and dispute evidence via escrow API routes.

### Landlord escrow UI (`LandlordDashboard`)

- Landlord agreement queue discovered from on-chain accounts.
- Agreement cards showing tenant, deposit, deadline, and listing metadata.
- On-chain `approveAgreement`, `cancelAgreement`, `releaseAfterDeadline`, `openDispute`, and `resolveDispute`.
- Landlord stake summary card with on-chain stake/unstake actions.
- Landlord reputation panel sourced from on-chain landlord profile data.
- Per-card transaction feedback and Explorer links.
- Best-effort transaction and evidence persistence.

### Moderator escrow UI (`ModeratorDashboard`)

- Moderator-only dispute queue sourced from on-chain disputed agreements.
- Centralized-moderator disclaimer in the escrow workspace.
- On-chain full release and full refund dispute resolution actions.
- Landlord risk panel on disputed agreements using stake/profile data.
- Manual landlord wallet lookup for risk assessment.

### Testing and verification assets

- Bankrun tests for tenant release, moderator refund, unauthorized moderator rejection, pre-funding cancellation, deadline-gated landlord release, landlord profile initialization/staking, low-stake rejection, and unstaking.
- Devnet e2e test suite covering happy path, cancellation, outsider authorization failure, and dispute refund flows.
- Root `verify:escrow` command for the devnet test suite.
- Verification scripts for apartment search and API contracts.

## Still left

### High-priority gaps

- Replace in-memory auth/user storage with persistent server-side storage.
- Add full Wallet Standard or `@solana/wallet-adapter` integration instead of relying on injected `window.solana`.
- Strengthen escrow indexing from account scans plus synthetic events to real event/signature ingestion with durable cursors.
- Finish production-grade evidence handling, including file upload/storage rather than text-only records.
- Run and record a full production-build PWA verification pass for offline/install behavior and responsive escrow flows.

### Partially implemented areas

- Landlord reputation exists as profile/stake UI, but reputation counters are not yet automatically updated from completed agreements and dispute outcomes.
- Escrow persistence exists, but browser writes are still best-effort and the indexer is still lightweight.
- Separate dashboard pages exist under route groups, but the richer escrow workspaces currently live in the landing-page apartment app rather than being fully unified into those protected dashboards.

### Larger product work

- Landlord listing creation and listing-management workflows.
- Push notifications and automatic saved-search alerts.
- Analytics, monitoring, and richer historical activity views.
- Production deployment hardening and operational readiness.

## Immediate next milestone

Persist auth and escrow data more robustly, complete wallet-standard hardening, and close the remaining verification gaps around production PWA behavior and richer on-chain indexing.
