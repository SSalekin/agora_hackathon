import type { ApartmentListing } from '@/types/listing';
import { APARTMENT_LISTINGS } from '@/lib/listings';
import { isCouchbaseConfigured } from '@/lib/db/couchbase';
import { readApartmentListingsFromCouchbase } from '@/lib/db/apartment-listings';

export type ApartmentCatalogSource = 'couchbase' | 'local';

export async function getApartmentCatalog(): Promise<{
  listings: ApartmentListing[];
  source: ApartmentCatalogSource;
}> {
  if (!isCouchbaseConfigured()) {
    return { listings: APARTMENT_LISTINGS, source: 'local' };
  }

  const listings = await readApartmentListingsFromCouchbase();
  return { listings, source: 'couchbase' };
}
