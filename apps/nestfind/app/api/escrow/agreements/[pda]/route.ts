import { NextRequest, NextResponse } from 'next/server';
import { getAgreement, updateAgreementState } from '@/lib/db/agreements';
import { isEscrowPersistenceEnabled } from '@/lib/db/escrow-collection';
import type { AgreementUiState } from '@/lib/escrow';

type RouteParams = { params: Promise<{ pda: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ error: 'Escrow persistence is not enabled' }, { status: 503 });
  }
  const { pda } = await params;
  const agreement = await getAgreement(pda);
  if (!agreement) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }
  return NextResponse.json(agreement);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ error: 'Escrow persistence is not enabled' }, { status: 503 });
  }
  const { pda } = await params;
  const body = await request.json();
  if (!body.state) {
    return NextResponse.json({ error: 'state is required' }, { status: 400 });
  }
  const validStates: AgreementUiState[] = [
    'awaitingLandlordApproval', 'awaitingFunding', 'funded',
    'disputed', 'released', 'refunded', 'cancelled', 'unknown',
  ];
  if (!validStates.includes(body.state)) {
    return NextResponse.json({ error: `Invalid state. Must be one of: ${validStates.join(', ')}` }, { status: 400 });
  }

  await updateAgreementState(pda, body.state, body.lastTxSignature);
  return NextResponse.json({ ok: true });
}
