'use client';

import { useAuth } from '@/lib/auth-context';
import { Building2, DollarSign, Home, Users, TrendingUp, Clock, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

const MOCK_STAKE = {
  activeStaked: 2.5,
  totalStaked: 3.0,
  completedRentals: 15,
  disputesLost: 1,
  reputationScore: 4.8,
  minimumRequired: 0.5,
};

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
];

const STATUS_CONFIG = {
  awaiting_approval: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800', icon: Clock },
  funded: { label: 'Funded', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  disputed: { label: 'Disputed', color: 'bg-red-100 text-red-800', icon: AlertCircle },
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
            <span className="text-green-600 font-medium">3 active</span> · 1 rented
          </p>
        </div>

        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-2xl font-bold text-foreground">16.5M</p>
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
              <p className="text-2xl font-bold text-foreground">2</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-amber-600 font-medium">1 pending</span> approval
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
