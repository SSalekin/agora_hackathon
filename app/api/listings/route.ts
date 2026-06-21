import { NextRequest, NextResponse } from 'next/server';
import { searchApartmentListings } from '@/lib/listings';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim();
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }
  return NextResponse.json(searchApartmentListings(query));
}
