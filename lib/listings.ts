import type {
  ApartmentListing,
  ListingSearchFilters,
  ListingSearchResponse,
} from '@/types/listing';

export const APARTMENT_LISTINGS: ApartmentListing[] = [
  {
    id: 'fpt-garden-studio',
    title: 'Sunlit studio near FPT City',
    address: '12 Nam Ky Khoi Nghia, Hoa Hai, Da Nang',
    neighborhood: 'Ngu Hanh Son',
    distanceKm: 0.7,
    monthlyRentVnd: 4_500_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 31,
    availableFrom: '2027-06-15',
    furnished: true,
    amenities: ['Balcony', 'Fast Wi-Fi', 'Motorbike parking'],
    accent: 'from-amber-200 via-orange-100 to-rose-100',
  },
  {
    id: 'greenwich-loft',
    title: 'Greenwich campus loft',
    address: '28 Ngu Hanh Son, Hoa Hai, Da Nang',
    neighborhood: 'Hoa Hai',
    distanceKm: 1.2,
    monthlyRentVnd: 5_000_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 38,
    availableFrom: '2027-07-01',
    furnished: true,
    amenities: ['Study desk', 'Elevator', 'Weekly cleaning'],
    accent: 'from-emerald-200 via-teal-100 to-cyan-100',
  },
  {
    id: 'marble-mountain-flat',
    title: 'Quiet Marble Mountain flat',
    address: '61 Le Van Hien, Ngu Hanh Son, Da Nang',
    neighborhood: 'My An',
    distanceKm: 1.8,
    monthlyRentVnd: 4_800_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 35,
    availableFrom: '2027-05-20',
    furnished: true,
    amenities: ['Air conditioning', 'Security', 'Laundry'],
    accent: 'from-violet-200 via-fuchsia-100 to-pink-100',
  },
  {
    id: 'my-khe-one-bedroom',
    title: 'My Khe one-bedroom retreat',
    address: '09 An Thuong 29, My An, Da Nang',
    neighborhood: 'An Thuong',
    distanceKm: 3.4,
    monthlyRentVnd: 6_500_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 44,
    availableFrom: '2027-07-01',
    furnished: true,
    amenities: ['Beach access', 'Kitchen', 'Rooftop'],
    accent: 'from-sky-200 via-blue-100 to-indigo-100',
  },
  {
    id: 'student-house-share',
    title: 'Affordable student house share',
    address: '103 Mai Dang Chon, Hoa Quy, Da Nang',
    neighborhood: 'Hoa Quy',
    distanceKm: 1.5,
    monthlyRentVnd: 3_200_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 26,
    availableFrom: '2027-06-01',
    furnished: false,
    amenities: ['Shared kitchen', 'Garden', 'Parking'],
    accent: 'from-lime-200 via-green-100 to-emerald-100',
  },
  {
    id: 'han-river-modern',
    title: 'Modern Han River apartment',
    address: '88 Tran Thi Ly, Hai Chau, Da Nang',
    neighborhood: 'Hai Chau',
    distanceKm: 5.6,
    monthlyRentVnd: 8_900_000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 62,
    availableFrom: '2027-07-15',
    furnished: true,
    amenities: ['River view', 'Gym', 'Pool'],
    accent: 'from-cyan-200 via-sky-100 to-blue-100',
  },
];

function parseBudgetVnd(text: string): number | undefined {
  const millionMatch = text.match(/(?:budget(?:\s+is)?|under|below|max(?:imum)?|up to)?\s*(\d+(?:[.,]\d+)?)\s*(?:million|mil|m)\s*(?:vnd|dong)?/i);
  if (millionMatch) {
    return Number(millionMatch[1].replace(',', '.')) * 1_000_000;
  }
  const vndMatch = text.match(/(\d[\d.,]{5,})\s*(?:vnd|dong)/i);
  if (!vndMatch) return undefined;
  return Number(vndMatch[1].replace(/[.,]/g, ''));
}

function parseRadiusKm(text: string): number | undefined {
  const match = text.match(/(?:within|inside|radius(?:\s+of)?)\s*(\d+(?:[.,]\d+)?)\s*(?:kilometers?|kilometres?|km)/i);
  return match ? Number(match[1].replace(',', '.')) : undefined;
}

function parseMoveIn(text: string): string | undefined {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  const match = text.toLowerCase().match(
    new RegExp(`(${monthNames.join('|')})\\s+(20\\d{2})`),
  );
  if (!match) return undefined;
  const month = String(monthNames.indexOf(match[1]) + 1).padStart(2, '0');
  return `${match[2]}-${month}-01`;
}

export function extractListingFilters(query: string): ListingSearchFilters {
  const normalized = query.trim();
  const location = /greenwich|fpt|university/i.test(normalized)
    ? 'Greenwich Vietnam – Da Nang'
    : /da\s*nang|danang/i.test(normalized)
      ? 'Da Nang'
      : 'Greenwich Vietnam – Da Nang';

  return {
    query: normalized,
    location,
    maxBudgetVnd: parseBudgetVnd(normalized),
    radiusKm: parseRadiusKm(normalized),
    moveIn: parseMoveIn(normalized),
  };
}

export function searchApartmentListings(query: string): ListingSearchResponse {
  const filters = extractListingFilters(query);
  const listings = APARTMENT_LISTINGS.filter((listing) => {
    if (filters.maxBudgetVnd && listing.monthlyRentVnd > filters.maxBudgetVnd) return false;
    if (filters.radiusKm && listing.distanceKm > filters.radiusKm) return false;
    if (filters.moveIn && listing.availableFrom > filters.moveIn) return false;
    return true;
  }).sort((a, b) => a.distanceKm - b.distanceKm || a.monthlyRentVnd - b.monthlyRentVnd);

  return { filters, listings, total: listings.length };
}

export function formatVnd(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value / 1_000_000)}M ₫`;
}
