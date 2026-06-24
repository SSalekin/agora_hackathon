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
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-5 py-8 text-center">
        <Shield className="mx-auto h-8 w-8 text-stone-400" />
        <p className="mt-2 text-sm text-stone-500">No on-chain reputation profile found for this landlord.</p>
      </div>
    );
  }

  const trustLevel = !hasMinimumStake
    ? 'low'
    : profile.disputesLost > 2
      ? 'watch'
      : 'verified';

  const trustConfig = {
    low: { icon: Shield, label: 'Unverified', color: 'text-stone-500 bg-stone-100' },
    watch: { icon: ShieldAlert, label: 'Watch', color: 'text-amber-700 bg-amber-50' },
    verified: { icon: ShieldCheck, label: 'Verified', color: 'text-emerald-700 bg-emerald-50' },
  };

  const trust = trustConfig[trustLevel];
  const TrustIcon = trust.icon;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Landlord Reputation</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${trust.color}`}>
          <TrustIcon className="h-3 w-3" />
          {trust.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-xl bg-stone-50 p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Staked</p>
          <p className="mt-1 text-base font-bold text-stone-900">{activeStakeSol.toFixed(2)}</p>
          <p className="text-[10px] text-stone-400">SOL</p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Total</p>
          <p className="mt-1 text-base font-bold text-stone-900">{totalStakedSol.toFixed(2)}</p>
          <p className="text-[10px] text-stone-400">SOL</p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Rentals</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-stone-900">
            <Trophy className="h-3.5 w-3.5 text-emerald-600" />
            {profile.completedRentals}
          </p>
          <p className="text-[10px] text-stone-400">done</p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Disputes</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-stone-900">
            {profile.disputesLost > 0 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            {profile.disputesLost}
          </p>
          <p className="text-[10px] text-stone-400">lost</p>
        </div>
      </div>

      {profile.disputesLost > 0 && (
        <p className="mt-3 text-xs text-amber-700">
          This landlord has lost {profile.disputesLost} dispute{profile.disputesLost === 1 ? '' : 's'}.
        </p>
      )}
    </div>
  );
}
