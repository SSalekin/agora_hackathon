import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth';
import { validateQuestion, checkDuplicateQuestions } from '@/lib/question-collector';
import { routeCall } from '@/lib/call-router';
import { createFAQItemWithId } from '@/lib/faq-updater';
import { createNotification } from '@/lib/notification-service';
import { updateApartmentFAQ, getListingFAQ } from '@/lib/db/apartment-listings';
import { checkRateLimit } from '@/lib/rate-limiter';
import { createLogger } from '@/lib/logger';
import type { QuestionQueueItem } from '@/types/faq';

const log = createLogger({ module: 'ask-landlord' });

type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'AUTH_MISMATCH'
  | 'MISSING_FIELDS'
  | 'INVALID_QUESTIONS'
  | 'RATE_LIMITED'
  | 'LISTING_NOT_FOUND'
  | 'LANDLORD_INVALID'
  | 'DUPLICATE_QUESTIONS'
  | 'INTERNAL_ERROR';

interface AskLandlordRequest {
  listingId: string;
  tenantId: string;
  questions: string[];
  landlord: { wallet?: string; phone?: string; isAppUser: boolean };
  listingLocation: string;
}

const questionQueue: QuestionQueueItem[] = [];

export async function POST(request: NextRequest) {
  let tenantId = '';
  let listingId = '';

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' satisfies ErrorCode },
        { status: 401 }
      );
    }

    const tokenUser = getUserFromToken(token);
    if (!tokenUser) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'AUTH_INVALID' satisfies ErrorCode },
        { status: 401 }
      );
    }

    const body: AskLandlordRequest = await request.json();
    listingId = body.listingId;
    tenantId = body.tenantId;
    const { questions, landlord, listingLocation } = body;

    log.info('Processing question submission', { tenantId, listingId, questionCount: questions.length });

    if (!listingId || !tenantId || !questions.length || !landlord || !listingLocation) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_FIELDS' satisfies ErrorCode },
        { status: 400 }
      );
    }

    if (tokenUser.id !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID does not match authenticated user', code: 'AUTH_MISMATCH' satisfies ErrorCode },
        { status: 403 }
      );
    }

    const validationResults = questions.map((q) => validateQuestion(q));
    const invalidQuestions = validationResults.filter((r) => !r.valid);

    if (invalidQuestions.length > 0) {
      log.warn('Validation failed', { tenantId, listingId, error: invalidQuestions });
      return NextResponse.json(
        { error: 'Invalid questions', code: 'INVALID_QUESTIONS' satisfies ErrorCode, details: invalidQuestions },
        { status: 400 }
      );
    }

    const rateLimitResult = checkRateLimit(tenantId, listingId, questionQueue);
    if (!rateLimitResult.allowed) {
      log.warn('Rate limit exceeded', { tenantId, listingId });
      return NextResponse.json(
        { error: rateLimitResult.error, code: 'RATE_LIMITED' satisfies ErrorCode, retryAfterMs: rateLimitResult.retryAfterMs },
        { status: 429 }
      );
    }

    let existingFAQ;
    try {
      existingFAQ = await getListingFAQ(listingId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Listing not found', code: 'LISTING_NOT_FOUND' satisfies ErrorCode },
          { status: 404 }
        );
      }
      throw error;
    }

    const duplicateCheck = checkDuplicateQuestions(questions, existingFAQ);
    if (duplicateCheck.duplicates.length > 0) {
      log.warn('Duplicate questions detected', { tenantId, listingId, duplicates: duplicateCheck.duplicates });
      if (duplicateCheck.unique.length === 0) {
        return NextResponse.json(
          { error: 'All questions are duplicates of existing FAQ items', code: 'DUPLICATE_QUESTIONS' satisfies ErrorCode, duplicates: duplicateCheck.duplicates },
          { status: 409 }
        );
      }
      log.info('Proceeding with unique questions only', { tenantId, listingId, skipped: duplicateCheck.duplicates.length });
    }

    const questionsToProcess = duplicateCheck.unique;

    let routingDecision;
    try {
      routingDecision = routeCall(landlord, listingLocation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid landlord configuration';
      log.warn('Landlord validation failed', { tenantId, listingId, error: message });
      return NextResponse.json(
        { error: message, code: 'LANDLORD_INVALID' satisfies ErrorCode },
        { status: 400 }
      );
    }

    const faqItems = questionsToProcess.map((q) =>
      createFAQItemWithId(q, '', tenantId, routingDecision.language, 'pending')
    );

    try {
      await updateApartmentFAQ(listingId, faqItems);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Listing not found', code: 'LISTING_NOT_FOUND' satisfies ErrorCode },
          { status: 404 }
        );
      }
      throw error;
    }

    const queueItem: QuestionQueueItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      listingId,
      tenantId,
      questions: questionsToProcess,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    questionQueue.push(queueItem);

    try {
      const callResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/initiate-landlord-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionQueueItemId: queueItem.id,
          listingId,
          tenantId,
          questions: questionsToProcess,
          landlord,
          listingLocation,
        }),
      });

      if (callResponse.ok) {
        const callResult = await callResponse.json();
        queueItem.status = 'in-progress';
        log.info('Landlord call initiated', { queueItemId: queueItem.id, sessionId: callResult.sessionId });
      } else {
        log.warn('Failed to initiate landlord call', { queueItemId: queueItem.id });
      }
    } catch (error) {
      log.warn('Call initiation failed, questions queued for retry', { queueItemId: queueItem.id, error: (error as Error).message });
    }

    createNotification(
      tenantId,
      'question-submitted',
      'Questions Submitted',
      `Your questions about the apartment have been submitted. We'll call the landlord and get back to you.`,
      listingId
    );

    log.info('Questions submitted successfully', { tenantId, listingId, queueItemId: queueItem.id });

    return NextResponse.json({
      success: true,
      routingDecision,
      faqItems,
      queueItemId: queueItem.id,
      message: 'Questions submitted successfully. We will call the landlord and update you with answers.',
    });

  } catch (error) {
    log.error('Failed to process questions', error as Error, { tenantId, listingId });
    return NextResponse.json(
      { error: 'Failed to process questions', code: 'INTERNAL_ERROR' satisfies ErrorCode },
      { status: 500 }
    );
  }
}
