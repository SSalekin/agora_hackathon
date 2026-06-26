import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth';
import { findUserByEmail, seedDemoUsers } from '@/lib/user-store';
import { MOCK_LANDLORD_PROFILES, getAllMockLandlordProfiles } from '@/lib/mock-landlord-profiles';
import { getApartmentCatalog } from '@/lib/apartment-catalog';
import { listAgreements } from '@/lib/db/agreements';
import { isEscrowPersistenceEnabled } from '@/lib/db/escrow-collection';
import type { ApartmentListing } from '@/types/listing';
import type { PersistedAgreement } from '@/types/escrow-persistence';

const DEMO_AGREEMENTS: PersistedAgreement[] = [
  {
    type: 'escrowAgreement',
    pda: 'agr-001',
    listingId: 'fpt-garden-studio',
    listingHash: '',
    tenantWallet: 'TENANT_DEMO_1',
    landlordWallet: '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e',
    depositSol: 0.5,
    depositLamports: 500_000_000,
    inspectionDeadline: '2026-07-15T00:00:00.000Z',
    createdAt: '2026-06-20T08:00:00.000Z',
    fundedAt: null,
    state: 'awaitingLandlordApproval',
    lastIndexedAt: '2026-06-20T08:00:00.000Z',
    lastTxSignature: null,
  },
  {
    type: 'escrowAgreement',
    pda: 'agr-002',
    listingId: 'greenwich-loft',
    listingHash: '',
    tenantWallet: 'TENANT_DEMO_2',
    landlordWallet: '7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq',
    depositSol: 0.5,
    depositLamports: 500_000_000,
    inspectionDeadline: '2026-07-20T00:00:00.000Z',
    createdAt: '2026-06-18T10:30:00.000Z',
    fundedAt: '2026-06-19T14:00:00.000Z',
    state: 'funded',
    lastIndexedAt: '2026-06-19T14:00:00.000Z',
    lastTxSignature: 'tx-demo-002',
  },
  {
    type: 'escrowAgreement',
    pda: 'agr-003',
    listingId: 'marble-mountain-flat',
    listingHash: '',
    tenantWallet: 'TENANT_DEMO_3',
    landlordWallet: '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e',
    depositSol: 0.5,
    depositLamports: 500_000_000,
    inspectionDeadline: '2026-06-25T00:00:00.000Z',
    createdAt: '2026-06-10T09:00:00.000Z',
    fundedAt: '2026-06-11T11:00:00.000Z',
    state: 'released',
    lastIndexedAt: '2026-06-25T16:00:00.000Z',
    lastTxSignature: 'tx-demo-003',
  },
  {
    type: 'escrowAgreement',
    pda: 'agr-004',
    listingId: 'my-khe-one-bedroom',
    listingHash: '',
    tenantWallet: 'TENANT_DEMO_4',
    landlordWallet: '9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X',
    depositSol: 0.5,
    depositLamports: 500_000_000,
    inspectionDeadline: '2026-07-01T00:00:00.000Z',
    createdAt: '2026-06-15T07:00:00.000Z',
    fundedAt: '2026-06-16T08:00:00.000Z',
    state: 'disputed',
    lastIndexedAt: '2026-06-22T12:00:00.000Z',
    lastTxSignature: 'tx-demo-004',
  },
  {
    type: 'escrowAgreement',
    pda: 'agr-005',
    listingId: 'son-tra-penthouse',
    listingHash: '',
    tenantWallet: 'TENANT_DEMO_5',
    landlordWallet: 'F8kM3b2nP5xLr7KdQeV4gY1hT6wJm9CaB3nR5sE2fU8',
    depositSol: 1.0,
    depositLamports: 1_000_000_000,
    inspectionDeadline: '2026-07-10T00:00:00.000Z',
    createdAt: '2026-06-22T14:00:00.000Z',
    fundedAt: null,
    state: 'awaitingLandlordApproval',
    lastIndexedAt: '2026-06-22T14:00:00.000Z',
    lastTxSignature: null,
  },
  {
    type: 'escrowAgreement',
    pda: 'agr-006',
    listingId: 'fpt-garden-studio',
    listingHash: '',
    tenantWallet: 'TENANT_DEMO_6',
    landlordWallet: '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e',
    depositSol: 0.5,
    depositLamports: 500_000_000,
    inspectionDeadline: '2026-06-20T00:00:00.000Z',
    createdAt: '2026-06-05T12:00:00.000Z',
    fundedAt: '2026-06-06T10:00:00.000Z',
    state: 'refunded',
    lastIndexedAt: '2026-06-20T18:00:00.000Z',
    lastTxSignature: 'tx-demo-006',
  },
];

