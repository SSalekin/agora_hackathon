import assert from 'node:assert';
import {
  initiateTelephonyCall,
  endTelephonyCall,
  type TelephonyCallParams,
} from '../lib/telephony-client.js';

console.log('Testing telephony-client...');

// Save original env
const originalEnv = { ...process.env };

// Test: returns error when Twilio credentials not configured
console.log('Testing missing credentials...');
delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.TWILIO_AUTH_TOKEN;
delete process.env.TWILIO_PHONE_NUMBER;

const params: TelephonyCallParams = {
  to: '+1234567890',
  listingId: 'listing-1',
  tenantId: 'tenant-1',
  questions: ['Is parking available?'],
  language: 'en',
  questionQueueItemId: 'q-123',
};

initiateTelephonyCall(params).then((result) => {
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Telephony not configured');
  assert.strictEqual(result.callSid, undefined);
  console.log('Missing credentials test passed!');

  // Test: endTelephonyCall returns false when not configured
  console.log('Testing endTelephonyCall without credentials...');
  return endTelephonyCall('CA1234567890');
}).then((endResult) => {
  assert.strictEqual(endResult, false);
  console.log('endTelephonyCall without credentials test passed!');

  // Restore env
  process.env = { ...originalEnv };

  console.log('All telephony-client tests passed!');
  console.log('All tests passed!');
});
