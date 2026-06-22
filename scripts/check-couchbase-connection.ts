import {
  closeCouchbase,
  getCouchbaseBucket,
  getCouchbaseCollection,
  getCouchbaseCluster,
  isCouchbaseConfigured,
} from '../lib/db/couchbase';

function getConnHost(): string | null {
  const connStr = process.env.COUCHBASE_CONN_STR;
  if (!connStr) return null;
  try {
    return new URL(connStr).host;
  } catch {
    return null;
  }
}

async function main() {
  if (!isCouchbaseConfigured()) {
    console.error(
      'Couchbase env vars are not set. Copy env.local.example to .env.local and fill in the Capella values.',
    );
    process.exitCode = 2;
    return;
  }

  try {
    const host = getConnHost();
    if (host) {
      console.log(`Testing Couchbase host: ${host}`);
    }

    const cluster = await getCouchbaseCluster();
    console.log('Connected to Couchbase cluster');

    try {
      if (typeof cluster.ping === 'function') {
        const ping = await cluster.ping();
        console.log('Ping results:', JSON.stringify(ping, null, 2));
      }
    } catch (error) {
      console.warn('Cluster ping failed:', error instanceof Error ? error.message : String(error));
    }

    const bucket = await getCouchbaseBucket();
    console.log('Opened bucket:', bucket.name);

    const collection = await getCouchbaseCollection();
    console.log('Obtained collection handle:', Boolean(collection));

    console.log('Couchbase connection check succeeded.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      'Couchbase connection failed:',
      message,
    );
    if (/timeout/i.test(message)) {
      console.error(
        'This usually means the Capella IP access list does not allow this machine, the cluster endpoint is unreachable from this network, or the connection string/credentials are incorrect.',
      );
      console.error(
        'Check that your current public IP is allowed in Capella and that COUCHBASE_CONN_STR uses the cluster host from the Capella connect dialog.',
      );
    }
    process.exitCode = 1;
  } finally {
    await closeCouchbase();
  }
}

void main();
