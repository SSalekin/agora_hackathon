# NestFind Progress

Last updated: 2026-06-23

## Current status

NestFind has a working Next.js PWA for Agora-powered apartment discovery and a tested native-SOL rental deposit escrow deployed on Solana devnet. The main missing milestone is connecting the PWA to wallets and the deployed escrow for a complete browser-based transaction flow.

## Implemented

### Next.js apartment PWA

- Next.js 16 and React 19 application with responsive desktop and mobile layouts.
- Installable PWA manifest, application icons, service-worker registration, application-shell caching, online/offline state, and an offline fallback page.
- Browser install prompt and notification-permission control with a local confirmation notification.
- Demo sign-in profile stored on the device.
- Saved apartment favorites and search history stored in `localStorage`.
- Discover, Saved, and History views.
- Listings remain hidden until the user performs a voice or text search.
- New and refined searches replace previous results instead of appending duplicates.

### Agora voice agent

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

- Local dummy apartment catalog with varied prices, neighborhoods, sizes, and amenities.
- Typed and spoken natural-language searches.
- Search filtering for:
  - location, neighborhood, university, or landmark;
  - minimum and maximum monthly rent;
  - minimum and maximum floor area;
  - maximum distance/radius;
  - move-in date;
  - minimum bedrooms;
  - minimum bathrooms;
  - furnished or unfurnished;
  - parking required or not required;
  - pets allowed or not allowed;
  - requested amenities.
- Follow-up requests can refine location, budget, size, and other active criteria.
- Active filter chips and matched-listing counts in the UI.
- Empty-result states for searches with no exact matches.

### Couchbase

- Couchbase Capella connection configuration and connection-check script.
- Listing catalog schema validation.
- Script for seeding the local apartment catalog into Couchbase.
- Listing reads from Couchbase when configured, with local catalog fallback when it is not configured.
- Couchbase setup documentation.

### Solana rental deposit escrow

- Native devnet SOL deposits; no SPL token and no protocol fee.
- One-time program-wide moderator configuration.
- Agreement PDA derived from tenant, landlord, and the SHA-256 listing ID hash.
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
- Five passing Bankrun lifecycle and authorization tests.
- Rust tests, formatting, TypeScript checking, and generated IDL/types.
- Program deployed and initialized on Solana devnet.

Devnet addresses:

- Program: `9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X`
- Config PDA: `7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq`
- Moderator: `34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e`

## Yet to implement

### Required for the hackathon end-to-end demo

- Add Phantom/Wallet Standard connection to the Next.js PWA.
- Add landlord wallet addresses and proposed deposit terms to listing data.
- Copy the generated escrow IDL/client configuration into the PWA build.
- Add tenant UI for creating, funding, cancelling, releasing, and disputing an agreement.
- Add landlord UI for approving/rejecting terms and releasing after the deadline.
- Add moderator UI for reviewing and resolving disputes.
- Display live agreement state, balances, deadlines, transaction progress, errors, signatures, and Solana Explorer links.
- Persist wallet mappings, agreement PDAs, listing hashes, evidence hashes, and transaction signatures in Couchbase.
- Run one complete multi-wallet devnet scenario from listing search through final release/refund.
- Add browser-level tests for wallet and escrow UI behavior.

### Product features not yet implemented

- Landlord reputation calculated from completed on-chain agreements and dispute outcomes.
- Real user authentication and server-side user profiles; the current sign-in is a local demo profile.
- Landlord listing creation and listing-management workflow.
- Evidence upload/storage for disputes; the program currently stores only a reason code and hash.
- Backend push notifications and automatic saved-search alerts; the current notification control only demonstrates local browser notifications.
- Production deployment verification on Vercel or another host.
- Analytics, monitoring, and indexed on-chain event history.

### Explicitly outside the current hackathon scope

- Mainnet or real-money usage.
- Production security audit or a production-custody claim.
- Moderator rotation, multisig governance, or compromised-key recovery.
- Partial dispute payouts or on-chain appeals.
- SPL Token, Token-2022, or stablecoin deposits.
- Protocol fees.

## Immediate next milestone

Implement Phantom/Wallet Standard and the tenant agreement-creation flow in the Next.js PWA, then extend the same client to landlord and moderator actions for the full devnet demonstration.
