'use client';

import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';
import type { LandlordProfileData } from '@/hooks/use-landlord-profile';

const LAMPORTS_PER_SOL = 1_000_000_000;

type Props = {
  wallet: string;
  profile: LandlordProfileData;
  totalStakedSol: number;
  activeStakeSol: number;
  hasMinimumStake: boolean;
};

export function LandlordRiskPanel({ wallet, profile, totalStakedSol, activeStakeSol, hasMinimumStake }: Props) {
  if (!profile.exists) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background/60 px-5 py-6">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">Landlord Risk</p>
        <p className="mt-2 text-sm text-muted-foreground">No on-chain stake profile for this landlord.</p>
        <p className="mt-1 text-xs text-muted-foreground">Wallet: <span className="font-mono">{wallet.slice(0, 8)}...{wallet.slice(-4)}</span></p>
      </div>
    );
  }

  const riskLevel = !hasMinimumStake
    ? 'high'
    : profile.disputesLost > 2
      ? 'high'
      : profile.disputesLost > 0
        ? 'medium'
        : 'low';

  const COLOR_SCHEMES = {
    high: { color: 'border-destructive/30 bg-destructive/10', label: 'High Risk', textColor: 'text-destructive' },
    medium: { color: 'border-warning/30 bg-warning/10', label: 'Medium Risk', textColor: 'text-warning' },
    low: { color: 'border-primary/30 bg-primary/10', label: 'Low Risk', textColor: 'text-primary' },
  } as const;

  const risk = COLOR_SCHEMES[riskLevel];

  return (
    <div className={`rounded-2xl border ${risk.color} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">Landlord Risk Assessment</p>
        <span className={`text-xs font-semibold ${risk.textColor}`}>{risk.label}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-[11px] text-muted-foreground">Active stake</p>
          <p className="font-semibold text-foreground">{activeStakeSol.toFixed(2)} SOL</p>
          {!hasMinimumStake && <p className="text-[11px] text-destructive">Below 0.0001 SOL minimum</p>}
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Completed</p>
          <p className="font-semibold text-foreground">{profile.completedRentals}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Disputes lost</p>
          <p className="font-semibold text-foreground">
            {profile.disputesLost}
            {profile.disputesLost > 0 && <AlertTriangle className="ml-1 inline h-3 w-3 text-warning" />}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-mono">{wallet.slice(0, 8)}...{wallet.slice(-4)}</span>
        <a
          href={`https://explorer.solana.com/address/${wallet}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet'}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-2"
        >
          Explorer <ExternalLink className="inline h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
