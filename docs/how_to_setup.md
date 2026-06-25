# How to Set Up NestFind

Step-by-step guide to get the full NestFind workspace running locally.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Install Dependencies](#3-install-dependencies)
4. [Environment Variables](#4-environment-variables)
5. [Run the PWA](#5-run-the-pwa)
6. [Couchbase (Optional)](#6-couchbase-optional)
7. [Anchor / Escrow Program (Optional)](#7-anchor--escrow-program-optional)
8. [Available Commands](#8-available-commands)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

Install these before working with the NestFind workspace:

| Tool | Version | Purpose |
|------|---------|---------|
| Git | latest | Source control |
| Node.js | >= 22 | Runtime |
| pnpm | 10 | Package manager |
| Rust + Cargo | latest | Anchor/Solana builds |
| Solana CLI | 3.1.x | Devnet interaction |
| Anchor CLI | 1.0.2 | Solana program development |

**Browser wallet:** Phantom or any Wallet Standard browser wallet (needed for escrow UI).

**Third-party accounts:**
- **Agora** (required) — sign up at [Agora Console](https://console.agora.io) and create a project to get an App ID and App Certificate.
- **Couchbase Capella** (optional) — free tier works. Only needed if you want to use Couchbase instead of the local in-memory listing catalog.

### Install Solana + Anchor toolchain

The official installer handles Rust, Solana CLI, and Anchor together:

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
```

Open a **new terminal** after installation and verify:

```bash
node --version       # should be 22+
pnpm --version       # should be 10
rustc --version
cargo --version
solana --version     # should be 3.1.x
anchor --version     # should be 1.0.2
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/anomalyco/GRRC.git
cd GRRC
```

---

## 3. Install Dependencies

From the repo root:

```bash
pnpm install
```

This installs all dependencies for both the Next.js PWA (`apps/nestfind`) and the Anchor escrow program (`programs/escrow`).

---

## 4. Environment Variables

### 4.1 Create the app env file

The easiest way is to copy the template:

```bash
cp apps/nestfind/env.local.example apps/nestfind/.env.local
```

Or, from the repo root, the `ensure:env` script does this automatically (runs on every `pnpm run dev` / `pnpm run build`):

```bash
pnpm run ensure:env
```

> **Note:** `ensure:env` only creates `.env.local` if it does not already exist. If you edit root `.env` later, you must delete `apps/nestfind/.env.local` and re-run `ensure:env` to sync.

### 4.2 Fill in Agora credentials

Edit `apps/nestfind/.env.local` and set these two values from your Agora Console project:

```env
NEXT_PUBLIC_AGORA_APP_ID=<your-app-id>
NEXT_PUBLIC_AGORA_APP_CERTIFICATE=<your-app-certificate>
```

Everything else has sane defaults. Do **not** commit `.env.local` — it is gitignored.

### 4.3 Root `.env` (for Anchor scripts)

The root `.env` is used by Anchor devnet scripts and as the source for `ensure:env`. The `pnpm run anchor:initialize:devnet` command reads it via `--env-file=../../.env`.

```env
SOLANA_DEVNET_RPC_URL="https://devnet.helius-rpc.com/?api-key=..."
```

### 4.4 Environment variable reference

| Variable | Required | Where | Description |
|----------|----------|-------|-------------|
| `NEXT_PUBLIC_AGORA_APP_ID` | Yes | `.env.local` | Agora project App ID |
| `NEXT_AGORA_APP_CERTIFICATE` | Yes | `.env.local` | Agora App Certificate (server-side only) |
| `NEXT_PUBLIC_AGENT_UID` | No | `.env.local` | UID the AI agent joins with (default: `123456`) |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | No | `.env.local` | Solana RPC endpoint (default: `https://api.devnet.solana.com`) |
| `NEXT_PUBLIC_SOLANA_CLUSTER` | No | `.env.local` | Solana cluster (default: `devnet`) |
| `USE_COUCHBASE` | No | `.env.local` | Set to `true` to enable Couchbase persistence |
| `COUCHBASE_CONN_STR` | If Couchbase | `.env.local` | Couchbase connection string |
| `COUCHBASE_USERNAME` | If Couchbase | `.env.local` | Couchbase username |
| `COUCHBASE_PASSWORD` | If Couchbase | `.env.local` | Couchbase password |
| `COUCHBASE_BUCKET` | If Couchbase | `.env.local` | Couchbase bucket name |
| `COUCHBASE_SCOPE` | No | `.env.local` | Couchbase scope (default: `_default`) |
| `COUCHBASE_LISTINGS_COLLECTION` | No | `.env.local` | Listings collection name (default: `listings`) |
| `COUCHBASE_ESCROW_COLLECTION` | No | `.env.local` | Escrow collection name (default: `escrow`) |
| `SOLANA_DEVNET_RPC_URL` | For Anchor | Root `.env` | RPC URL for devnet scripts |

---

## 5. Run the PWA

From the repo root:

```bash
pnpm run dev
```

This runs `ensure:env` then starts Next.js at [http://localhost:3000](http://localhost:3000).

### Verify before a demo

```bash
pnpm run verify
```

This runs: doctor check → lint → typecheck → API contract verification → apartment verification → build.

### Narrower checks

```bash
pnpm run lint          # ESLint only
pnpm run typecheck     # TypeScript only
pnpm run verify:api    # API route contracts
pnpm run build         # Production build
```

---

## 6. Couchbase (Optional)

The app works out of the box with a local in-memory listing catalog. To use Couchbase instead:

### 6.1 Create a Capella cluster (free tier)

1. Sign up at [Couchbase Capella](https://cloud.couchbase.com).
2. Create a cluster with the `nestfind_bucket` bucket.
3. Create a scope `_default` (or your custom scope).
4. Create a collection `listings` inside that scope.
5. Optionally create a separate `escrow` collection for escrow data.

### 6.2 Configure environment variables

In `apps/nestfind/.env.local`:

```env
USE_COUCHBASE=true
COUCHBASE_CONN_STR="couchbases://cb.xxxx.cloud.couchbase.com"
COUCHBASE_USERNAME="your-access-name"
COUCHBASE_PASSWORD="your-password"
COUCHBASE_BUCKET="nestfind_bucket"
COUCHBASE_SCOPE="_default"
COUCHBASE_LISTINGS_COLLECTION="listings"
COUCHBASE_ESCROW_COLLECTION="escrow"
```

### 6.3 Seed data into Couchbase

```bash
pnpm run check:couchbase       # Verify connection
pnpm run seed:couchbase        # Seed apartment listings
pnpm run migrate:demo:couchbase # Full demo data migration (listings + users + profiles)
```

### 6.4 Seed escrow users only

```bash
cd apps/nestfind
node --env-file=.env.local --import tsx scripts/seed-escrow-users.ts
```

---

## 7. Anchor / Escrow Program (Optional)

The escrow program is a Solana Anchor program. You only need this if you want to build/test/deploy the on-chain escrow.

### 7.1 Build

```bash
pnpm run anchor:build
```

This runs `anchor build` and syncs the IDL to `apps/nestfind/idl/escrow.json`.

### 7.2 Test (bankrun)

```bash
pnpm test
```

Runs `bankrun` tests in `programs/escrow/tests/bankrun.test.ts`.

### 7.3 Deploy to devnet

1. Configure Solana CLI for devnet:

```bash
solana config set --url devnet
```

2. Create or select a devnet wallet:

```bash
solana-keygen new       # skip if you already have one
solana airdrop 2
solana balance
```

3. Initialize the escrow program:

```bash
pnpm run anchor:initialize:devnet
```

The escrow is deployed at program ID `9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X`.

### 7.4 Devnet e2e test

```bash
pnpm run verify:escrow
```

---

## 8. Available Commands

### PWA commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start Next.js dev server |
| `pnpm run build` | Production build |
| `pnpm run start` | Start production server |
| `pnpm run lint` | Run ESLint |
| `pnpm run typecheck` | TypeScript type checking |
| `pnpm run verify` | Full verification (doctor + lint + typecheck + build) |
| `pnpm run verify:api` | Verify API route contracts |
| `pnpm run verify:apartment` | Verify apartment catalog |
| `pnpm run doctor` | Check environment health |

### Couchbase commands

| Command | Description |
|---------|-------------|
| `pnpm run check:couchbase` | Test Couchbase connection |
| `pnpm run seed:couchbase` | Seed apartment listings only |
| `pnpm run migrate:demo:couchbase` | Full demo data migration |
| `pnpm run reindex` | Reindex listings |

### Anchor commands

| Command | Description |
|---------|-------------|
| `pnpm run anchor:build` | Build Anchor program + sync IDL |
| `pnpm run anchor:test` | Run bankrun tests |
| `pnpm run anchor:initialize:devnet` | Deploy to devnet |
| `pnpm run verify:escrow` | Devnet e2e test |
| `pnpm run anchor:format` | Format Anchor code |
| `pnpm run anchor:lint` | Lint Anchor code |
| `pnpm run anchor:typecheck` | Typecheck Anchor program |

---

## 9. Troubleshooting

### `.env.local` not picking up changes

`ensure:env` only creates `.env.local` once. If you change root `.env`, delete `apps/nestfind/.env.local` and re-run:

```bash
rm apps/nestfind/.env.local
pnpm run ensure:env
```

Or manually edit `apps/nestfind/.env.local` directly.

### Couchbase connection fails

Run the connection check script for detailed diagnostics:

```bash
pnpm run check:couchbase
```

Common issues:
- Firewall blocking the Capella endpoint (port 18091/18092).
- Incorrect `COUCHBASE_CONN_STR` — must start with `couchbases://` for TLS.
- Bucket or collection not yet created in Capella.

### `anchor build` fails

Ensure the Solana and Anchor toolchain is installed and up to date:

```bash
rustup update
solana --version
anchor --version
```

### Port 3000 already in use

Kill the process using that port:

```bash
lsof -ti:3000 | xargs kill -9
```
