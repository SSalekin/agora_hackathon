import { NextRequest, NextResponse } from 'next/server';
import { getApartmentCatalog } from '@/lib/apartment-catalog';
import { searchApartmentListings } from '@/lib/listings';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim();
  const wantsCatalog = request.nextUrl.searchParams.get('catalog') === 'true';
  if (!query && !wantsCatalog) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  try {
    const catalog = await getApartmentCatalog();
    if (wantsCatalog) {
      return NextResponse.json({
        listings: catalog.listings,
        total: catalog.listings.length,
        source: catalog.source,
      });
    }

    return NextResponse.json({
      ...searchApartmentListings(query!, catalog.listings),
      source: catalog.source,
    });
  } catch (error) {
    console.error('Could not load apartment listings:', error);
    return NextResponse.json(
      { error: 'Apartment listings are temporarily unavailable' },
      { status: 503 },
    );
  }
}
