import type { ListingSearchFilters } from '@/types/listing';
import { formatVnd } from '@/lib/listings';

export function SearchFilterChips({ filters }: { filters: ListingSearchFilters | null }) {
  if (!filters) return null;
  const chips = [
    filters.location,
    filters.minBudgetVnd ? `Above ${formatVnd(filters.minBudgetVnd)}` : null,
    filters.maxBudgetVnd ? `Up to ${formatVnd(filters.maxBudgetVnd)}` : null,
    filters.minAreaSqm ? `Larger than ${filters.minAreaSqm} m²` : null,
    filters.maxAreaSqm ? `Smaller than ${filters.maxAreaSqm} m²` : null,
    filters.radiusKm ? `Within ${filters.radiusKm} km` : null,
    filters.moveIn ? `Move in ${filters.moveIn}` : null,
    filters.minBedrooms ? `${filters.minBedrooms}+ bedrooms` : null,
    filters.minBathrooms ? `${filters.minBathrooms}+ bathrooms` : null,
    filters.furnished === true ? 'Fully furnished' : null,
    filters.furnished === false ? 'Unfurnished' : null,
    filters.parking === true ? 'Parking required' : null,
    filters.parking === false ? 'No parking' : null,
    filters.petsAllowed === true ? 'Pets allowed' : null,
    filters.petsAllowed === false ? 'No pets' : null,
    ...(filters.amenities ?? []).map((amenity) => amenity),
  ].filter((chip): chip is string => Boolean(chip));

  return <div className="mt-3 flex flex-wrap gap-2" aria-label="Active search filters">{chips.map((chip) => <span key={chip} className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{chip}</span>)}</div>;
}
