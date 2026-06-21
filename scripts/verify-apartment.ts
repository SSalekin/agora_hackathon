import assert from 'node:assert/strict';
import { extractListingFilters, searchApartmentListings } from '../lib/listings';

const sample =
  'I will move to Danang in July 2027. Find apartments within 2 kilometers from Greenwich Danang University. My budget is 5 million VND per month.';
const filters = extractListingFilters(sample);

assert.equal(filters.location, 'Greenwich Vietnam – Da Nang');
assert.equal(filters.maxBudgetVnd, 5_000_000);
assert.equal(filters.radiusKm, 2);
assert.equal(filters.moveIn, '2027-07-01');

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
