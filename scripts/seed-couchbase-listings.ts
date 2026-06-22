import { APARTMENT_LISTINGS } from '../lib/listings';
import {
  APARTMENT_CATALOG_DOCUMENT_ID,
  writeApartmentListingsToCouchbase,
} from '../lib/db/apartment-listings';
import {
  closeCouchbase,
  getCouchbaseKeyspace,
  isCouchbaseConfigured,
} from '../lib/db/couchbase';

async function main() {
  if (!isCouchbaseConfigured()) {
    throw new Error('Set the Couchbase variables in .env.local before seeding listings');
  }

  const keyspace = getCouchbaseKeyspace();
  await writeApartmentListingsToCouchbase(APARTMENT_LISTINGS);
  console.log(
    `Seeded ${APARTMENT_LISTINGS.length} listings into ${keyspace.bucket}.${keyspace.scope}.${keyspace.collection} as ${APARTMENT_CATALOG_DOCUMENT_ID}`,
  );
}

main()
  .catch((error) => {
    console.error('Could not seed Couchbase listings:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(closeCouchbase);
