const CITY_LANGUAGE_MAP: Record<string, string> = {
  'da nang': 'vi',
  'danang': 'vi',
  'vietnam': 'vi',
  'hanoi': 'vi',
  'ho chi minh': 'vi',
  'paris': 'fr',
  'france': 'fr',
  'lyon': 'fr',
  'marseille': 'fr',
  'tokyo': 'ja',
  'japan': 'ja',
  'osaka': 'ja',
  'seoul': 'ko',
  'korea': 'ko',
  'busan': 'ko',
  'bangkok': 'th',
  'thailand': 'th',
  'chiang mai': 'th',
  'berlin': 'de',
  'germany': 'de',
  'munich': 'de',
  'madrid': 'es',
  'spain': 'es',
  'barcelona': 'es',
  'rome': 'it',
  'italy': 'it',
  'milan': 'it',
  'london': 'en',
  'uk': 'en',
  'united kingdom': 'en',
  'new york': 'en',
  'usa': 'en',
  'united states': 'en',
};

const DEFAULT_LANGUAGE = 'en';

export function getLanguageFromLocation(location: string): string {
  const normalizedLocation = location.toLowerCase().trim();
  
  // Direct match
  if (CITY_LANGUAGE_MAP[normalizedLocation]) {
    return CITY_LANGUAGE_MAP[normalizedLocation];
  }
  
  // Partial match
  for (const [city, language] of Object.entries(CITY_LANGUAGE_MAP)) {
    if (normalizedLocation.includes(city)) {
      return language;
    }
  }
  
  return DEFAULT_LANGUAGE;
}

export function getLanguageName(languageCode: string): string {
  const languageNames: Record<string, string> = {
    'en': 'English',
    'fr': 'French',
    'vi': 'Vietnamese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'th': 'Thai',
    'de': 'German',
    'es': 'Spanish',
    'it': 'Italian',
  };
  
  return languageNames[languageCode] || 'English';
}