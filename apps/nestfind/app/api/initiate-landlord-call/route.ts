import { NextRequest, NextResponse } from 'next/server';
import { ExpiresIn } from 'agora-agents';
import { callSessionManager } from '@/lib/call-session-manager';
import { createLandlordCallAgent } from '@/lib/landlord-call-agent';
import { routeCall } from '@/lib/call-router';
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
    if (routingDecision.callMethod !== 'agora') {
      return NextResponse.json(
        {
          error: 'Only app-user landlords supported in Phase 2',
          code: 'UNSUPPORTED_CALL_METHOD',
        },
        { status: 400 }
      );
    }

    const session = callSessionManager.createSession(
      { id: questionQueueItemId, listingId, tenantId, questions, status: 'pending', createdAt: new Date().toISOString(), attempts: 0 },
      landlord.wallet,
      undefined,
      routingDecision.callMethod,
      routingDecision.language
    );

    const agent = createLandlordCallAgent(routingDecision.language, questions);

    log.info('Initiating landlord call', {
      sessionId: session.id,
      channelId: session.channelId,
      language: routingDecision.language,
      questionCount: questions.length,
    });

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
