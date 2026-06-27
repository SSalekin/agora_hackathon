import { callSessionManager } from './call-session-manager';
import { createLogger } from './logger';

const log = createLogger({ module: 'retry-scheduler' });

export class RetryScheduler {
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();

  scheduleRetry(sessionId: string): void {
    this.cancelRetry(sessionId);

    const session = callSessionManager.getSession(sessionId);
    if (!session) {
      log.warn('Cannot schedule retry: session not found', { sessionId });
      return;
    }

    if (!callSessionManager.shouldRetry(session)) {
      log.info('Max retries reached', { sessionId, retryCount: session.retryCount });
      return;
    }

    const delay = callSessionManager.getNextRetryDelay(session);
    log.info('Scheduling retry', { sessionId, delayMs: delay, retryCount: session.retryCount + 1 });

    const timer = setTimeout(() => {
      this.processRetry(sessionId).catch((err) => {
        log.error('Unhandled error in processRetry', err, { sessionId });
      });
      this.retryTimers.delete(sessionId);
    }, delay);

    this.retryTimers.set(sessionId, timer);
  }

  private async processRetry(sessionId: string): Promise<void> {
    const session = callSessionManager.getSession(sessionId);
    if (!session || session.status !== 'failed') {
      return;
    }

    log.info('Processing retry', { sessionId, retryCount: session.retryCount });

    // Increment retry count
    callSessionManager.incrementRetry(session);

    // Attempt to restart the call
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/initiate-landlord-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionQueueItemId: session.questionQueueItemId,
          listingId: session.questionQueueItemId, // Simplified - in production store listingId
          tenantId: session.questionQueueItemId, // Simplified - in production store tenantId
          questions: [], // Will be populated from queue item
          landlord: { wallet: session.landlordWallet, isAppUser: true },
          listingLocation: '', // Will be determined from listing
        }),
      });

      if (response.ok) {
        log.info('Retry initiated successfully', { sessionId });
      } else {
        log.warn('Retry failed', { sessionId, status: response.status });
        // Schedule another retry if applicable
        if (callSessionManager.shouldRetry(session)) {
          this.scheduleRetry(sessionId);
        }
      }
    } catch (error) {
      log.error('Retry attempt failed', error as Error, { sessionId });
      if (callSessionManager.shouldRetry(session)) {
        this.scheduleRetry(sessionId);
      }
    }
  }

  cancelRetry(sessionId: string): void {
    const timer = this.retryTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(sessionId);
      log.info('Retry cancelled', { sessionId });
    }
  }

  cancelAllRetries(): void {
    for (const [sessionId, timer] of this.retryTimers) {
      clearTimeout(timer);
      log.info('Retry cancelled', { sessionId });
    }
    this.retryTimers.clear();
  }
}

export const retryScheduler = new RetryScheduler();