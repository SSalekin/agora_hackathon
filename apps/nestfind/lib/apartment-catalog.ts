import type { ApartmentListing } from '@/types/listing';
import { APARTMENT_LISTINGS } from '@/lib/listings';
import { isCouchbaseEnabled } from '@/lib/db/couchbase';
import { readApartmentListingsFromCouchbase } from '@/lib/db/apartment-listings';

export type ApartmentCatalogSource = 'couchbase' | 'local';

export async function getApartmentCatalog(): Promise<{
  listings: ApartmentListing[];
  source: ApartmentCatalogSource;
}> {
  if (!isCouchbaseEnabled()) {
    return { listings: APARTMENT_LISTINGS, source: 'local' };
  }

  try {
    const listings = await readApartmentListingsFromCouchbase();
    return { listings, source: 'couchbase' };
  } catch (error) {
    console.error('Couchbase unavailable, falling back to local listings:', error);
    return { listings: APARTMENT_LISTINGS, source: 'local' };
  }
}
