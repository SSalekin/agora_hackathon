• The Rust app is not a second website or server. It compiles into a Solana program that is deployed once to devnet. The Next.js app is the only application
  that visitors open.

  User browser + Phantom
          │
          ├── Next.js UI → Vercel API routes → Agora
          │                              └── Couchbase
          │
          └── Solana RPC → deployed Anchor program

  Your Anchor program is already deployed:

  - Program: 9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X
  - Config: 7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq

  You do not need to run the Rust project continuously. You only redeploy it when its Rust code changes.

  ## How each part works

  The deployed Next.js application handles:

  - The PWA interface.
  - Apartment searches.
  - Agora token generation.
  - Starting and stopping the voice agent.
  - Live transcripts and audio.
  - Optional Couchbase access.
  - Building Solana transactions for Phantom to sign.

  Agora handles:

  - RTC microphone/audio transport.
  - Speech recognition.
  - LLM responses.
  - Text-to-speech.
  - RTM transcripts and agent events.

  Solana handles:

  - Agreement creation.
  - Landlord approval.
  - Deposit custody.
  - Release, refund, dispute, and deadline rules.

  Phantom signs transactions in the tester’s browser. Vercel must never receive or store wallet seed phrases.

  ## What must be fixed first

  The complete demo is not deployable yet. Although IDL parsing and typecheck are fixed, production build currently fails because the browser Anchor
  dependency is missing from the lockfile/install.

  The remaining critical work is:

  1. Align and install the Anchor browser dependency.
  2. Remove the duplicate deposit transfer.
  3. Fix agreement-state decoding.
  4. Add landlord wallet/deposit details to listings.
  5. Implement landlord approval.
  6. Replace local-only cancel, release, and dispute buttons with transactions.
  7. Add landlord and moderator views.
  8. Pass:

  pnpm run verify

  The current status is tracked in anchor/TODO.md.

  ## Deploy the Next.js application

  Push the project to GitHub, then import it into Vercel.

  - If GitHub contains the entire hackathon folder, set Vercel’s Root Directory to smart-apartment-finder.
  - If GitHub contains only smart-apartment-finder, leave Root Directory as ..

  Vercel supports Next.js directly and allows selecting a subdirectory for monorepos. Next.js deployment
  (https://vercel.com/docs/concepts/next.js/overview), monorepo configuration (https://vercel.com/docs/monorepos/).

  Configure Node.js 22 or newer and these Vercel environment variables:

  NEXT_PUBLIC_AGORA_APP_ID=
  NEXT_AGORA_APP_CERTIFICATE=
  NEXT_PUBLIC_AGENT_UID=123456

  NEXT_PUBLIC_SOLANA_CLUSTER=devnet
  NEXT_PUBLIC_SOLANA_RPC_URL=

  Optional Couchbase variables:

  COUCHBASE_CONN_STR=
  COUCHBASE_USERNAME=
  COUCHBASE_PASSWORD=
  COUCHBASE_BUCKET=nestfind
  COUCHBASE_SCOPE=_default
  COUCHBASE_COLLECTION=listings

  For the first public demo, I recommend leaving Couchbase disabled and using the bundled listing catalog. This removes one deployment failure point. Add
  Couchbase after the wallet flow works.

  Vercel environment variables apply only to new deployments, so redeploy after changing them. Vercel environment variables
  (https://vercel.com/docs/projects/environment-variables).

  Security rules:

  - NEXT_AGORA_APP_CERTIFICATE stays server-side.
  - Use a restricted, disposable devnet RPC key for NEXT_PUBLIC_SOLANA_RPC_URL; anything prefixed NEXT_PUBLIC_ is visible in the browser.
  - Never upload .env.local, anchor/.env, id.json, program keypairs, or seed phrases.

  ## How people test the demo

  Voice search requires only:

  1. Open the Vercel URL.
  2. Allow microphone access.
  3. Start the voice conversation.
  4. Ask Mai for apartments.
  5. Refine the budget, area, bedrooms, furnishing, parking, or pets.

  Escrow testing requires Phantom:

  1. Enable test networks and select Solana devnet.
  2. Fund the tester wallet with devnet SOL.
  3. Connect Phantom.
  4. Select a listing and create an agreement.

  The full workflow requires separate roles:

  1. Tenant wallet creates the agreement.
  2. Landlord wallet approves it.
  3. Tenant wallet funds it.
  4. Tenant releases or disputes.
  5. Moderator resolves disputes, or landlord releases after the deadline.

  For a hackathon demonstration, use separate Phantom browser profiles for tenant and landlord. Keep the fixed moderator wallet under team control and never
  deploy its private key to Vercel.
