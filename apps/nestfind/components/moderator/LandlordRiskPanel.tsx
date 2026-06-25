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
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-5 py-6">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-stone-400">Landlord Risk</p>
        <p className="mt-2 text-sm text-stone-500">No on-chain stake profile for this landlord.</p>
        <p className="mt-1 text-xs text-stone-400">Wallet: <span className="font-mono">{wallet.slice(0, 8)}...{wallet.slice(-4)}</span></p>
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

  const riskConfig = {
    high: { color: 'border-rose-200 bg-rose-50', label: 'High Risk', textColor: 'text-rose-700' },
    medium: { color: 'border-amber-200 bg-amber-50', label: 'Medium Risk', textColor: 'text-amber-700' },
    low: { color: 'border-emerald-200 bg-emerald-50', label: 'Low Risk', textColor: 'text-emerald-700' },
  };

  const risk = riskConfig[riskLevel];

  return (
    <div className={`rounded-2xl border ${risk.color} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-stone-500">Landlord Risk Assessment</p>
        <span className={`text-xs font-semibold ${risk.textColor}`}>{risk.label}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-[11px] text-stone-500">Active stake</p>
          <p className="font-semibold text-stone-900">{activeStakeSol.toFixed(2)} SOL</p>
          {!hasMinimumStake && <p className="text-[11px] text-rose-600">Below 0.0001 SOL minimum</p>}
        </div>
        <div>
          <p className="text-[11px] text-stone-500">Completed</p>
          <p className="font-semibold text-stone-900">{profile.completedRentals}</p>
        </div>
        <div>
          <p className="text-[11px] text-stone-500">Disputes lost</p>
          <p className="font-semibold text-stone-900">
            {profile.disputesLost}
            {profile.disputesLost > 0 && <AlertTriangle className="ml-1 inline h-3 w-3 text-amber-500" />}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-stone-500">
        <span className="font-mono">{wallet.slice(0, 8)}...{wallet.slice(-4)}</span>
        <a
          href={`https://explorer.solana.com/address/${wallet}?cluster=${process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet'}`}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-700 underline underline-offset-2"
        >
          Explorer <ExternalLink className="inline h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
