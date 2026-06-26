'use client';

import { ShieldCheck, ShieldAlert, Shield, Trophy, AlertTriangle } from 'lucide-react';
import type { LandlordProfileData } from '@/hooks/use-landlord-profile';

const LAMPORTS_PER_SOL = 1_000_000_000;

type Props = {
  profile: LandlordProfileData;
  totalStakedSol: number;
  activeStakeSol: number;
  hasMinimumStake: boolean;
  showActions?: boolean;
};

export function LandlordReputationPanel({ profile, totalStakedSol, activeStakeSol, hasMinimumStake }: Props) {
  if (!profile.exists) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background/60 px-5 py-8 text-center">
        <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No on-chain reputation profile found for this landlord.</p>
      </div>
    );
  }

  const trustLevel = !hasMinimumStake
    ? 'low'
    : profile.disputesLost > 2
      ? 'watch'
      : 'verified';

  const trustConfig = {
    low: { icon: Shield, label: 'Unverified', color: 'text-muted-foreground bg-muted' },
    watch: { icon: ShieldAlert, label: 'Watch', color: 'text-warning bg-warning/10' },
    verified: { icon: ShieldCheck, label: 'Verified', color: 'text-primary bg-primary/10' },
  };

  const trust = trustConfig[trustLevel];
  const TrustIcon = trust.icon;

  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Landlord Reputation</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${trust.color}`}>
          <TrustIcon className="h-3 w-3" />
          {trust.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Staked</p>
          <p className="mt-1 text-base font-bold text-foreground">{activeStakeSol.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">SOL</p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-1 text-base font-bold text-foreground">{totalStakedSol.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">SOL</p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rentals</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-foreground">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            {profile.completedRentals}
          </p>
          <p className="text-[10px] text-muted-foreground">done</p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Disputes</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-foreground">
            {profile.disputesLost > 0 && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
            {profile.disputesLost}
          </p>
          <p className="text-[10px] text-muted-foreground">lost</p>
        </div>
      </div>

      {profile.disputesLost > 0 && (
        <p className="mt-3 text-xs text-warning">
          This landlord has lost {profile.disputesLost} dispute{profile.disputesLost === 1 ? '' : 's'}.
        </p>
      )}
    </div>
  );
}
