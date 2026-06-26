import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth';
import { validateQuestion } from '@/lib/question-collector';
import { routeCall } from '@/lib/call-router';
import { createFAQItemWithId } from '@/lib/faq-updater';
import { createNotification } from '@/lib/notification-service';
import { updateApartmentFAQ } from '@/lib/db/apartment-listings';
import { checkRateLimit } from '@/lib/rate-limiter';
import type { QuestionQueueItem } from '@/types/faq';

interface AskLandlordRequest {
  listingId: string;
  tenantId: string;
  questions: string[];
  landlord: { wallet?: string; phone?: string; isAppUser: boolean };
  listingLocation: string;
}

const questionQueue: QuestionQueueItem[] = [];

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tokenUser = getUserFromToken(token);
    if (!tokenUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body: AskLandlordRequest = await request.json();
    const { listingId, tenantId, questions, landlord, listingLocation } = body;

    if (!listingId || !tenantId || !questions.length || !landlord || !listingLocation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (tokenUser.id !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID does not match authenticated user' },
        { status: 403 }
      );
    }

    const validationResults = questions.map((q) => validateQuestion(q));
    const invalidQuestions = validationResults.filter((r) => !r.valid);

    if (invalidQuestions.length > 0) {
      return NextResponse.json(
        { error: 'Invalid questions', details: invalidQuestions },
        { status: 400 }
      );
    }

    const rateLimitResult = checkRateLimit(tenantId, listingId, questionQueue);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error, retryAfterMs: rateLimitResult.retryAfterMs },
        { status: 429 }
      );
    }

    const routingDecision = routeCall(landlord, listingLocation);

    const faqItems = questions.map((q) =>
      createFAQItemWithId(q, '', tenantId, routingDecision.language, 'pending')
    );

    await updateApartmentFAQ(listingId, faqItems);

    const queueItem: QuestionQueueItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      listingId,
      tenantId,
      questions,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    questionQueue.push(queueItem);

    createNotification(
      tenantId,
      'question-submitted',
      'Questions Submitted',
      `Your questions about the apartment have been submitted. We'll call the landlord and get back to you.`,
      listingId
    );

    return NextResponse.json({
      success: true,
      routingDecision,
      faqItems,
      queueItemId: queueItem.id,
      message: 'Questions submitted successfully. We will call the landlord and update you with answers.',
    });

  } catch (error) {
    console.error('Error in ask-landlord:', error);
    return NextResponse.json(
      { error: 'Failed to process questions' },
      { status: 500 }
    );
  }
}
