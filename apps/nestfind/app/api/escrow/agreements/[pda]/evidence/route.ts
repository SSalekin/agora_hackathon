import { NextRequest, NextResponse } from 'next/server';
import { getEvidence, upsertEvidence, verifyEvidenceHash } from '@/lib/db/dispute-evidence';
import { isEscrowPersistenceEnabled } from '@/lib/db/escrow-collection';

type RouteParams = { params: Promise<{ pda: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ error: 'Escrow persistence is not enabled' }, { status: 503 });
  }
  const { pda } = await params;
  const verify = request.nextUrl.searchParams.get('verify');
  const onChainHash = request.nextUrl.searchParams.get('hash');

  if (verify && onChainHash) {
    const result = await verifyEvidenceHash(pda, onChainHash);
    return NextResponse.json(result);
  }

  const evidence = await getEvidence(pda);
  if (!evidence) {
    return NextResponse.json({ error: 'No evidence found' }, { status: 404 });
  }
  return NextResponse.json(evidence);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ error: 'Escrow persistence is not enabled' }, { status: 503 });
  }
  const { pda } = await params;
  const body = await request.json();
  if (!body.evidenceText || !body.submittedBy) {
    return NextResponse.json({ error: 'evidenceText and submittedBy are required' }, { status: 400 });
  }

  const evidenceBuf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(body.evidenceText),
  );
  const evidenceHash = Array.from(new Uint8Array(evidenceBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const doc = await upsertEvidence(pda, {
    reasonCode: body.reasonCode ?? 1,
    description: body.description ?? '',
    evidenceText: body.evidenceText,
    evidenceHash,
    submittedBy: body.submittedBy,
  });
  return NextResponse.json(doc, { status: 201 });
}
