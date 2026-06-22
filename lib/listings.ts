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

const SMALL_NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const NUMBER_WORD_PATTERN =
  '(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|and|a|half|point)';

function parseIntegerWords(phrase: string): number | undefined {
  const tokens = phrase.toLowerCase().replace(/-/g, ' ').split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let sawNumber = false;

  for (const token of tokens) {
    if (token === 'and' || token === 'a') continue;
    if (token in SMALL_NUMBER_WORDS) {
      current += SMALL_NUMBER_WORDS[token];
      sawNumber = true;
    } else if (token === 'hundred') {
      current = Math.max(current, 1) * 100;
      sawNumber = true;
    } else if (token === 'thousand') {
      total += Math.max(current, 1) * 1_000;
      current = 0;
      sawNumber = true;
    }
  }

  return sawNumber ? total + current : undefined;
}

function parseSpokenNumber(phrase: string): number | undefined {
  const normalized = phrase.toLowerCase().replace(/-/g, ' ').trim();
  const hasHalf = /\b(?:and\s+)?a?\s*half\b/.test(normalized);
  const withoutHalf = normalized.replace(/\b(?:and\s+)?a?\s*half\b/g, '').trim();
  const [integerPart, decimalPart] = withoutHalf.split(/\s+point\s+/, 2);
  const integer = parseIntegerWords(integerPart) ?? (hasHalf ? 0 : undefined);
  if (integer === undefined) return undefined;

  let decimal = 0;
  if (decimalPart) {
    const digits = decimalPart
      .split(/\s+/)
      .map((word) => SMALL_NUMBER_WORDS[word])
      .filter((value) => value !== undefined && value < 10)
      .join('');
    if (digits) decimal = Number(`0.${digits}`);
  }

  return integer + decimal + (hasHalf ? 0.5 : 0);
}

type BudgetConstraint = Pick<ListingSearchFilters, 'minBudgetVnd' | 'maxBudgetVnd'>;

function getBudgetDirection(text: string, index: number, matchLength: number): 'min' | 'max' {
  const nearbyText = text.slice(Math.max(0, index - 60), index + matchLength);
  const directionMatches = [...nearbyText.matchAll(
    /\b(above|over|more than|greater than|at least|minimum|min|starting from|under|below|less than|up to|at most|maximum|max|budget)\b/gi,
  )];
  const latestDirection = directionMatches.at(-1)?.[1].toLowerCase();
  return latestDirection && /^(above|over|more than|greater than|at least|minimum|min|starting from)$/.test(latestDirection)
    ? 'min'
    : 'max';
}

function parseBudgetVnd(text: string): BudgetConstraint {
  const candidates: Array<{ index: number; value: number; direction: 'min' | 'max' }> = [];
  const addCandidate = (index: number, matchLength: number, value: number) => {
    candidates.push({ index, value, direction: getBudgetDirection(text, index, matchLength) });
  };
  const numericMillionPattern = /(?:budget(?:\s+is)?|under|below|above|over|max(?:imum)?|min(?:imum)?|up to|at least)?\s*(\d+(?:[.,]\d+)?)\s*(?:million|mil|m)\s*(?:vnd|dong)?/gi;
  for (const match of text.matchAll(numericMillionPattern)) {
    addCandidate(match.index, match[0].length, Number(match[1].replace(',', '.')) * 1_000_000);
  }

  const numericVndPattern = /(\d[\d.,]{5,})\s*(?:vnd|dong)/gi;
  for (const match of text.matchAll(numericVndPattern)) {
    addCandidate(match.index, match[0].length, Number(match[1].replace(/[.,]/g, '')));
  }

  const spokenMillionPattern = new RegExp(
    `\\b(${NUMBER_WORD_PATTERN}(?:[\\s-]+${NUMBER_WORD_PATTERN})*)\\s+(?:million|mil)\\b`,
    'gi',
  );
  for (const match of text.matchAll(spokenMillionPattern)) {
    const millions = parseSpokenNumber(match[1]);
    if (millions !== undefined) addCandidate(match.index, match[0].length, millions * 1_000_000);
  }

  const spokenThousandPattern = new RegExp(
    `\\b(${NUMBER_WORD_PATTERN}(?:[\\s-]+${NUMBER_WORD_PATTERN})*)\\s+thousand\\s*(?:vnd|dong)?\\b`,
    'gi',
  );
  for (const match of text.matchAll(spokenThousandPattern)) {
    const thousands = parseSpokenNumber(match[1]);
    if (thousands !== undefined) addCandidate(match.index, match[0].length, thousands * 1_000);
  }

  const latest = candidates.sort((a, b) => b.index - a.index)[0];
  if (!latest) return {};
  return latest.direction === 'min'
    ? { minBudgetVnd: latest.value }
    : { maxBudgetVnd: latest.value };
}

type AreaConstraint = Pick<ListingSearchFilters, 'minAreaSqm' | 'maxAreaSqm'>;

