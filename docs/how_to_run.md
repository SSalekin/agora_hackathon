# How to Run NestFind

## Quick Start (PWA)

From the repo root:

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The `ensure:env` script automatically creates `apps/nestfind/.env.local` from root `.env` on first run. Fill in `NEXT_PUBLIC_AGORA_APP_ID` and `NEXT_PUBLIC_AGORA_APP_CERTIFICATE` before starting a voice conversation.

## Build for Production

```bash
pnpm run build
pnpm run start
```

## Run Specific Features

### Voice conversation (Agora)

Requires valid Agora credentials in `apps/nestfind/.env.local`. Start the dev server and open the app — the conversation UI boots on the landing page.

### Couchbase-backed listings

```bash
USE_COUCHBASE=true pnpm run dev
```

Or set `USE_COUCHBASE=true` in `apps/nestfind/.env.local` permanently. See [how_to_setup.md](./how_to_setup.md#6-couchbase-optional) for full Couchbase configuration.

### Anchor escrow program

```bash
pnpm run anchor:build    # build the Solana program
pnpm test                # run bankrun tests
```

To deploy to devnet:

```bash
solana config set --url devnet
pnpm run anchor:initialize:devnet
```

## Verify Before a Demo

```bash
pnpm run verify
```

Runs: doctor → lint → typecheck → API contracts → apartment verification → build.

## Quick Verification Commands

| Command | What it checks |
|---------|---------------|
| `pnpm run doctor` | Environment health |
| `pnpm run lint` | ESLint |
| `pnpm run typecheck` | TypeScript |
| `pnpm run verify:api` | API route contracts |
| `pnpm run build` | Production build |
