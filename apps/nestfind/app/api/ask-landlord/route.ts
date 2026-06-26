import { NextRequest, NextResponse } from 'next/server';
import { validateQuestion, createFAQItem } from '@/lib/question-collector';
import { routeCall, type LandlordInfo } from '@/lib/call-router';
import { createFAQItemWithId } from '@/lib/faq-updater';
import { createNotification } from '@/lib/notification-service';

interface AskLandlordRequest {
  listingId: string;
  tenantId: string;
  questions: string[];
  landlord: LandlordInfo;
  listingLocation: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AskLandlordRequest = await request.json();
    const { listingId, tenantId, questions, landlord, listingLocation } = body;
    
    // Validate input
    if (!listingId || !tenantId || !questions.length || !landlord || !listingLocation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate all questions
    const validationResults = questions.map(q => validateQuestion(q));
    const invalidQuestions = validationResults.filter(r => !r.valid);
    
    if (invalidQuestions.length > 0) {
      return NextResponse.json(
        { error: 'Invalid questions', details: invalidQuestions },
        { status: 400 }
      );
    }
    
    // Route the call
    const routingDecision = routeCall(landlord, listingLocation);
    
    // Create FAQ items
    const faqItems = questions.map(q => 
      createFAQItemWithId(q, '', tenantId, routingDecision.language, 'pending')
    );
    
    // Create notification for tenant
    createNotification(
      tenantId,
      'question-answered',
      'Questions Submitted',
      `Your questions about the apartment have been submitted. We'll call the landlord and get back to you.`,
      listingId
    );
    
    return NextResponse.json({
      success: true,
      routingDecision,
      faqItems,
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