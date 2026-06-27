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
      <span className={`inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground ${size === 'md' ? 'px-3 py-1 text-xs' : ''}`}>
        <Shield className="h-3 w-3" />
        Unverified
      </span>
    );
  }

  if (!hasMinimumStake || disputesLost > 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning ${size === 'md' ? 'px-3 py-1 text-xs' : ''}`}>
        <ShieldAlert className="h-3 w-3" />
        {activeStakeSol.toFixed(1)} SOL staked
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary ${size === 'md' ? 'px-3 py-1 text-xs' : ''}`}>
      <ShieldCheck className="h-3 w-3" />
      {activeStakeSol.toFixed(1)} SOL staked
    </span>
  );
}
