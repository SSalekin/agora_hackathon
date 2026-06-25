# How to Test NestFind

## Quick Reference

```bash
pnpm run verify       # Full verification suite (safe without live Agora)
pnpm test             # Anchor bankrun tests
```

---

## Test Tiers

### Safe Without Any Credentials

These run entirely offline with no network or env setup:

```bash
pnpm run lint         # ESLint
pnpm run typecheck    # TypeScript strict mode
pnpm run verify:api   # API route contract checks (mocked)
pnpm run verify:apartment  # Apartment search logic checks
```

### Requires Env Setup (But No Live Services)

```bash
pnpm run doctor       # Checks Node, pnpm, env vars, Couchbase config
pnpm run verify       # Runs everything: doctor + lint + typecheck + verify:api + verify:apartment + build
```

### Requires Live Services

```bash
pnpm run dev          # Needs Agora credentials for voice conversation
pnpm run check:couchbase  # Needs live Couchbase cluster
```

### Anchor Tests

```bash
pnpm test             # Bankrun tests (local, no network)
pnpm run verify:escrow  # Devnet e2e test (needs funded devnet wallet)
```

---

## API Route Contract Verification

```bash
pnpm run verify:api
```

This runs `scripts/verify-api-contracts.ts`, which imports route handlers directly (no server needed) and verifies:

| Route | What it checks |
|-------|---------------|
| `GET /api/generate-agora-token` | Returns mocked RTC+RTM token, preserves uid and channel |
| `GET /api/generate-agora-token?uid=0` | Generates a non-zero RTM-safe uid |
| `POST /api/chat/completions` | Rejects missing env, invalid JSON, streams SSE with `[DONE]` |
| `POST /api/invite-agent` | Validates required fields, creates agent session with correct config |
| `POST /api/stop-conversation` | Validates required fields, calls `stopAgent` |
| `GET /api/listings?catalog=true` | Returns 18 local listings when Couchbase is disabled |

No live Agora or Couchbase connection required — all external calls are mocked.

## Apartment Search Verification

```bash
pnpm run verify:apartment
```

Runs `scripts/verify-apartment.ts`, which tests the natural-language apartment search engine:

- Budget parsing (spoken numbers, decimals, "five million VND")
- Location filtering (neighborhood matching)
- Radius filtering
- Room counts, furnished status, parking, pet-friendly
- Filter refinement and override (e.g., "increase budget to seven million")
- Custom catalog search
- `isListingSearchRequest()` intent detection
- `agentSignalsListingResults()` signal detection

No env vars or network required.

---

## Anchor / Solana Tests

### Bankrun Tests (Local)

```bash
pnpm test
```

Runs `programs/escrow/tests/bankrun.test.ts` using `solana-bankrun` for fast in-process Solana program testing. Tests the full escrow lifecycle: initialize, fund, release, refund, dispute.

### Devnet E2E Tests

```bash
pnpm run verify:escrow
```

Runs `programs/escrow/tests/devnet-e2e.ts` against live devnet. Requires:
- Funded devnet wallet
- Escrow program deployed at `9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X`
- `SOLANA_DEVNET_RPC_URL` in root `.env`

---

## Couchbase Checks

```bash
pnpm run check:couchbase
```

Verifies:
- Connection to Couchbase cluster using `COUCHBASE_*` env vars
- Bucket accessibility
- Collection existence
- Read/write operations

Requires `USE_COUCHBASE=true` and valid `COUCHBASE_*` credentials in `apps/nestfind/.env.local`.

---

## Full Verification

```bash
pnpm run verify
```

Runs in order:
1. `pnpm run doctor` — environment health
2. `pnpm run lint` — ESLint
3. `pnpm run typecheck` — TypeScript
4. `pnpm run verify:api` — API contracts
5. `pnpm run verify:apartment` — apartment search logic
6. `pnpm run build` — production build

This is the command to run before demos or deployments.

---

## CI-Friendly Invocations

```bash
# Minimal check (fastest)
pnpm run lint && pnpm run typecheck

# Full safe suite
pnpm run verify

# Safe suite + Couchbase
pnpm run check:couchbase && pnpm run verify

# Anchor only
pnpm run anchor:build && pnpm test
```
