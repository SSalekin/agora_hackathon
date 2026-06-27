import assert from 'node:assert';
import {
  initiateTelephonyCall,
  endTelephonyCall,
  type TelephonyCallParams,
} from '../lib/telephony-client.js';
import { routeCall, type LandlordInfo } from '../lib/call-router.js';
import { CallSessionManager } from '../lib/call-session-manager.js';

console.log('Testing Telephony Integration...');

// Save original env
const originalEnv = { ...process.env };

// --- Test 1: Call routing for external landlord selects telephony ---
console.log('Test 1: Call routing for external landlord selects telephony...');

const externalLandlord: LandlordInfo = {
  isAppUser: false,
  phone: '+84912345678',
};

const routingDecision = routeCall(externalLandlord, 'da nang');

assert.strictEqual(routingDecision.landlordType, 'external');
assert.strictEqual(routingDecision.callMethod, 'telephony');
assert.strictEqual(routingDecision.language, 'vi');
assert.strictEqual(routingDecision.languageName, 'Vietnamese');

console.log('  PASS: External landlord routed to telephony with correct language');

// --- Test 2: Call routing for app-user landlord selects agora ---
console.log('Test 2: Call routing for app-user landlord selects agora...');

const appUserLandlord: LandlordInfo = {
  isAppUser: true,
  wallet: '0xABC123',
};

const agoraDecision = routeCall(appUserLandlord, 'paris');

assert.strictEqual(agoraDecision.landlordType, 'app-user');
assert.strictEqual(agoraDecision.callMethod, 'agora');
assert.strictEqual(agoraDecision.language, 'fr');
assert.strictEqual(agoraDecision.languageName, 'French');

console.log('  PASS: App-user landlord routed to Agora');

// --- Test 3: Telephony call initiation fails without credentials ---
console.log('Test 3: Telephony call initiation fails without credentials...');

delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.TWILIO_AUTH_TOKEN;
delete process.env.TWILIO_PHONE_NUMBER;

const telephonyParams: TelephonyCallParams = {
  to: '+84912345678',
  listingId: 'listing-vn-001',
  tenantId: 'tenant-001',
  questions: ['Is the apartment available?', 'What is the monthly rent?'],
  language: 'vi',
  questionQueueItemId: 'queue-001',
};

initiateTelephonyCall(telephonyParams).then((result) => {
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Telephony not configured');
  assert.strictEqual(result.callSid, undefined);

  console.log('  PASS: Telephony call returns error when credentials missing');

  // --- Test 4: endTelephonyCall returns false without credentials ---
  console.log('Test 4: endTelephonyCall returns false without credentials...');

  return endTelephonyCall('CA1234567890');
}).then((endResult) => {
  assert.strictEqual(endResult, false);

  console.log('  PASS: endTelephonyCall returns false without credentials');

  // --- Test 5: Session creation for telephony call ---
  console.log('Test 5: Session creation for telephony call...');

  process.env = { ...originalEnv };

  const manager = new CallSessionManager();

  const mockQueueItem = {
    id: 'queue-002',
    listingId: 'listing-fr-001',
    tenantId: 'tenant-002',
    questions: ['Is there parking?', 'What are the utilities?'],
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  const session = manager.createSession(
    mockQueueItem,
    undefined,
    '+33612345678',
    'telephony',
    'fr'
  );

  assert.ok(session.id, 'should generate session id');
  assert.strictEqual(session.callMethod, 'telephony');
  assert.strictEqual(session.landlordPhone, '+33612345678');
  assert.strictEqual(session.landlordWallet, undefined);
  assert.strictEqual(session.language, 'fr');
  assert.strictEqual(session.status, 'initiating');

  console.log('  PASS: Telephony session created with correct fields');

  // --- Test 6: Register and lookup call SID ---
  console.log('Test 6: Register and lookup call SID...');

  manager.registerCallSid(session.id, 'CA_ABCDEF_123456');

  const lookedUp = manager.getSessionByCallSid('CA_ABCDEF_123456');
  assert.ok(lookedUp, 'should find session by call SID');
  assert.strictEqual(lookedUp.id, session.id);

  const missingLookup = manager.getSessionByCallSid('CA_NONEXISTENT');
  assert.strictEqual(missingLookup, undefined);

  console.log('  PASS: Call SID registration and lookup works');

  // --- Test 7: Record answers for telephony session ---
  console.log('Test 7: Record answers for telephony session...');

  manager.recordAnswer(session.id, 0, 'Yes, street parking available', false);
  assert.strictEqual(session.answers.length, 1);
  assert.strictEqual(session.answers[0].questionIndex, 0);
  assert.strictEqual(session.answers[0].answer, 'Yes, street parking available');
  assert.strictEqual(session.answers[0].skipped, false);

  manager.recordAnswer(session.id, 1, 'skip', true);
  assert.strictEqual(session.answers.length, 2);
  assert.strictEqual(session.answers[1].skipped, true);

  console.log('  PASS: Answers recorded correctly for telephony session');

  // --- Test 8: Session status transitions ---
  console.log('Test 8: Session status transitions...');

  manager.updateSessionStatus(session.id, 'active');
  assert.strictEqual(session.status, 'active');

  manager.updateSessionStatus(session.id, 'completed');
  assert.strictEqual(session.status, 'completed');
  assert.ok(session.endedAt, 'should have endedAt timestamp');

  console.log('  PASS: Session status transitions work correctly');

  // --- Test 9: Telephony call with various languages ---
  console.log('Test 9: Telephony routing with various languages...');

  const languageTests: Array<{ landlord: LandlordInfo; city: string; expectedLang: string }> = [
    { landlord: { isAppUser: false, phone: '+84912345678' }, city: 'ho chi minh', expectedLang: 'vi' },
    { landlord: { isAppUser: false, phone: '+81901234567' }, city: 'tokyo', expectedLang: 'ja' },
    { landlord: { isAppUser: false, phone: '+82101234567' }, city: 'seoul', expectedLang: 'ko' },
    { landlord: { isAppUser: false, phone: '+49123456789' }, city: 'berlin', expectedLang: 'de' },
    { landlord: { isAppUser: false, phone: '+34123456789' }, city: 'madrid', expectedLang: 'es' },
    { landlord: { isAppUser: false, phone: '+39123456789' }, city: 'rome', expectedLang: 'it' },
    { landlord: { isAppUser: false, phone: '+66123456789' }, city: 'bangkok', expectedLang: 'th' },
    { landlord: { isAppUser: false, phone: '+44123456789' }, city: 'london', expectedLang: 'en' },
  ];

  for (const test of languageTests) {
    const decision = routeCall(test.landlord, test.city);
    assert.strictEqual(decision.callMethod, 'telephony', `${test.city} should use telephony`);
    assert.strictEqual(decision.language, test.expectedLang, `${test.city} should map to ${test.expectedLang}`);
  }

  console.log('  PASS: All language routing tests passed');

  // Restore env
  process.env = { ...originalEnv };

  console.log('');
  console.log('All Telephony Integration tests passed!');
  console.log('All tests passed!');
}).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
