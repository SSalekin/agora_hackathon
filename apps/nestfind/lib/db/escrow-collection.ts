import type { Collection } from 'couchbase';
import { getCouchbaseCollection, isCouchbaseEnabled } from './couchbase';

const ESCROW_COLLECTION =
  process.env.COUCHBASE_ESCROW_COLLECTION || 'listings';

let cachedCollection: Collection | null = null;

export function isEscrowPersistenceEnabled(): boolean {
  return isCouchbaseEnabled();
}

export async function getEscrowCollection(): Promise<Collection> {
  if (cachedCollection) return cachedCollection;
  const scope = process.env.COUCHBASE_SCOPE || '_default';
  cachedCollection = await getCouchbaseCollection(scope, ESCROW_COLLECTION);
  return cachedCollection;
}
