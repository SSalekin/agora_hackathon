import { randomUUID } from 'node:crypto';
import type { CallSession, QuestionQueueItem, FAQItem } from '@/types/faq';
import { createLogger } from './logger';

const log = createLogger({ module: 'call-session-manager' });

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000]; // 5min, 15min, 1hr

export class CallSessionManager {
  private activeSessions: Map<string, CallSession> = new Map();

  createSession(
    queueItem: QuestionQueueItem,
    landlordWallet?: string,
    landlordPhone?: string,
    callMethod: 'agora' | 'telephony' = 'agora',
    language: string = 'en'
  ): CallSession {
    const session: CallSession = {
      id: randomUUID(),
      questionQueueItemId: queueItem.id,
      landlordWallet,
      landlordPhone,
      callMethod,
      language,
      status: 'initiating',
      startedAt: new Date().toISOString(),
      channelId: `landlord-call-${Date.now()}-${randomUUID().slice(0, 8)}`,
      agentUid: 789012, // LANDLORD_AGENT_UID
      currentQuestionIndex: 0,
      answers: [],
      retryCount: 0,
    };

    this.activeSessions.set(session.id, session);
    log.info('Session created', { sessionId: session.id, channelId: session.channelId });
    return session;
  }

  updateSessionStatus(
    sessionId: string,
    status: CallSession['status'],
    transcript?: string
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      log.warn('Session not found', { sessionId });
      return;
    }

    session.status = status;
    if (status === 'completed' || status === 'failed') {
      session.endedAt = new Date().toISOString();
    }
    if (transcript) {
      session.transcript = transcript;
    }

    log.info('Session status updated', { sessionId, status });
  }

  recordAnswer(sessionId: string, questionIndex: number, answer: string, skipped: boolean): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.answers.push({ questionIndex, answer, skipped });
    session.currentQuestionIndex = questionIndex + 1;

    log.info('Answer recorded', {
      sessionId,
      questionIndex,
      skipped,
      totalAnswers: session.answers.length,
    });
  }

  shouldRetry(session: CallSession): boolean {
    return session.retryCount < MAX_RETRIES;
  }

  getNextRetryDelay(session: CallSession): number {
    return RETRY_DELAYS_MS[session.retryCount] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
  }

  incrementRetry(session: CallSession): void {
    session.retryCount++;
    session.lastRetryAt = new Date().toISOString();
    const delay = this.getNextRetryDelay(session);
    session.nextRetryAt = new Date(Date.now() + delay).toISOString();
    log.info('Retry scheduled', {
      sessionId: session.id,
      retryCount: session.retryCount,
      nextRetryAt: session.nextRetryAt,
    });
  }

  getActiveSessions(): CallSession[] {
    return Array.from(this.activeSessions.values()).filter(
      (s) => s.status === 'initiating' || s.status === 'active'
    );
  }

  getSession(sessionId: string): CallSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  removeSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }
}

// Singleton instance
export const callSessionManager = new CallSessionManager();