function getAreaDirection(text: string, index: number): 'min' | 'max' {
  const nearbyText = text.slice(Math.max(0, index - 60), index);
  const directionMatches = [...nearbyText.matchAll(
    /\b(larger than|bigger than|more than|greater than|above|over|at least|minimum|min|starting from|smaller than|less than|below|under|at most|maximum|max|up to)\b/gi,
  )];
  const latestDirection = directionMatches.at(-1)?.[1].toLowerCase();
  return latestDirection && /^(smaller than|less than|below|under|at most|maximum|max|up to)$/.test(latestDirection)
    ? 'max'
    : 'min';
}

function parseAreaSqm(text: string): AreaConstraint {
  const candidates: Array<{ index: number; value: number; direction: 'min' | 'max' }> = [];
  const addCandidate = (index: number, value: number) => {
    candidates.push({ index, value, direction: getAreaDirection(text, index) });
  };

  const numericAreaPattern = /(\d+(?:[.,]\d+)?)\s*(?:square\s*(?:meters?|metres?)|sq\.?\s*m(?:eters?|etres?)?|sqm|m[²2])(?=\s|[.,;!?]|$)/gi;
  for (const match of text.matchAll(numericAreaPattern)) {
    addCandidate(match.index, Number(match[1].replace(',', '.')));
  }

  const spokenAreaPattern = new RegExp(
    `\\b(${NUMBER_WORD_PATTERN}(?:[\\s-]+${NUMBER_WORD_PATTERN})*)\\s+(?:square\\s+(?:meters?|metres?)|sq\\.?\\s*m(?:eters?|etres?)?|sqm)\\b`,
    'gi',
  );
  for (const match of text.matchAll(spokenAreaPattern)) {
    const value = parseSpokenNumber(match[1]);
    if (value !== undefined) addCandidate(match.index, value);
  }

  const latest = candidates.sort((a, b) => b.index - a.index)[0];
  if (!latest) return {};
  return latest.direction === 'max'
    ? { maxAreaSqm: latest.value }
    : { minAreaSqm: latest.value };
}

function parseRadiusKm(text: string): number | undefined {
  const candidates: Array<{ index: number; value: number }> = [];
  for (const match of text.matchAll(/(?:within|inside|radius(?:\s+of)?)\s*(\d+(?:[.,]\d+)?)\s*(?:kilometers?|kilometres?|km)/gi)) {
    candidates.push({ index: match.index, value: Number(match[1].replace(',', '.')) });
  }
  const spokenRadiusPattern = new RegExp(
    `(?:within|inside|radius(?:\\s+of)?)\\s+(${NUMBER_WORD_PATTERN}(?:[\\s-]+${NUMBER_WORD_PATTERN})*)\\s+(?:kilometers?|kilometres?|km)`,
    'gi',
  );
  for (const match of text.matchAll(spokenRadiusPattern)) {
    const value = parseSpokenNumber(match[1]);
    if (value !== undefined) candidates.push({ index: match.index, value });
  }
  return candidates.sort((a, b) => b.index - a.index)[0]?.value;
}

function parseMinimumCount(text: string, nounPattern: string): number | undefined {
  const candidates: Array<{ index: number; value: number }> = [];
  const numericPattern = new RegExp(`\\b(\\d+)\\s*(?:-|\\s)?(?:${nounPattern})\\b`, 'gi');
  for (const match of text.matchAll(numericPattern)) {
    candidates.push({ index: match.index, value: Number(match[1]) });
  }
  const spokenPattern = new RegExp(
    `\\b(${NUMBER_WORD_PATTERN}(?:[\\s-]+${NUMBER_WORD_PATTERN})*)[\\s-]+(?:${nounPattern})\\b`,
    'gi',
  );
  for (const match of text.matchAll(spokenPattern)) {
    const value = parseSpokenNumber(match[1]);
    if (value !== undefined) candidates.push({ index: match.index, value: Math.floor(value) });
  }
  const value = candidates.sort((a, b) => b.index - a.index)[0]?.value;
  return value && value > 0 && value <= 10 ? value : undefined;
}

function parseFurnishedPreference(text: string): boolean | undefined {
  const matches = [...text.matchAll(/\b(not\s+(?:fully\s+)?furnished|unfurnished|fully\s+furnished|furnished)\b/gi)];
  const match = matches.at(-1)?.[0].toLowerCase();
  if (!match) return undefined;
  return !match.startsWith('not') && match !== 'unfurnished';
}

