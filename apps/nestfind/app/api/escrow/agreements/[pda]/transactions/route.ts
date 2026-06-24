import { NextRequest, NextResponse } from 'next/server';
import { listTransactions, appendTransaction } from '@/lib/db/transactions';
import { isEscrowPersistenceEnabled } from '@/lib/db/escrow-collection';

type RouteParams = { params: Promise<{ pda: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ transactions: [], total: 0 });
  }
  const { pda } = await params;
  const transactions = await listTransactions(pda);
  return NextResponse.json({ transactions, total: transactions.length });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ error: 'Escrow persistence is not enabled' }, { status: 503 });
  }
  const { pda } = await params;
  const body = await request.json();
  if (!body.signature || !body.action) {
    return NextResponse.json({ error: 'signature and action are required' }, { status: 400 });
  }

  const record = await appendTransaction(pda, {
    signature: body.signature,
    action: body.action,
    status: body.status ?? 'confirmed',
    submittedAt: new Date().toISOString(),
    confirmedAt: body.status === 'confirmed' ? new Date().toISOString() : null,
    explorerUrl: body.explorerUrl ?? '',
  });
  return NextResponse.json(record, { status: 201 });
}
