export type ApartmentListing = {
  id: string;
  title: string;
  address: string;
  neighborhood: string;
  distanceKm: number;
  monthlyRentVnd: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  availableFrom: string;
  furnished: boolean;
  amenities: string[];
  accent: string;
};

export type ListingSearchFilters = {
  query: string;
  location: string;
  maxBudgetVnd?: number;
  radiusKm?: number;
  moveIn?: string;
};

export type ListingSearchResponse = {
  filters: ListingSearchFilters;
  listings: ApartmentListing[];
  total: number;
};

export type SearchHistoryItem = {
  id: string;
  query: string;
  createdAt: number;
  resultCount: number;
  filters: ListingSearchFilters;
};