function parseParkingPreference(text: string): boolean | undefined {
  const matches = [...text.matchAll(/\b(parking not required|no parking|without parking|do not need parking|don't need parking|need parking|want parking|with parking|car park(?:ing)?|motorbike parking|parking)\b/gi)];
  const match = matches.at(-1)?.[0].toLowerCase();
  if (!match) return undefined;
  return !/not required|no parking|without|do not|don't/.test(match);
}

function parsePetPreference(text: string): boolean | undefined {
  const matches = [...text.matchAll(/\b(pets? (?:are )?not allowed|no pets?|without pets?|pet[- ]friendly|pets? allowed|allows? pets?|with pets?|have (?:a )?pet)\b/gi)];
  const match = matches.at(-1)?.[0].toLowerCase();
  if (!match) return undefined;
  return !/not allowed|no pets?|without/.test(match);
}

function parseMoveIn(text: string): string | undefined {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  const matches = [...text.toLowerCase().matchAll(
    new RegExp(`(${monthNames.join('|')})\\s+(20\\d{2})`, 'g'),
  )];
  const match = matches.at(-1);
  if (!match) return undefined;
  const month = String(monthNames.indexOf(match[1]) + 1).padStart(2, '0');
  return `${match[2]}-${month}-01`;
}

export function extractListingFilters(query: string): ListingSearchFilters {
  const normalized = query.trim();
  const locationRules: Array<[string, RegExp]> = [
    ['Greenwich Vietnam – Da Nang', /greenwich|fpt\s+(?:city|university)|greenwich\s+university/i],
    ['My Khe', /my\s+khe/i],
    ['An Thuong', /an\s+thuong/i],
    ['Son Tra', /son\s+tra/i],
    ['Hai Chau', /hai\s+chau/i],
    ['Hoa Hai', /hoa\s+hai/i],
    ['Ngu Hanh Son', /ngu\s+hanh\s+son|marble\s+mountains?/i],
    ['Lien Chieu', /lien\s+chieu|hoa\s+khanh/i],
    ['Thanh Khe', /thanh\s+khe/i],
    ['Cam Le', /cam\s+le/i],
    ['Hoa Cuong', /hoa\s+cuong/i],
    ['Tho Quang', /tho\s+quang/i],
  ];
  const locationMatches = locationRules
    .map(([location, pattern]) => ({ location, index: normalized.search(pattern) }))
    .filter((match) => match.index >= 0)
    .sort((a, b) => b.index - a.index);
  const location = locationMatches[0]?.location ?? 'Da Nang';

  return {
    query: normalized,
    location,
    ...parseBudgetVnd(normalized),
    ...parseAreaSqm(normalized),
    radiusKm: parseRadiusKm(normalized),
    moveIn: parseMoveIn(normalized),
    minBedrooms: parseMinimumCount(normalized, 'bedrooms?|beds?'),
    minBathrooms: parseMinimumCount(normalized, 'bathrooms?|baths?'),
    furnished: parseFurnishedPreference(normalized),
    parking: parseParkingPreference(normalized),
    petsAllowed: parsePetPreference(normalized),
  };
}

export function isListingSearchRequest(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  const mentionsHousing = /\b(apartments?|flats?|homes?|rooms?|studios?|listings?|rentals?|properties|property|accommodation|somewhere|places?)\b/.test(normalized);
  const asksToSearch = /\b(find|search|show|recommend|suggest|looking for|look for|need|want|rent|moving|move|help me|would like)\b/.test(normalized);
  return mentionsHousing && asksToSearch;
}

export function agentSignalsListingResults(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  const mentionsResults = /\b(matching|matches|listings?|results?|options?|apartments?|places?)\b/.test(normalized);
  const presentsResults = /\b(here (?:are|is)|i found|i've found|found|showing|displayed|on (?:the )?screen|take a look)\b/.test(normalized);
  return mentionsResults && presentsResults;
}

export function searchApartmentListings(query: string): ListingSearchResponse {
  const filters = extractListingFilters(query);
  const listings = APARTMENT_LISTINGS.filter((listing) => {
    if (filters.minBudgetVnd && listing.monthlyRentVnd <= filters.minBudgetVnd) return false;
    if (filters.maxBudgetVnd && listing.monthlyRentVnd > filters.maxBudgetVnd) return false;
    if (filters.minAreaSqm && listing.areaSqm <= filters.minAreaSqm) return false;
    if (filters.maxAreaSqm && listing.areaSqm >= filters.maxAreaSqm) return false;
    if (filters.radiusKm && listing.distanceKm > filters.radiusKm) return false;
    if (filters.moveIn && listing.availableFrom > filters.moveIn) return false;
    if (filters.minBedrooms && listing.bedrooms < filters.minBedrooms) return false;
    if (filters.minBathrooms && listing.bathrooms < filters.minBathrooms) return false;
    if (filters.furnished !== undefined && listing.furnished !== filters.furnished) return false;
    const hasParking = listing.amenities.some((amenity) => /parking/i.test(amenity));
    if (filters.parking !== undefined && hasParking !== filters.parking) return false;
    const allowsPets = listing.amenities.some((amenity) => /pet[- ]friendly|pets? allowed/i.test(amenity));
    if (filters.petsAllowed !== undefined && allowsPets !== filters.petsAllowed) return false;
    if (filters.location === 'Greenwich Vietnam – Da Nang' && listing.distanceKm > 3) return false;
    if (filters.location !== 'Da Nang' && filters.location !== 'Greenwich Vietnam – Da Nang') {
      const locationText = `${listing.title} ${listing.neighborhood} ${listing.address}`.toLowerCase();
      if (!locationText.includes(filters.location.toLowerCase())) return false;
    }
    return true;
  }).sort((a, b) => a.distanceKm - b.distanceKm || a.monthlyRentVnd - b.monthlyRentVnd);

  return { filters, listings, total: listings.length };
}

export function formatVnd(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value / 1_000_000)}M ₫`;
}
