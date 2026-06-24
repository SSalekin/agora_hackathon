import { NextRequest, NextResponse } from 'next/server';
import { getEscrowUser, upsertEscrowUser } from '@/lib/db/escrow-users';
import { isEscrowPersistenceEnabled } from '@/lib/db/escrow-collection';

type RouteParams = { params: Promise<{ wallet: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ error: 'Escrow persistence is not enabled' }, { status: 503 });
  }
  const { wallet } = await params;
  const user = await getEscrowUser(wallet);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isEscrowPersistenceEnabled()) {
    return NextResponse.json({ error: 'Escrow persistence is not enabled' }, { status: 503 });
  }
  const { wallet } = await params;
  const body = await request.json();
  if (!body.displayName || !body.role) {
    return NextResponse.json({ error: 'displayName and role are required' }, { status: 400 });
  }
  if (!['tenant', 'landlord', 'moderator'].includes(body.role)) {
    return NextResponse.json({ error: 'role must be tenant, landlord, or moderator' }, { status: 400 });
  }
  const user = await upsertEscrowUser(wallet, {
    displayName: body.displayName,
    role: body.role,
  });
  return NextResponse.json(user);
}
