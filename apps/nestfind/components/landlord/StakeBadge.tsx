'use client';

import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

type StakeBadgeProps = {
  activeStakeSol: number;
  hasMinimumStake: boolean;
  disputesLost: number;
  size?: 'sm' | 'md';
};

export function StakeBadge({ activeStakeSol, hasMinimumStake, disputesLost, size = 'sm' }: StakeBadgeProps) {
  if (activeStakeSol === 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-500 ${size === 'md' ? 'px-3 py-1 text-xs' : ''}`}>
        <Shield className="h-3 w-3" />
        Unverified
      </span>
    );
  }

  if (!hasMinimumStake || disputesLost > 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ${size === 'md' ? 'px-3 py-1 text-xs' : ''}`}>
        <ShieldAlert className="h-3 w-3" />
        {activeStakeSol.toFixed(1)} SOL staked
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 ${size === 'md' ? 'px-3 py-1 text-xs' : ''}`}>
      <ShieldCheck className="h-3 w-3" />
      {activeStakeSol.toFixed(1)} SOL staked
    </span>
  );
}
