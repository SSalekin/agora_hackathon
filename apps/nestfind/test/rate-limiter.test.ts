import assert from 'node:assert';
import { checkRateLimit } from '../lib/rate-limiter.js';
import type { QuestionQueueItem } from '../types/faq.js';

console.log('Testing checkRateLimit...');

// Empty queue - should allow
const emptyResult = checkRateLimit('tenant-1', 'listing-1', []);
assert.strictEqual(emptyResult.allowed, true);

// Within limits
const withinLimits = checkRateLimit('tenant-1', 'listing-1', [
  {
    id: 'q1',
    listingId: 'listing-1',
    tenantId: 'tenant-1',
    questions: ['Test?'],
    status: 'completed',
    createdAt: new Date().toISOString(),
    attempts: 1,
  },
]);
assert.strictEqual(withinLimits.allowed, true);

// Exceed hourly limit
const hourlyQueue: QuestionQueueItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `q${i}`,
  listingId: 'listing-1',
  tenantId: 'tenant-1',
  questions: ['Test?'],
  status: 'completed',
  createdAt: new Date().toISOString(),
  attempts: 1,
}));

const hourlyLimit = checkRateLimit('tenant-1', 'listing-1', hourlyQueue);
assert.strictEqual(hourlyLimit.allowed, false);
assert.ok(hourlyLimit.error?.includes('per hour'));
assert.ok(hourlyLimit.retryAfterMs);

// Different tenant - should allow
const differentTenant = checkRateLimit('tenant-2', 'listing-1', hourlyQueue);
assert.strictEqual(differentTenant.allowed, true);

// Exceed pending limit
const pendingQueue: QuestionQueueItem[] = Array.from({ length: 5 }, (_, i) => ({
  id: `q${i}`,
  listingId: 'listing-1',
  tenantId: 'tenant-1',
  questions: ['Test?'],
  status: 'pending',
  createdAt: new Date().toISOString(),
  attempts: 0,
}));

const pendingLimit = checkRateLimit('tenant-1', 'listing-1', pendingQueue);
assert.strictEqual(pendingLimit.allowed, false);
assert.ok(pendingLimit.error?.includes('pending'));

console.log('All checkRateLimit tests passed!');
console.log('All tests passed!');