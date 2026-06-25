import { Cluster, Bucket, Collection, connect } from 'couchbase';

let clusterInstance: Cluster | null = null;
let bucketInstance: Bucket | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function isCouchbaseConfigured(): boolean {
  return !!(
    process.env.COUCHBASE_CONN_STR &&
    process.env.COUCHBASE_USERNAME &&
    process.env.COUCHBASE_PASSWORD &&
    process.env.COUCHBASE_BUCKET
  );
}

export function isCouchbaseEnabled(): boolean {
  if (process.env.USE_COUCHBASE === 'false') return false;
  return isCouchbaseConfigured();
}

export function getCouchbaseKeyspace() {
  return {
    bucket: requireEnv('COUCHBASE_BUCKET'),
    scope: process.env.COUCHBASE_SCOPE || '_default',
    collection: process.env.COUCHBASE_LISTINGS_COLLECTION || 'listings',
  };
}

export async function getCouchbaseCluster(): Promise<Cluster> {
  if (clusterInstance) return clusterInstance;

  const connStr = requireEnv('COUCHBASE_CONN_STR');
  const username = requireEnv('COUCHBASE_USERNAME');
  const password = requireEnv('COUCHBASE_PASSWORD');

  clusterInstance = await connect(connStr, {
    username,
    password,
    configProfile: 'wanDevelopment',
  });

  await clusterInstance.waitUntilReady(10_000);

  return clusterInstance;
}

export async function getCouchbaseBucket(): Promise<Bucket> {
  if (bucketInstance) return bucketInstance;
  const cluster = await getCouchbaseCluster();
  const bucketName = getCouchbaseKeyspace().bucket;
  bucketInstance = cluster.bucket(bucketName);
  return bucketInstance;
}

export async function getCouchbaseCollection(
  scope = process.env.COUCHBASE_SCOPE || '_default',
  collection = process.env.COUCHBASE_LISTINGS_COLLECTION || 'listings',
): Promise<Collection> {
  const bucket = await getCouchbaseBucket();
  return bucket.scope(scope).collection(collection);
}

export async function closeCouchbase(): Promise<void> {
  try {
    if (clusterInstance) {
      await clusterInstance.close();
    }
  } finally {
    clusterInstance = null;
    bucketInstance = null;
  }
}
