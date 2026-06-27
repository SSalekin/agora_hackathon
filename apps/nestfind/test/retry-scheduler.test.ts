import assert from 'node:assert';
import { RetryScheduler } from '../lib/retry-scheduler.js';
import { CallSessionManager } from '../lib/call-session-manager.js';
import type { QuestionQueueItem } from '../types/faq.js';

console.log('Testing RetryScheduler...');

const manager = new CallSessionManager();
const scheduler = new RetryScheduler();

const mockQueueItem: QuestionQueueItem = {
  id: 'q-123',
  listingId: 'listing-1',
  tenantId: 'tenant-1',
  questions: ['Is parking available?'],
  status: 'pending',
  createdAt: new Date().toISOString(),
  attempts: 0,
};

// Create and fail a session
const session = manager.createSession(mockQueueItem, '0x123', undefined, 'agora', 'en');
manager.updateSessionStatus(session.id, 'failed');

// Schedule retry
scheduler.scheduleRetry(session.id);
assert.strictEqual(manager.shouldRetry(session), true);

// Cancel retry
scheduler.cancelRetry(session.id);

// Cancel all retries
scheduler.scheduleRetry(session.id);
scheduler.cancelAllRetries();

console.log('All RetryScheduler tests passed!');
console.log('All tests passed!');