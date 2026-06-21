import assert from 'node:assert/strict';
import { extractListingFilters, isListingSearchRequest, searchApartmentListings } from '../lib/listings';

const sample =
  'I will move to Danang in July 2027. Find apartments within 2 kilometers from Greenwich Danang University. My budget is 5 million VND per month.';
const filters = extractListingFilters(sample);

assert.equal(filters.location, 'Greenwich Vietnam – Da Nang');
assert.equal(filters.maxBudgetVnd, 5_000_000);
assert.equal(filters.radiusKm, 2);
assert.equal(filters.moveIn, '2027-07-01');
assert.equal(isListingSearchRequest(sample), true);
assert.equal(isListingSearchRequest('Hello, my name is Minh.'), false);
assert.equal(isListingSearchRequest('My budget is 5 million VND.'), false);
assert.equal(isListingSearchRequest('Can you show me apartment listings near campus?'), true);

const spokenBudget = searchApartmentListings(
  'Find apartments in Da Nang under five million VND',
);
assert.equal(spokenBudget.filters.maxBudgetVnd, 5_000_000);
assert.ok(spokenBudget.listings.length > 0);
assert.ok(spokenBudget.listings.every((listing) => listing.monthlyRentVnd <= 5_000_000));

const decimalSpokenBudget = searchApartmentListings(
  'Show me apartments below four point five million dong',
);
assert.equal(decimalSpokenBudget.filters.maxBudgetVnd, 4_500_000);

const halfMillionBudget = searchApartmentListings(
  'Find a studio under four and a half million VND',
);
assert.equal(halfMillionBudget.filters.maxBudgetVnd, 4_500_000);

const locationResults = searchApartmentListings(
  'Find apartments in My Khe under twenty million VND',
);
assert.equal(locationResults.filters.location, 'My Khe');
assert.ok(locationResults.listings.length >= 2);
assert.ok(locationResults.listings.every((listing) =>
  `${listing.title} ${listing.neighborhood} ${listing.address}`.toLowerCase().includes('my khe'),
));

const refinedContext = searchApartmentListings(
  'Find apartments in My Khe under five million. Increase my budget to seven million.',
);
assert.equal(refinedContext.filters.maxBudgetVnd, 7_000_000);
assert.equal(refinedContext.total, 1);

const refinedLocation = searchApartmentListings(
  'Find apartments near FPT University under twenty million. Search in Son Tra instead.',
);
assert.equal(refinedLocation.filters.location, 'Son Tra');
assert.ok(refinedLocation.listings.length >= 2);

const spokenRadius = searchApartmentListings(
  'Find an apartment within two kilometers of FPT University',
);
assert.equal(spokenRadius.filters.radiusKm, 2);

const results = searchApartmentListings(sample);
assert.equal(results.total, 4);
assert.ok(results.listings.every((listing) => listing.monthlyRentVnd <= 5_000_000));
assert.ok(results.listings.every((listing) => listing.distanceKm <= 2));
assert.ok(results.listings.every((listing) => listing.availableFrom <= '2027-07-01'));

const noFilters = searchApartmentListings('Show me apartments in Da Nang');
assert.equal(noFilters.total, 18);
assert.ok(Math.min(...noFilters.listings.map((listing) => listing.monthlyRentVnd)) <= 2_400_000);
assert.ok(Math.max(...noFilters.listings.map((listing) => listing.monthlyRentVnd)) >= 18_500_000);
assert.ok(new Set(noFilters.listings.map((listing) => listing.neighborhood)).size >= 10);

console.log('Apartment search checks passed.');
