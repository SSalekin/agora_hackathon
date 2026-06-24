import { NextRequest, NextResponse } from 'next/server';
import { runIndexer } from '@/lib/event-indexer';
import { isEscrowPersistenceEnabled } from '@/lib/db/escrow-collection';

export async function POST(_request: NextRequest) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ error: 'Escrow persistence is not enabled' }, { status: 503 });
  }
  try {
    const result = await runIndexer();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ enabled: false });
  }
  return NextResponse.json({ enabled: true, message: 'POST to trigger an indexer run' });
}
