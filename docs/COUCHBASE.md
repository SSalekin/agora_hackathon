# Using Couchbase Capella (Cloud) with this project

This project supports an optional Couchbase backend via environment variables.
You can use Couchbase Capella's free tier (cloud) instead of running a local Couchbase
instance. Follow the steps below to create a cluster, bucket, and user, then set
the corresponding env vars in `.env.local`.

1. Sign up for Couchbase Capella
   - Visit https://www.couchbase.com/capella and sign up for the free tier.

2. Create a cluster, bucket, and collection
   - Create a new database project and cluster (the free tier options are available).
   - In the cluster UI create a bucket named `nestfind` (or choose another and set `COUCHBASE_BUCKET`).
   - In the `_default` scope, create a collection named `listings`.

3. Create a database user
   - Under Security → Database Users, create a user with `Bucket Full Access` for the `nestfind` bucket.
   - Note the username and password you create.

4. Get the connection string
   - In the cluster connect UI, copy the "Connection String" (it looks like `couchbases://...`).
   - Use that value for `COUCHBASE_CONN_STR` in `.env.local`.

5. Configure `.env.local`
   - Edit `.env.local` (copy from `env.local.example`) and set:

```
COUCHBASE_CONN_STR=couchbases://<your-cluster-host>
COUCHBASE_USERNAME=<db-username>
COUCHBASE_PASSWORD=<db-password>
COUCHBASE_BUCKET=nestfind
COUCHBASE_SCOPE=_default
COUCHBASE_COLLECTION=listings
```

6. Test the connection
   - Run the included script to verify connectivity:

```bash
pnpm install
pnpm run check:couchbase
```

7. Seed the catalog

This upserts one versioned catalog document containing the 18 demo listings. It is safe to rerun when the local fixture changes.

```bash
pnpm run seed:couchbase
```

8. Start the app

```bash
pnpm run dev
```

When all required Couchbase variables are present, `/api/listings` reads the catalog from Couchbase. If Couchbase is not configured, local development falls back to the fixture in `lib/listings.ts`. If Couchbase is configured but unavailable or unseeded, the API returns `503` rather than silently serving stale local data.

Notes
 - `pnpm run seed:couchbase` writes to the configured database. Verify the target bucket, scope, and collection before running it.
 - The catalog is stored as `nestfind::apartment-catalog`; filtering remains in the application layer, which is appropriate for this small demo dataset.
 - The Node SDK will use TLS when connecting to `couchbases://` endpoints. If your
   environment requires custom CA configuration, follow Couchbase Capella docs.
