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
  minBudgetVnd?: number;
  maxBudgetVnd?: number;
  minAreaSqm?: number;
  maxAreaSqm?: number;
  radiusKm?: number;
  moveIn?: string;
  minBedrooms?: number;
  minBathrooms?: number;
  furnished?: boolean;
  parking?: boolean;
  petsAllowed?: boolean;
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
