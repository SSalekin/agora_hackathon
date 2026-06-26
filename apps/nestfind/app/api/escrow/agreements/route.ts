import { NextRequest, NextResponse } from 'next/server';
import { listAgreements, upsertAgreement } from '@/lib/db/agreements';
import { isEscrowPersistenceEnabled } from '@/lib/db/escrow-collection';
import type { AgreementUiState } from '@/lib/escrow';

const VALID_AGREEMENT_STATES: readonly AgreementUiState[] = [
  'awaitingLandlordApproval',
  'awaitingFunding',
  'funded',
  'disputed',
  'released',
  'refunded',
  'cancelled',
  'unknown',
] as const;

export async function GET(request: NextRequest) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ agreements: [], total: 0, source: 'none' });
  }
  const wallet = request.nextUrl.searchParams.get('wallet')?.trim() ?? undefined;
  const state = request.nextUrl.searchParams.get('state')?.trim() as string | undefined;

  if (state && !VALID_AGREEMENT_STATES.includes(state as AgreementUiState)) {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }
  if (wallet && !/^[a-zA-Z0-9]{32,44}$/.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const agreements = await listAgreements({
    wallet,
    state: state as AgreementUiState | undefined,
  });
  return NextResponse.json({ agreements, total: agreements.length, source: 'couchbase' });
}

export async function POST(request: NextRequest) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ error: 'Escrow persistence is not enabled' }, { status: 503 });
  }
  const body = await request.json();
  const required = ['pda', 'listingId', 'listingHash', 'tenantWallet', 'landlordWallet', 'depositSol', 'depositLamports', 'inspectionDeadline'];
  const missing = required.filter((f) => body[f] === undefined || body[f] === null);
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
  }

  const doc = await upsertAgreement(body.pda, {
    listingId: body.listingId,
    listingHash: body.listingHash,
    tenantWallet: body.tenantWallet,
    landlordWallet: body.landlordWallet,
    depositSol: body.depositSol,
    depositLamports: body.depositLamports,
    inspectionDeadline: body.inspectionDeadline,
    createdAt: new Date().toISOString(),
    fundedAt: null,
    state: body.state ?? 'awaitingLandlordApproval',
    lastIndexedAt: new Date().toISOString(),
    lastTxSignature: body.lastTxSignature ?? null,
  });
  return NextResponse.json(doc, { status: 201 });
}
