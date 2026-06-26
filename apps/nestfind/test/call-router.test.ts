import assert from 'node:assert';
import {
  determineLandlordType,
  determineCallMethod,
  getLanguageFromListing,
  routeCall,
  type LandlordInfo,
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

assert.strictEqual(determineCallMethod('app-user'), 'agora');
assert.strictEqual(determineCallMethod('external'), 'telephony');

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

// Test routeCall
console.log('Testing routeCall...');

// App user in Tokyo
assert.deepStrictEqual(
  routeCall({ isAppUser: true }, 'tokyo'),
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

// External contact with no extra info in unknown city
assert.deepStrictEqual(
  routeCall({ isAppUser: false }, 'unknown city'),
  {
    landlordType: 'external',
    callMethod: 'telephony',
    language: 'en',
    languageName: 'English',
  }
);

console.log('All routeCall tests passed!');
console.log('All tests passed!');
