import type { ApartmentListing } from '@/types/listing';
import type { FAQItem } from '@/types/faq';
import { mergeFAQItems } from '../faq-updater';
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
    listing.landlordWallet.length > 0 &&
    typeof listing.defaultDepositSol === 'number' &&
    listing.defaultDepositSol > 0 &&
    typeof listing.defaultInspectionDays === 'number' &&
    listing.defaultInspectionDays > 0
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

export async function updateApartmentFAQ(
  listingId: string,
  newFAQItems: FAQItem[]
): Promise<void> {
  const collection = await getCouchbaseCollection();
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await collection.get(APARTMENT_CATALOG_DOCUMENT_ID);
    const document = result.content as ApartmentCatalogDocument;
    const cas = result.cas;

    const listingIndex = document.listings.findIndex((l) => l.id === listingId);
    if (listingIndex === -1) {
      throw new Error(`Listing ${listingId} not found in apartment catalog`);
    }

    const listing = document.listings[listingIndex];
    const updatedFAQ = mergeFAQItems(listing.faq || [], newFAQItems);

    document.listings[listingIndex] = { ...listing, faq: updatedFAQ };
    document.updatedAt = new Date().toISOString();

    try {
      await collection.replace(APARTMENT_CATALOG_DOCUMENT_ID, document, { cas });
      return;
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err && (err as { code: number }).code === 12) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(`Failed to update FAQ for listing ${listingId} after ${maxRetries} retries`);
}
