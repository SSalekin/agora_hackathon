'use client';

import { useAuth } from '@/lib/auth-context';
import { Building2, DollarSign, Home, Users, TrendingUp, Clock, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

const MOCK_STAKE = {
  activeStaked: 0.004,
  totalStaked: 0.005,
  completedRentals: 18,
  disputesLost: 1,
  reputationScore: 4.8,
  minimumRequired: 0.0001,
};

const ALL_LANDLORD_STAKES = [
  { name: 'Alice', activeStaked: 0.004, totalStaked: 0.005, completedRentals: 18, disputesLost: 1, reputationScore: 4.8 },
  { name: 'Bob', activeStaked: 0.008, totalStaked: 0.01, completedRentals: 24, disputesLost: 0, reputationScore: 5.0 },
  { name: 'Carol', activeStaked: 0.002, totalStaked: 0.003, completedRentals: 10, disputesLost: 2, reputationScore: 4.2 },
  { name: 'Dave', activeStaked: 0.0015, totalStaked: 0.002, completedRentals: 6, disputesLost: 0, reputationScore: 4.9 },
  { name: 'Eve', activeStaked: 0.015, totalStaked: 0.02, completedRentals: 32, disputesLost: 3, reputationScore: 4.5 },
  { name: 'Frank', activeStaked: 0.0005, totalStaked: 0.001, completedRentals: 3, disputesLost: 0, reputationScore: 4.7 },
  { name: 'Grace', activeStaked: 0.04, totalStaked: 0.05, completedRentals: 45, disputesLost: 5, reputationScore: 4.3 },
  { name: 'Henry', activeStaked: 0.0003, totalStaked: 0.0006, completedRentals: 2, disputesLost: 0, reputationScore: 4.6 },
  { name: 'Irene', activeStaked: 0.025, totalStaked: 0.03, completedRentals: 52, disputesLost: 2, reputationScore: 4.9 },
  { name: 'Jack', activeStaked: 0.0005, totalStaked: 0.0008, completedRentals: 4, disputesLost: 1, reputationScore: 4.1 },
];

const DUMMY_LISTINGS = [
  {
    id: '1',
    title: 'Modern Studio near Greenwich',
    address: '12 Vo Nguyen Giap, Da Nang',
    price: '4,500,000',
    status: 'active',
    views: 128,
    inquiries: 12,
  },
  {
    id: '2',
    title: '2BR Apartment with Ocean View',
    address: '45 Bach Dang, Da Nang',
    price: '8,200,000',
    status: 'active',
    views: 256,
    inquiries: 24,
  },
  {
    id: '3',
    title: 'Cozy 1BR in Han Market Area',
    address: '8 Nguyen Thi Minh Khai, Da Nang',
    price: '3,800,000',
    status: 'rented',
    views: 89,
    inquiries: 8,
  },
  {
    id: '4',
    title: '3BR Family Apartment',
    address: '23 Ngu Hanh Son, Da Nang',
    price: '12,000,000',
    status: 'active',
    views: 312,
    inquiries: 31,
  },
  {
    id: '5',
    title: 'Sunlit Studio near FPT City',
    address: '12 Nam Ky Khoi Nghia, Hoa Hai, Da Nang',
    price: '4,500,000',
    status: 'active',
    views: 198,
    inquiries: 19,
  },
  {
    id: '6',
    title: 'Quiet Marble Mountain Flat',
    address: '61 Le Van Hien, Ngu Hanh Son, Da Nang',
    price: '4,800,000',
    status: 'rented',
    views: 145,
    inquiries: 14,
  },
  {
    id: '7',
    title: 'Son Tra Peninsula Penthouse',
    address: '09 Hoang Sa, Tho Quang, Da Nang',
    price: '18,500,000',
    status: 'active',
    views: 478,
    inquiries: 42,
  },
  {
    id: '8',
    title: 'Hoa Khanh Budget Room',
    address: '42 Au Co, Hoa Khanh Bac, Da Nang',
    price: '2,400,000',
    status: 'active',
    views: 67,
    inquiries: 5,
  },
];

const DUMMY_AGREEMENTS = [
  {
    id: 'agr-001',
    tenant: 'Nguyen Van Minh',
    listing: 'Modern Studio near Greenwich',
    amount: '4,500,000',
    status: 'awaiting_approval',
    date: '2026-06-20',
  },
  {
    id: 'agr-002',
    tenant: 'Tran Thi Lan',
    listing: '2BR Apartment with Ocean View',
    amount: '8,200,000',
    status: 'funded',
    date: '2026-06-18',
  },
  {
    id: 'agr-003',
    tenant: 'Le Hong Phong',
    listing: 'Cozy 1BR in Han Market Area',
    amount: '3,800,000',
    status: 'completed',
    date: '2026-06-15',
  },
  {
    id: 'agr-004',
    tenant: 'Pham Minh Duc',
    listing: '3BR Family Apartment',
    amount: '12,000,000',
    status: 'disputed',
    date: '2026-06-10',
  },
  {
    id: 'agr-005',
    tenant: 'Vo Thi Mai',
    listing: 'Sunlit Studio near FPT City',
    amount: '4,500,000',
    status: 'released',
    date: '2026-06-08',
  },
  {
    id: 'agr-006',
    tenant: 'Hoang Anh Tuan',
    listing: 'Son Tra Peninsula Penthouse',
    amount: '18,500,000',
    status: 'awaiting_approval',
    date: '2026-06-22',
  },
  {
    id: 'agr-007',
    tenant: 'Bui Thanh Ha',
    listing: 'Hoa Khanh Budget Room',
    amount: '2,400,000',
    status: 'funded',
    date: '2026-06-19',
  },
  {
    id: 'agr-008',
    tenant: 'Dang Phuong Linh',
    listing: 'Quiet Marble Mountain Flat',
    amount: '4,800,000',
    status: 'refunded',
    date: '2026-06-05',
  },
];

const STATUS_CONFIG = {
  awaiting_approval: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800', icon: Clock },
  funded: { label: 'Funded', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  disputed: { label: 'Disputed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  released: { label: 'Released', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rented: { label: 'Rented', color: 'bg-blue-100 text-blue-800', icon: Home },
};

export default function LandlordDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Landlord Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name}. Manage your property listings and agreements.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Listings</p>
              <p className="text-2xl font-bold text-foreground">{DUMMY_LISTINGS.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600 font-medium">6 active</span> · 2 rented
          </p>
        </div>

        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-2xl font-bold text-foreground">38.2M</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-green-600 font-medium">+12%</span> vs last month
          </p>
        </div>

        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Agreements</p>
              <p className="text-2xl font-bold text-foreground">4</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-amber-600 font-medium">2 pending</span> approval
          </p>
        </div>

        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reputation Score</p>
              <p className="text-2xl font-bold text-foreground">{MOCK_STAKE.reputationScore}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on {MOCK_STAKE.completedRentals} completed rentals
          </p>
        </div>
      </div>

      {/* Stake & Reputation Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Stake Summary Card */}
        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Your Stake</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-800">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Staked</p>
              <p className="mt-1 text-lg font-bold text-foreground">{MOCK_STAKE.activeStaked}</p>
              <p className="text-[11px] text-muted-foreground">SOL</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="mt-1 text-lg font-bold text-foreground">{MOCK_STAKE.totalStaked}</p>
              <p className="text-[11px] text-muted-foreground">SOL</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Disputes</p>
              <p className="mt-1 text-lg font-bold text-foreground">{MOCK_STAKE.disputesLost}</p>
              <p className="text-[11px] text-muted-foreground">lost</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Minimum stake: {MOCK_STAKE.minimumRequired} SOL (verified ✓)
          </p>
        </div>

        {/* Reputation Panel */}
        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Landlord Reputation</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-800">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Staked</p>
              <p className="mt-1 text-base font-bold text-foreground">{MOCK_STAKE.activeStaked}</p>
              <p className="text-[10px] text-muted-foreground">SOL</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="mt-1 text-base font-bold text-foreground">{MOCK_STAKE.totalStaked}</p>
              <p className="text-[10px] text-muted-foreground">SOL</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rentals</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-foreground">
                {MOCK_STAKE.completedRentals}
              </p>
              <p className="text-[10px] text-muted-foreground">done</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Disputes</p>
              <p className="mt-1 text-base font-bold text-foreground">{MOCK_STAKE.disputesLost}</p>
              <p className="text-[10px] text-muted-foreground">lost</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Reputation: {MOCK_STAKE.reputationScore}/5.0 based on {MOCK_STAKE.completedRentals} rentals
          </p>
        </div>
      </div>

      {/* All Landlord Stakes Overview */}
      <div className="surface-panel rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Landlord Stakes Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            On-chain stake profiles for all registered landlords. Minimum required: 0.0001 SOL.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Landlord</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Active Stake</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Total Staked</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Rentals</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Disputes</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Reputation</th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ALL_LANDLORD_STAKES.map((landlord) => (
                <tr key={landlord.name} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{landlord.name}</td>
                  <td className="px-5 py-3 text-right text-foreground">{landlord.activeStaked} SOL</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{landlord.totalStaked} SOL</td>
                  <td className="px-5 py-3 text-right text-foreground">{landlord.completedRentals}</td>
                  <td className="px-5 py-3 text-right text-foreground">{landlord.disputesLost}</td>
                  <td className="px-5 py-3 text-right text-foreground">{landlord.reputationScore}/5.0</td>
                  <td className="px-5 py-3 text-center">
                    {landlord.activeStaked >= 0.0001 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Below Min
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Listings */}
      <div className="surface-panel rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">My Listings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your apartment listings and track performance.
          </p>
        </div>
        <div className="divide-y divide-border">
          {DUMMY_LISTINGS.map((listing) => (
            <div key={listing.id} className="p-5 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{listing.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[listing.status as keyof typeof STATUS_CONFIG].color}`}>
                      {STATUS_CONFIG[listing.status as keyof typeof STATUS_CONFIG].label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{listing.address}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{listing.views} views</span>
                    <span>{listing.inquiries} inquiries</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-primary">{listing.price}</p>
                  <p className="text-xs text-muted-foreground">VND/month</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agreement Requests */}
      <div className="surface-panel rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Agreements</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your tenant agreement requests and their status.
          </p>
        </div>
        <div className="divide-y divide-border">
          {DUMMY_AGREEMENTS.map((agreement) => {
            const statusConfig = STATUS_CONFIG[agreement.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig.icon;
            return (
              <div key={agreement.id} className="p-5 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{agreement.listing}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tenant: {agreement.tenant}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(agreement.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{agreement.amount}</p>
                    <p className="text-xs text-muted-foreground">VND deposit</p>
                  </div>
                </div>
                {agreement.status === 'awaiting_approval' && (
                  <div className="flex gap-2 mt-4">
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                      Approve
                    </button>
                    <button className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
                      Reject
                    </button>
                  </div>
                )}
                {agreement.status === 'disputed' && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Dispute Pending Resolution</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      Awaiting moderator decision. You will be notified once resolved.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
