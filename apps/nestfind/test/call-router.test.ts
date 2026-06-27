import assert from 'node:assert';
import {
  determineLandlordType,
  determineCallMethod,
  getLanguageFromListing,
  routeCall,
  validateLandlordInfo,
  type LandlordInfo,
  type CallMethod,
} from '../lib/call-router.js';

// Test determineLandlordType
console.log('Testing determineLandlordType...');

assert.strictEqual(determineLandlordType({ isAppUser: true }), 'app-user');
assert.strictEqual(determineLandlordType({ isAppUser: false }), 'external');
assert.strictEqual(determineLandlordType({ isAppUser: true, wallet: '0x123' }), 'app-user');
assert.strictEqual(determineLandlordType({ isAppUser: false, phone: '+1234567890' }), 'external');

console.log('All determineLandlordType tests passed!');

// Test determineCallMethod
console.log('Testing determineCallMethod...');

assert.strictEqual(determineCallMethod('app-user', { isAppUser: true, wallet: '0x123' }), 'agora');
assert.strictEqual(determineCallMethod('external', { isAppUser: false, phone: '+1234567890' }), 'telephony');

// Test determineCallMethod throws for external without phone
assert.throws(
  () => determineCallMethod('external', { isAppUser: false }),
  { message: /External landlord must have a phone number/ }
);

console.log('All determineCallMethod tests passed!');

// Test getLanguageFromListing
console.log('Testing getLanguageFromListing...');

assert.deepStrictEqual(getLanguageFromListing('tokyo'), { code: 'ja', name: 'Japanese' });
assert.deepStrictEqual(getLanguageFromListing('paris'), { code: 'fr', name: 'French' });
assert.deepStrictEqual(getLanguageFromListing('london'), { code: 'en', name: 'English' });
assert.deepStrictEqual(getLanguageFromListing('berlin'), { code: 'de', name: 'German' });
assert.deepStrictEqual(getLanguageFromListing('madrid'), { code: 'es', name: 'Spanish' });
assert.deepStrictEqual(getLanguageFromListing('rome'), { code: 'it', name: 'Italian' });
assert.deepStrictEqual(getLanguageFromListing('seoul'), { code: 'ko', name: 'Korean' });
assert.deepStrictEqual(getLanguageFromListing('bangkok'), { code: 'th', name: 'Thai' });
assert.deepStrictEqual(getLanguageFromListing('da nang'), { code: 'vi', name: 'Vietnamese' });
assert.deepStrictEqual(getLanguageFromListing('unknown city'), { code: 'en', name: 'English' });

console.log('All getLanguageFromListing tests passed!');

// Test validateLandlordInfo
console.log('Testing validateLandlordInfo...');

// Valid app user
assert.deepStrictEqual(
  validateLandlordInfo({ isAppUser: true, wallet: '0x123' }, 'agora'),
  { valid: true }
);

// Valid external
assert.deepStrictEqual(
  validateLandlordInfo({ isAppUser: false, phone: '+1234567890' }, 'telephony'),
  { valid: true }
);

// Invalid: external without phone
const invalidExternal = validateLandlordInfo({ isAppUser: false }, 'telephony');
assert.strictEqual(invalidExternal.valid, false);
assert.ok(invalidExternal.error?.includes('phone number'));

// Invalid: app user without wallet
const invalidAppUser = validateLandlordInfo({ isAppUser: true }, 'agora');
assert.strictEqual(invalidAppUser.valid, false);
assert.ok(invalidAppUser.error?.includes('wallet'));

console.log('All validateLandlordInfo tests passed!');

// Test routeCall throws on invalid
console.log('Testing routeCall validation...');

assert.throws(
  () => routeCall({ isAppUser: false }, 'paris'),
  { message: /phone number/ }
);

assert.throws(
  () => routeCall({ isAppUser: true }, 'tokyo'),
  { message: /wallet address/ }
);

console.log('All routeCall validation tests passed!');

// Test routeCall
console.log('Testing routeCall...');

// App user in Tokyo
assert.deepStrictEqual(
  routeCall({ isAppUser: true, wallet: '0x123' }, 'tokyo'),
  {
    landlordType: 'app-user',
    callMethod: 'agora',
    language: 'ja',
    languageName: 'Japanese',
  }
);

// External contact in Paris
assert.deepStrictEqual(
  routeCall({ isAppUser: false, phone: '+33123456789' }, 'paris'),
  {
    landlordType: 'external',
    callMethod: 'telephony',
    language: 'fr',
    languageName: 'French',
  }
);

// App user with wallet in London
assert.deepStrictEqual(
  routeCall({ isAppUser: true, wallet: '0xabc' }, 'london'),
  {
    landlordType: 'app-user',
    callMethod: 'agora',
    language: 'en',
    languageName: 'English',
  }
);

// External contact in unknown city
assert.deepStrictEqual(
  routeCall({ isAppUser: false, phone: '+1234567890' }, 'unknown city'),
  {
    landlordType: 'external',
    callMethod: 'telephony',
    language: 'en',
    languageName: 'English',
  }
);

console.log('All routeCall tests passed!');
console.log('All tests passed!');
