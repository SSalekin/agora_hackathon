import { NextRequest, NextResponse } from 'next/server';
import { ExpiresIn } from 'agora-agents';
import { callSessionManager } from '@/lib/call-session-manager';
import { createLandlordCallAgent } from '@/lib/landlord-call-agent';
import { routeCall } from '@/lib/call-router';
import { initiateTelephonyCall } from '@/lib/telephony-client';
import { createLogger } from '@/lib/logger';
import { callMonitor } from '@/lib/call-monitor';

const log = createLogger({ module: 'initiate-landlord-call' });

// Start monitor if not already running
callMonitor.start();

interface InitiateCallRequest {
  questionQueueItemId: string;
  listingId: string;
  tenantId: string;
  questions: string[];
  landlord: { wallet?: string; phone?: string; isAppUser: boolean };
  listingLocation: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: InitiateCallRequest = await request.json();
    const { questionQueueItemId, listingId, tenantId, questions, landlord, listingLocation } = body;

    if (!questionQueueItemId || !listingId || !tenantId || !questions.length || !landlord) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const routingDecision = routeCall(landlord, listingLocation);

    const session = callSessionManager.createSession(
      { id: questionQueueItemId, listingId, tenantId, questions, status: 'pending', createdAt: new Date().toISOString(), attempts: 0 },
      landlord.wallet,
      landlord.phone,
      routingDecision.callMethod,
      routingDecision.language
    );

    log.info('Initiating landlord call', {
      sessionId: session.id,
      channelId: session.channelId,
      callMethod: routingDecision.callMethod,
      language: routingDecision.language,
      questionCount: questions.length,
    });

    if (routingDecision.callMethod === 'telephony') {
      const telephonyResult = await initiateTelephonyCall({
        to: landlord.phone!,
        listingId,
        tenantId,
        questions,
        language: routingDecision.language,
        questionQueueItemId,
      });

      if (!telephonyResult.success) {
        callSessionManager.updateSessionStatus(session.id, 'failed');
        return NextResponse.json(
          { error: telephonyResult.error || 'Failed to initiate telephony call' },
          { status: 500 }
        );
      }

      if (telephonyResult.callSid) {
        callSessionManager.registerCallSid(session.id, telephonyResult.callSid);
      }

      callSessionManager.updateSessionStatus(session.id, 'active');

      log.info('Telephony call initiated', {
        sessionId: session.id,
        callSid: telephonyResult.callSid,
      });

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        callMethod: 'telephony',
        callSid: telephonyResult.callSid,
      });
    }

    // Agora call path for app-user landlords
    const agent = createLandlordCallAgent(routingDecision.language, questions);

    try {
      const sessionResult = agent.createSession({
        channel: session.channelId!,
        agentUid: String(session.agentUid),
        remoteUids: [],
        idleTimeout: 300,
        expiresIn: ExpiresIn.hours(1),
        debug: false,
      });

      const agentId = await sessionResult.start();
      callSessionManager.updateSessionStatus(session.id, 'active');

      log.info('Landlord call session started', {
        sessionId: session.id,
        agentId,
      });

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        channelId: session.channelId,
        agentId,
        language: routingDecision.language,
        languageName: routingDecision.languageName,
      });
    } catch (error) {
      callSessionManager.updateSessionStatus(session.id, 'failed');
      log.error('Failed to start Agora session', error as Error, { sessionId: session.id });
      throw error;
    }
  } catch (error) {
    log.error('Error initiating landlord call', error as Error);
    return NextResponse.json(
      { error: 'Failed to initiate call', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
