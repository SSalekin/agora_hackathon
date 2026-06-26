'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Building2, DollarSign, Users, TrendingUp, Clock, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

interface LandlordProfile {
  name: string;
  email: string;
  wallet: string;
  activeStaked: number;
  totalStaked: number;
  completedRentals: number;
  disputesLost: number;
  reputationScore: number;
  listingCount: number;
}

interface LandlordStake {
  name: string;
  activeStaked: number;
  totalStaked: number;
  completedRentals: number;
  disputesLost: number;
  reputationScore: number;
}

interface LandlordListing {
  id: string;
  title: string;
  address: string;
  price: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
}

interface LandlordAgreement {
  id: string;
  listing: string;
  amount: string;
  status: string;
  statusLabel: string;
  date: string;
}

interface DashboardData {
  profile: LandlordProfile;
  allLandlordStakes: LandlordStake[];
  listings: LandlordListing[];
  agreements: LandlordAgreement[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  awaitingLandlordApproval: { label: 'Pending Approval', color: 'bg-warning/10 text-warning', icon: Clock },
  awaitingFunding: { label: 'Awaiting Funding', color: 'bg-warning/10 text-warning', icon: Clock },
  funded: { label: 'Funded', color: 'bg-primary/10 text-primary', icon: CheckCircle },
  released: { label: 'Released', color: 'bg-success/10 text-success', icon: CheckCircle },
  disputed: { label: 'Disputed', color: 'bg-destructive/10 text-destructive', icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'bg-warning/10 text-warning', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground', icon: AlertCircle },
  active: { label: 'Active', color: 'bg-success/10 text-success', icon: CheckCircle },
};

const MINIMUM_STAKE = 0.0001;

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/landlord/dashboard');
        if (!res.ok) {
          throw new Error('Failed to load dashboard');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <p className="mt-4 text-muted-foreground">{error ?? 'Failed to load dashboard'}</p>
      </div>
    );
  }

  const { profile, allLandlordStakes, listings, agreements } = data;
  const activeListings = listings.filter((l) => l.status === 'active').length;
  const rentedListings = listings.filter((l) => l.status === 'rented').length;
  const pendingAgreements = agreements.filter((a) => a.status === 'awaitingLandlordApproval').length;

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Landlord Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name ?? profile.name}. Manage your property listings and agreements.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Listings</p>
              <p className="text-2xl font-bold text-foreground">{listings.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-success font-medium">{activeListings} active</span> · {rentedListings} rented
          </p>
        </div>

        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Staked</p>
              <p className="text-2xl font-bold text-foreground">{profile.totalStaked}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            SOL deposited as collateral
          </p>
        </div>

        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Agreements</p>
              <p className="text-2xl font-bold text-foreground">{agreements.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="text-warning font-medium">{pendingAgreements} pending</span> approval
          </p>
        </div>

        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reputation Score</p>
              <p className="text-2xl font-bold text-foreground">{profile.reputationScore}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Based on {profile.completedRentals} completed rentals
          </p>
        </div>
      </div>

      {/* Stake & Reputation Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Stake Summary Card */}
        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Your Stake</p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${profile.activeStaked >= MINIMUM_STAKE ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
              <ShieldCheck className="h-3 w-3" /> {profile.activeStaked >= MINIMUM_STAKE ? 'Verified' : 'Below Min'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Staked</p>
              <p className="mt-1 text-lg font-bold text-foreground">{profile.activeStaked}</p>
              <p className="text-[11px] text-muted-foreground">SOL</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="mt-1 text-lg font-bold text-foreground">{profile.totalStaked}</p>
              <p className="text-[11px] text-muted-foreground">SOL</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Disputes</p>
              <p className="mt-1 text-lg font-bold text-foreground">{profile.disputesLost}</p>
              <p className="text-[11px] text-muted-foreground">lost</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Minimum stake: {MINIMUM_STAKE} SOL
          </p>
        </div>

        {/* Reputation Panel */}
        <div className="surface-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Landlord Reputation</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Staked</p>
              <p className="mt-1 text-base font-bold text-foreground">{profile.activeStaked}</p>
              <p className="text-[10px] text-muted-foreground">SOL</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="mt-1 text-base font-bold text-foreground">{profile.totalStaked}</p>
              <p className="text-[10px] text-muted-foreground">SOL</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rentals</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-foreground">
                {profile.completedRentals}
              </p>
              <p className="text-[10px] text-muted-foreground">done</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Disputes</p>
              <p className="mt-1 text-base font-bold text-foreground">{profile.disputesLost}</p>
              <p className="text-[10px] text-muted-foreground">lost</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Reputation: {profile.reputationScore}/5.0 based on {profile.completedRentals} rentals
          </p>
        </div>
      </div>

      {/* All Landlord Stakes Overview */}
      <div className="surface-panel rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Landlord Stakes Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            On-chain stake profiles for all registered landlords. Minimum required: {MINIMUM_STAKE} SOL.
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
              {allLandlordStakes.map((landlord) => (
                <tr key={landlord.name} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{landlord.name}</td>
                  <td className="px-5 py-3 text-right text-foreground">{landlord.activeStaked} SOL</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{landlord.totalStaked} SOL</td>
                  <td className="px-5 py-3 text-right text-foreground">{landlord.completedRentals}</td>
                  <td className="px-5 py-3 text-right text-foreground">{landlord.disputesLost}</td>
                  <td className="px-5 py-3 text-right text-foreground">{landlord.reputationScore}/5.0</td>
                  <td className="px-5 py-3 text-center">
                    {landlord.activeStaked >= MINIMUM_STAKE ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
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
          {listings.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">No listings found.</p>
          )}
          {listings.map((listing) => (
            <div key={listing.id} className="p-5 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{listing.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[listing.status]?.color ?? 'bg-muted text-muted-foreground'}`}>
                      {STATUS_CONFIG[listing.status]?.label ?? listing.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{listing.address}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{listing.bedrooms} bed · {listing.bathrooms} bath</span>
                    <span>{listing.areaSqm} m²</span>
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
          {agreements.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">No agreements found.</p>
          )}
          {agreements.map((agreement) => {
            const statusConfig = STATUS_CONFIG[agreement.status] ?? { label: agreement.status, color: 'bg-muted text-muted-foreground', icon: Clock };
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(agreement.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{agreement.amount} SOL</p>
                    <p className="text-xs text-muted-foreground">deposit</p>
                  </div>
                </div>
                {agreement.status === 'awaitingLandlordApproval' && (
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
                  <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Dispute Pending Resolution</span>
                    </div>
                    <p className="text-xs text-destructive mt-1">
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
