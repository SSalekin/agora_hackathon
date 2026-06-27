import { NextRequest, NextResponse } from 'next/server';
import { callSessionManager } from '@/lib/call-session-manager';
import { createLogger } from '@/lib/logger';

const log = createLogger({ module: 'landlord-call-webhook' });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const speechResult = formData.get('SpeechResult') as string;

    log.info('Twilio webhook received', { callSid, callStatus });

    const session = callSessionManager.getSessionByCallSid(callSid);

    if (!session) {
      log.warn('No session found for call SID', { callSid });
      return new NextResponse(null, { status: 200 });
    }

    switch (callStatus) {
      case 'initiated':
      case 'ringing':
        callSessionManager.updateSessionStatus(session.id, 'active');
        break;

      case 'answered':
        callSessionManager.updateSessionStatus(session.id, 'active');
        break;

      case 'completed':
        if (speechResult && session.currentQuestionIndex !== undefined) {
          const skipped = isSkipResponse(speechResult);
          callSessionManager.recordAnswer(session.id, session.currentQuestionIndex, speechResult, skipped);
        }

        callSessionManager.updateSessionStatus(session.id, 'completed', undefined);
        break;

      case 'busy':
      case 'no-answer':
      case 'canceled':
      case 'failed':
        callSessionManager.updateSessionStatus(session.id, 'failed');
        break;
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    log.error('Error processing Twilio webhook', error instanceof Error ? error : undefined);
    return new NextResponse(null, { status: 500 });
  }
}

function isSkipResponse(text: string): boolean {
  const skipPatterns = [
    /\b(skip|pass|next)\b/i,
    /\b(don'?t know|do not know|idk)\b/i,
    /\b(no comment|no answer)\b/i,
  ];
  return skipPatterns.some((pattern) => pattern.test(text));
}
