# How to Deploy NestFind to Vercel

## Prerequisites

- GitHub repository with the code pushed
- Vercel account ([vercel.com](https://vercel.com))
- Agora credentials (App ID + App Certificate)
- Optionally, a Couchbase Capella cluster

## Step 1: Import the Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your GitHub repo

## Step 2: Configure Project Settings

In the import dialog or project settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `apps/nestfind` |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `.next` |

> **Why `cd ../..`?** This is a pnpm monorepo. The Next.js app lives in `apps/nestfind/`, but dependencies are installed from the repo root. Vercel runs commands from the root directory you set, so we `cd` up to the monorepo root for install.

## Step 3: Set Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

### Required

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_AGORA_APP_ID` | Your Agora App ID |
| `NEXT_AGORA_APP_CERTIFICATE` | Your Agora App Certificate |

### Optional (with defaults)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_AGENT_UID` | `123456` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_SOLANA_CLUSTER` | `devnet` |

### Couchbase (optional)

| Variable | Value |
|----------|-------|
| `USE_COUCHBASE` | `true` |
| `COUCHBASE_CONN_STR` | `couchbases://cb.xxxx.cloud.couchbase.com` |
| `COUCHBASE_USERNAME` | Your Capella username |
| `COUCHBASE_PASSWORD` | Your Capella password |
| `COUCHBASE_BUCKET` | `nestfind_bucket` |
| `COUCHBASE_SCOPE` | `_default` |
| `COUCHBASE_LISTINGS_COLLECTION` | `listings` |
| `COUCHBASE_ESCROW_COLLECTION` | `escrow` |

## Step 4: Deploy

Click **Deploy**. Vercel will:

1. Clone the repo
2. Run `pnpm install --frozen-lockfile` from the monorepo root
3. Build the Next.js app from `apps/nestfind/`
4. Deploy to your `.vercel.app` URL

## Step 5: Verify

1. Open the deployed URL
2. Test the voice conversation (requires valid Agora credentials)
3. Check that apartment listings load

## What's NOT Deployed

- **Anchor escrow program** — deployed separately to devnet via `pnpm run anchor:initialize:devnet`
- **Couchbase data** — seeded locally via `pnpm run migrate:demo:couchbase`

## Troubleshooting

### Build fails: "Cannot find module" or workspace errors

The install command must run from the monorepo root. Ensure:
- Root Directory is set to `apps/nestfind`
- Install Command is `cd ../.. && pnpm install --frozen-lockfile`

### Build fails: "Missing NEXT_PUBLIC_AGORA_APP_ID"

Set the required environment variables in the Vercel dashboard under Settings → Environment Variables.

### Voice conversation doesn't work

- Ensure `NEXT_PUBLIC_AGORA_APP_ID` and `NEXT_AGORA_APP_CERTIFICATE` are set
- Check the Agora Console for valid credentials
- The app certificate must be the **server-side** certificate, not the app ID

### Couchbase connection fails

- Ensure `USE_COUCHBASE=true` is set
- Verify `COUCHBASE_CONN_STR` starts with `couchbases://` (TLS)
- Check Capella firewall settings for Vercel's IP range