const AGREEMENT_STATE_LABELS: Record<string, string> = {
  awaitingLandlordApproval: 'Pending Approval',
  awaitingFunding: 'Awaiting Funding',
  funded: 'Funded',
  released: 'Released',
  disputed: 'Disputed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

function listingTitleMap(listings: ApartmentListing[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const l of listings) {
    map.set(l.id, l.title);
  }
  return map;
}

export async function GET() {
  try {
    seedDemoUsers();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tokenUser = getUserFromToken(token);
    if (!tokenUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const storedUser = await findUserByEmail(tokenUser.email);
    if (!storedUser || storedUser.role !== 'landlord') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const profile = Object.values(MOCK_LANDLORD_PROFILES).find(
      (p) => p.email === storedUser.email,
    );

    if (!profile) {
      return NextResponse.json({ error: 'Landlord profile not found' }, { status: 404 });
    }

    const wallet = profile.landlord;
    const { listings: allListings } = await getApartmentCatalog();
    const landlordListings = allListings.filter((l) => l.landlordWallet === wallet);

    let agreements: PersistedAgreement[];
    if (isEscrowPersistenceEnabled()) {
      try {
        agreements = await listAgreements({ wallet });
      } catch {
        agreements = DEMO_AGREEMENTS.filter((a) => a.landlordWallet === wallet);
      }
    } else {
      agreements = DEMO_AGREEMENTS.filter((a) => a.landlordWallet === wallet);
    }

    const titleMap = listingTitleMap(allListings);
    const agreementsWithMeta = agreements.map((a) => ({
      ...a,
      listingTitle: titleMap.get(a.listingId) ?? a.listingId,
      stateLabel: AGREEMENT_STATE_LABELS[a.state] ?? a.state,
    }));

    const allProfiles = getAllMockLandlordProfiles();
    const allLandlordStakes = allProfiles.map((p) => ({
      name: p.name,
      email: p.email,
      wallet: p.landlord,
      activeStaked: p.activeStakeLamports / 1_000_000_000,
      totalStaked: p.totalStakedLamports / 1_000_000_000,
      completedRentals: p.completedRentals,
      disputesLost: p.disputesLost,
      reputationScore: p.reputationScore,
    }));

    return NextResponse.json({
      profile: {
        name: profile.name,
        email: profile.email,
        wallet: profile.landlord,
        activeStaked: profile.activeStakeLamports / 1_000_000_000,
        totalStaked: profile.totalStakedLamports / 1_000_000_000,
        completedRentals: profile.completedRentals,
        disputesLost: profile.disputesLost,
        reputationScore: profile.reputationScore,
        listingCount: profile.listingCount,
      },
      allLandlordStakes,
      listings: landlordListings.map((l) => ({
        id: l.id,
        title: l.title,
        address: l.address,
        price: l.monthlyRentVnd.toLocaleString(),
        status: 'active' as const,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        areaSqm: l.areaSqm,
      })),
      agreements: agreementsWithMeta.map((a) => ({
        id: a.pda,
        listing: a.listingTitle,
        amount: a.depositSol.toString(),
        status: a.state,
        statusLabel: a.stateLabel,
        date: a.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
