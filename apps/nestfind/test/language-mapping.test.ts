import assert from 'node:assert';
import { getLanguageFromLocation, getLanguageName } from '../lib/language-mapping.js';

// Test getLanguageFromLocation
console.log('Testing getLanguageFromLocation...');

// Direct matches
assert.strictEqual(getLanguageFromLocation('da nang'), 'vi');
assert.strictEqual(getLanguageFromLocation('Danang'), 'vi');
assert.strictEqual(getLanguageFromLocation('VIETNAM'), 'vi');
assert.strictEqual(getLanguageFromLocation('hanoi'), 'vi');
assert.strictEqual(getLanguageFromLocation('Ho Chi Minh'), 'vi');
assert.strictEqual(getLanguageFromLocation('paris'), 'fr');
assert.strictEqual(getLanguageFromLocation('France'), 'fr');
assert.strictEqual(getLanguageFromLocation('tokyo'), 'ja');
assert.strictEqual(getLanguageFromLocation('Japan'), 'ja');
assert.strictEqual(getLanguageFromLocation('seoul'), 'ko');
assert.strictEqual(getLanguageFromLocation('Korea'), 'ko');
assert.strictEqual(getLanguageFromLocation('bangkok'), 'th');
assert.strictEqual(getLanguageFromLocation('Thailand'), 'th');
assert.strictEqual(getLanguageFromLocation('berlin'), 'de');
assert.strictEqual(getLanguageFromLocation('Germany'), 'de');
assert.strictEqual(getLanguageFromLocation('madrid'), 'es');
assert.strictEqual(getLanguageFromLocation('Spain'), 'es');
assert.strictEqual(getLanguageFromLocation('rome'), 'it');
assert.strictEqual(getLanguageFromLocation('Italy'), 'it');
assert.strictEqual(getLanguageFromLocation('london'), 'en');
assert.strictEqual(getLanguageFromLocation('UK'), 'en');
assert.strictEqual(getLanguageFromLocation('United Kingdom'), 'en');
assert.strictEqual(getLanguageFromLocation('new york'), 'en');
assert.strictEqual(getLanguageFromLocation('USA'), 'en');
assert.strictEqual(getLanguageFromLocation('United States'), 'en');

// Partial matches
assert.strictEqual(getLanguageFromLocation('Da Nang, Vietnam'), 'vi');
assert.strictEqual(getLanguageFromLocation('Paris, France'), 'fr');
assert.strictEqual(getLanguageFromLocation('Tokyo, Japan'), 'ja');
assert.strictEqual(getLanguageFromLocation('Seoul, South Korea'), 'ko');
assert.strictEqual(getLanguageFromLocation('Bangkok, Thailand'), 'th');
assert.strictEqual(getLanguageFromLocation('Berlin, Germany'), 'de');
assert.strictEqual(getLanguageFromLocation('Madrid, Spain'), 'es');
assert.strictEqual(getLanguageFromLocation('Rome, Italy'), 'it');
assert.strictEqual(getLanguageFromLocation('London, UK'), 'en');
assert.strictEqual(getLanguageFromLocation('New York, USA'), 'en');

// Default case
assert.strictEqual(getLanguageFromLocation('unknown city'), 'en');
assert.strictEqual(getLanguageFromLocation(''), 'en');
assert.strictEqual(getLanguageFromLocation('  '), 'en');

console.log('All getLanguageFromLocation tests passed!');

// Test getLanguageName
console.log('Testing getLanguageName...');

assert.strictEqual(getLanguageName('en'), 'English');
assert.strictEqual(getLanguageName('fr'), 'French');
assert.strictEqual(getLanguageName('vi'), 'Vietnamese');
assert.strictEqual(getLanguageName('ja'), 'Japanese');
assert.strictEqual(getLanguageName('ko'), 'Korean');
assert.strictEqual(getLanguageName('th'), 'Thai');
assert.strictEqual(getLanguageName('de'), 'German');
assert.strictEqual(getLanguageName('es'), 'Spanish');
assert.strictEqual(getLanguageName('it'), 'Italian');
assert.strictEqual(getLanguageName('unknown'), 'English');

console.log('All getLanguageName tests passed!');
console.log('All tests passed!');