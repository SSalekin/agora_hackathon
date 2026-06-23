import type { ApartmentListing } from '@/types/listing';
import { getCouchbaseCollection } from './couchbase';

export const APARTMENT_CATALOG_DOCUMENT_ID = 'nestfind::apartment-catalog';

type ApartmentCatalogDocument = {
  type: 'apartmentCatalog';
  version: 1;
  updatedAt: string;
  listings: ApartmentListing[];
};

function isApartmentListing(value: unknown): value is ApartmentListing {
  if (!value || typeof value !== 'object') return false;
  const listing = value as Partial<ApartmentListing>;
  return (
    typeof listing.id === 'string' &&
    typeof listing.title === 'string' &&
    typeof listing.address === 'string' &&
    typeof listing.neighborhood === 'string' &&
    typeof listing.distanceKm === 'number' &&
    typeof listing.monthlyRentVnd === 'number' &&
    typeof listing.bedrooms === 'number' &&
    typeof listing.bathrooms === 'number' &&
    typeof listing.areaSqm === 'number' &&
    typeof listing.availableFrom === 'string' &&
    typeof listing.furnished === 'boolean' &&
    Array.isArray(listing.amenities) &&
    listing.amenities.every((amenity) => typeof amenity === 'string') &&
    typeof listing.accent === 'string' &&
    typeof listing.landlordWallet === 'string' &&
    listing.landlordWallet.length > 0
  );
}

export async function readApartmentListingsFromCouchbase(): Promise<ApartmentListing[]> {
  const collection = await getCouchbaseCollection();
  const result = await collection.get(APARTMENT_CATALOG_DOCUMENT_ID);
  const document = result.content as Partial<ApartmentCatalogDocument>;

  if (!Array.isArray(document.listings) || !document.listings.every(isApartmentListing)) {
    throw new Error(`Couchbase document ${APARTMENT_CATALOG_DOCUMENT_ID} has an invalid listing catalog`);
  }

  return document.listings;
}

export async function writeApartmentListingsToCouchbase(
  listings: ApartmentListing[],
): Promise<void> {
  const collection = await getCouchbaseCollection();
  const document: ApartmentCatalogDocument = {
    type: 'apartmentCatalog',
    version: 1,
    updatedAt: new Date().toISOString(),
    listings,
  };
  await collection.upsert(APARTMENT_CATALOG_DOCUMENT_ID, document);
}
