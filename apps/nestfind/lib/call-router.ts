import { getLanguageFromLocation, getLanguageName } from './language-mapping';

export type LandlordType = 'app-user' | 'external';
export type CallMethod = 'agora' | 'telephony';

export interface LandlordInfo {
  wallet?: string;
  phone?: string;
  isAppUser: boolean;
}

export interface CallRoutingDecision {
  landlordType: LandlordType;
  callMethod: CallMethod;
  language: string;
  languageName: string;
}

export function determineLandlordType(landlord: LandlordInfo): LandlordType {
  return landlord.isAppUser ? 'app-user' : 'external';
}

export function determineCallMethod(landlordType: LandlordType): CallMethod {
  return landlordType === 'app-user' ? 'agora' : 'telephony';
}

export function getLanguageFromListing(location: string): { code: string; name: string } {
  const code = getLanguageFromLocation(location);
  const name = getLanguageName(code);

  return { code, name };
}

export function routeCall(
  landlord: LandlordInfo,
  listingLocation: string
): CallRoutingDecision {
  const landlordType = determineLandlordType(landlord);
  const callMethod = determineCallMethod(landlordType);
  const { code: language, name: languageName } = getLanguageFromListing(listingLocation);

  return {
    landlordType,
    callMethod,
    language,
    languageName,
  };
}
