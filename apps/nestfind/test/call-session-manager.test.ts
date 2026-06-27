import assert from 'node:assert';
import { CallSessionManager } from '../lib/call-session-manager.js';
import type { QuestionQueueItem } from '../types/faq.js';

console.log('Testing CallSessionManager...');

const manager = new CallSessionManager();

const mockQueueItem: QuestionQueueItem = {
  id: 'q-123',
  listingId: 'listing-1',
  tenantId: 'tenant-1',
  questions: ['Is parking available?', 'What is the rent?'],
  status: 'pending',
  createdAt: new Date().toISOString(),
  attempts: 0,
};

// Create session
const session = manager.createSession(mockQueueItem, '0x123', undefined, 'agora', 'en');
assert.ok(session.id, 'should generate session id');
assert.strictEqual(session.status, 'initiating');
assert.strictEqual(session.channelId?.startsWith('landlord-call-'), true);
assert.strictEqual(session.agentUid, 789012);
assert.strictEqual(session.answers.length, 0);

// Update status
manager.updateSessionStatus(session.id, 'active');
assert.strictEqual(session.status, 'active');

// Record answer
manager.recordAnswer(session.id, 0, 'Yes, street parking', false);
assert.strictEqual(session.answers.length, 1);
assert.strictEqual(session.answers[0].skipped, false);

// Record skip
manager.recordAnswer(session.id, 1, '', true);
assert.strictEqual(session.answers.length, 2);
assert.strictEqual(session.answers[1].skipped, true);

// Complete session
manager.updateSessionStatus(session.id, 'completed');
assert.strictEqual(session.status, 'completed');
assert.ok(session.endedAt, 'should have endedAt');

// Retry logic
const failSession = manager.createSession(mockQueueItem, '0x456', undefined, 'agora', 'fr');
assert.strictEqual(manager.shouldRetry(failSession), true);

manager.incrementRetry(failSession);
assert.strictEqual(failSession.retryCount, 1);
assert.ok(failSession.nextRetryAt, 'should have nextRetryAt');

// Get active sessions
const active = manager.getActiveSessions();
assert.strictEqual(active.length, 1); // Only the failSession is still active

console.log('All CallSessionManager tests passed!');
console.log('All tests passed!');