import { callSessionManager } from './call-session-manager';
import { retryScheduler } from './retry-scheduler';
import { createLogger } from './logger';

const log = createLogger({ module: 'call-monitor' });

const STALE_SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

export class CallMonitor {
  private intervalId: NodeJS.Timeout | null = null;

  start(): void {
    if (this.intervalId) {
      log.warn('Call monitor already running');
      return;
    }

    log.info('Starting call monitor');
    this.intervalId = setInterval(() => {
      this.checkStaleSessions();
    }, CHECK_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      log.info('Call monitor stopped');
    }
  }

  checkStaleSessions(): void {
    const activeSessions = callSessionManager.getActiveSessions();
    const now = Date.now();

    for (const session of activeSessions) {
      const sessionAge = now - new Date(session.startedAt).getTime();

      if (sessionAge > STALE_SESSION_TIMEOUT_MS) {
        log.warn('Stale session detected', {
          sessionId: session.id,
          ageMs: sessionAge,
          status: session.status,
        });

        // Mark as failed and schedule retry
        callSessionManager.updateSessionStatus(session.id, 'failed');

        if (callSessionManager.shouldRetry(session)) {
          retryScheduler.scheduleRetry(session.id);
        }
      }
    }
  }
}

export const callMonitor = new CallMonitor();
