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

export interface LandlordValidationResult {
  valid: boolean;
  error?: string;
}

export function validateLandlordInfo(
  landlord: LandlordInfo,
  callMethod: CallMethod
): LandlordValidationResult {
  if (callMethod === 'telephony' && !landlord.phone) {
    return {
      valid: false,
      error: 'External landlord requires a phone number',
    };
  }

  if (callMethod === 'agora' && !landlord.wallet) {
    return {
      valid: false,
      error: 'App user landlord requires a wallet address',
    };
  }

  return { valid: true };
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

  const validation = validateLandlordInfo(landlord, callMethod);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    landlordType,
    callMethod,
    language,
    languageName,
  };
}
