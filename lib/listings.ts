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
  {
    id: 'hoa-khanh-budget-room',
    title: 'Hoa Khanh budget room',
    address: '42 Au Co, Hoa Khanh Bac, Da Nang',
    neighborhood: 'Lien Chieu',
    distanceKm: 12.8,
    monthlyRentVnd: 2_400_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 20,
    availableFrom: '2027-05-01',
    furnished: false,
    amenities: ['Private bathroom', 'Parking', 'Local market'],
    accent: 'from-yellow-200 via-amber-100 to-orange-100',
  },
  {
    id: 'thanh-khe-cozy-studio',
    title: 'Cozy Thanh Khe studio',
    address: '117 Dien Bien Phu, Thanh Khe, Da Nang',
    neighborhood: 'Thanh Khe',
    distanceKm: 9.5,
    monthlyRentVnd: 3_800_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 28,
    availableFrom: '2027-06-10',
    furnished: true,
    amenities: ['Kitchenette', 'Air conditioning', 'Bus access'],
    accent: 'from-rose-200 via-pink-100 to-orange-100',
  },
  {
    id: 'cam-le-riverside-studio',
    title: 'Cam Le riverside studio',
    address: '73 Cach Mang Thang 8, Cam Le, Da Nang',
    neighborhood: 'Cam Le',
    distanceKm: 7.2,
    monthlyRentVnd: 4_200_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 30,
    availableFrom: '2027-04-15',
    furnished: true,
    amenities: ['River walk', 'Laundry', 'Quiet street'],
    accent: 'from-teal-200 via-emerald-100 to-lime-100',
  },
  {
    id: 'son-tra-compact-flat',
    title: 'Compact Son Tra flat',
    address: '36 Ngo Quyen, An Hai Bac, Da Nang',
    neighborhood: 'Son Tra',
    distanceKm: 6.8,
    monthlyRentVnd: 5_500_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 36,
    availableFrom: '2027-07-01',
    furnished: true,
    amenities: ['Elevator', 'Balcony', 'Dragon Bridge access'],
    accent: 'from-indigo-200 via-blue-100 to-sky-100',
  },
  {
    id: 'an-thuong-serviced-suite',
    title: 'An Thuong serviced suite',
    address: '18 An Thuong 4, My An, Da Nang',
    neighborhood: 'An Thuong',
    distanceKm: 3.6,
    monthlyRentVnd: 7_500_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 46,
    availableFrom: '2027-06-20',
    furnished: true,
    amenities: ['Weekly cleaning', 'Coworking lounge', 'Beach access'],
    accent: 'from-purple-200 via-violet-100 to-fuchsia-100',
  },
  {
    id: 'my-khe-sea-view',
    title: 'My Khe sea-view apartment',
    address: '51 Vo Nguyen Giap, Phuoc My, Da Nang',
    neighborhood: 'My Khe',
    distanceKm: 4.2,
    monthlyRentVnd: 10_500_000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 68,
    availableFrom: '2027-07-01',
    furnished: true,
    amenities: ['Ocean view', 'Pool', '24-hour security'],
    accent: 'from-blue-300 via-cyan-100 to-sky-100',
  },
  {
    id: 'hai-chau-city-two-bedroom',
    title: 'Hai Chau city two-bedroom',
    address: '140 Nguyen Van Linh, Hai Chau, Da Nang',
    neighborhood: 'Hai Chau',
    distanceKm: 5.4,
    monthlyRentVnd: 12_000_000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 76,
    availableFrom: '2027-05-15',
    furnished: true,
    amenities: ['City center', 'Gym', 'Reception'],
    accent: 'from-stone-300 via-slate-100 to-zinc-100',
  },
  {
    id: 'hoa-cuong-family-residence',
    title: 'Hoa Cuong family residence',
    address: '22 Nui Thanh, Hoa Cuong Bac, Da Nang',
    neighborhood: 'Hoa Cuong',
    distanceKm: 6.1,
    monthlyRentVnd: 15_000_000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 105,
    availableFrom: '2027-08-01',
    furnished: true,
    amenities: ['Three bedrooms', 'Large kitchen', 'Car parking'],
    accent: 'from-orange-200 via-amber-100 to-yellow-100',
  },
  {
    id: 'son-tra-peninsula-penthouse',
    title: 'Son Tra peninsula penthouse',
    address: '09 Hoang Sa, Tho Quang, Da Nang',
    neighborhood: 'Tho Quang',
    distanceKm: 9.1,
    monthlyRentVnd: 18_500_000,
    bedrooms: 3,
    bathrooms: 3,
    areaSqm: 128,
    availableFrom: '2027-06-01',
    furnished: true,
    amenities: ['Panoramic view', 'Private terrace', 'Concierge'],
    accent: 'from-fuchsia-200 via-purple-100 to-indigo-100',
  },
  {
    id: 'hoa-hai-townhouse',
    title: 'Hoa Hai garden townhouse',
    address: '84 Truong Sa, Hoa Hai, Da Nang',
    neighborhood: 'Hoa Hai',
    distanceKm: 2.3,
    monthlyRentVnd: 7_200_000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 72,
    availableFrom: '2027-05-01',
    furnished: false,
    amenities: ['Private garden', 'Pet friendly', 'Parking'],
    accent: 'from-green-200 via-lime-100 to-yellow-100',
  },
  {
    id: 'greenwich-micro-studio',
    title: 'Greenwich micro studio',
    address: '07 Doan Khue, Hoa Hai, Da Nang',
    neighborhood: 'Hoa Hai',
    distanceKm: 0.9,
    monthlyRentVnd: 2_900_000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 19,
    availableFrom: '2027-08-01',
    furnished: true,
    amenities: ['Campus shuttle', 'Study desk', 'Utilities included'],
    accent: 'from-red-200 via-orange-100 to-amber-100',
  },
  {
    id: 'ngu-hanh-son-family-flat',
    title: 'Ngu Hanh Son family flat',
    address: '101 Le Van Hien, Khue My, Da Nang',
    neighborhood: 'Ngu Hanh Son',
    distanceKm: 2.0,
    monthlyRentVnd: 9_800_000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 82,
    availableFrom: '2027-06-01',
    furnished: true,
    amenities: ['Family friendly', 'Playground', 'Supermarket nearby'],
    accent: 'from-cyan-200 via-emerald-100 to-green-100',
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
