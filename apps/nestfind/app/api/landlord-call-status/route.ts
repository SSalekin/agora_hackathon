import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { callSessionManager } from '@/lib/call-session-manager';
import { createNotification } from '@/lib/notification-service';
import { updateApartmentFAQ } from '@/lib/db/apartment-listings';
import { createLogger } from '@/lib/logger';
import type { FAQItem } from '@/types/faq';

const log = createLogger({ module: 'landlord-call-status' });

interface CallStatusWebhook {
  sessionId: string;
  status: 'completed' | 'failed';
  transcript?: string;
  answers?: { questionIndex: number; answer: string; skipped: boolean }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CallStatusWebhook = await request.json();
    const { sessionId, status, transcript, answers } = body;

    if (!sessionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const session = callSessionManager.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update session status
    callSessionManager.updateSessionStatus(sessionId, status, transcript);

    // If completed with answers, persist FAQ items
    if (status === 'completed' && answers && answers.length > 0) {
      const faqItems: FAQItem[] = answers.map((answer) => ({
        id: `faq-${sessionId}-${answer.questionIndex}`,
        question: session.questions[answer.questionIndex] || '',
        answer: answer.answer,
        status: answer.skipped ? 'skipped' : 'answered',
        askedBy: session.tenantId,
        askedAt: session.startedAt,
        answeredAt: new Date().toISOString(),
        language: session.language,
      }));

      await updateApartmentFAQ(session.listingId, faqItems);
      log.info('FAQ answers persisted', { sessionId, listingId: session.listingId, faqItemCount: faqItems.length });
    }

    // Handle telephony sessions (callMethod === 'telephony')
    if (session.callMethod === 'telephony' && session.answers.length > 0) {
      const faqItems: FAQItem[] = session.answers.map(answer => ({
        id: randomUUID(),
        question: session.questions[answer.questionIndex] || '',
        answer: answer.answer,
        status: answer.skipped ? 'skipped' : 'answered',
        askedBy: session.tenantId,
        askedAt: session.startedAt,
        answeredAt: new Date().toISOString(),
        language: session.language,
      }));

      if (faqItems.length > 0) {
        await updateApartmentFAQ(session.listingId, faqItems);
        log.info('FAQ updated for telephony call', {
          sessionId,
          faqItemCount: faqItems.length,
        });
      }
    }

    // Notify tenant
    const notificationType = status === 'completed' ? 'question-answered' : 'call-failed';
    const notificationTitle = status === 'completed' ? 'Questions Answered' : 'Call Failed';
    const notificationBody = status === 'completed'
      ? 'The landlord has answered your questions. Check the FAQ section for details.'
      : "We couldn't reach the landlord. We'll retry later.";

    createNotification(
      session.questionQueueItemId,
      notificationType,
      notificationTitle,
      notificationBody,
      session.questionQueueItemId
    );

    log.info('Call status webhook processed', { sessionId, status });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error processing call status webhook', error as Error);
    return NextResponse.json(
      { error: 'Failed to process webhook', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
