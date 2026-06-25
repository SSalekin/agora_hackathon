'use client';

import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Loader2, ShieldCheck } from 'lucide-react';
import { usePhantomWallet } from '@/hooks/use-phantom-wallet';
import { prepareAnchorClient, deriveLandlordProfilePda, explorerUrl } from '@/lib/solana';
import { formatWalletError } from '@/lib/preflight';
import type { LandlordProfileData } from '@/hooks/use-landlord-profile';

const LAMPORTS_PER_SOL = 1_000_000_000;

type Props = {
  profile: LandlordProfileData;
  totalStakedSol: number;
  activeStakeSol: number;
  hasMinimumStake: boolean;
  onRefresh: () => void;
};

type TxPhase = 'idle' | 'preparing' | 'signing' | 'submitted' | 'confirming' | 'confirmed' | 'failed';

export function StakeSummaryCard({ profile, totalStakedSol, activeStakeSol, hasMinimumStake, onRefresh }: Props) {
  const { publicKey: walletPubkey, connect } = usePhantomWallet();
  const [stakeAmount, setStakeAmount] = useState('0.5');
  const [unstakeAmount, setUnstakeAmount] = useState('0.1');
  const [txPhase, setTxPhase] = useState<TxPhase>('idle');
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBusy = txPhase !== 'idle' && txPhase !== 'confirmed' && txPhase !== 'failed';

  const handleStake = async () => {
    if (!walletPubkey) {
      try { await connect(); } catch { return; }
    }
    try {
      setError(null);
      setTxPhase('preparing');
      setTxMessage('Preparing transaction...');
      const { anchor, connection, program, connectedPubkey, SystemProgram } = await prepareAnchorClient();
      const profilePda = await deriveLandlordProfilePda(connectedPubkey, program.programId);
      const amount = profile.exists
        ? Math.round(Number(stakeAmount) * LAMPORTS_PER_SOL)
        : 100_000;
      if (!amount || amount <= 0) throw new Error('Enter a valid SOL amount.');

      setTxPhase('signing');
      setTxMessage('Waiting for wallet signature...');
      if (!profile.exists) {
        await program.methods
          .initializeLandlordProfile()
          .accounts({
            landlord: connectedPubkey,
            landlordProfile: profilePda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }
      const txSignatureResult = await program.methods
        .stakeLandlord(new anchor.BN(amount))
        .accounts({
          landlord: connectedPubkey,
          landlordProfile: profilePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxPhase('submitted');
      setTxSignature(txSignatureResult);
      setTxMessage('Submitted. Waiting for confirmation...');

      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      const confirmation = await connection.confirmTransaction({ signature: txSignatureResult, ...latestBlockhash }, 'confirmed');
      if (confirmation.value.err) throw new Error('Transaction failed on-chain.');

      setTxPhase('confirmed');
      setTxMessage('Stake confirmed!');
      onRefresh();
    } catch (err: unknown) {
      setTxPhase('failed');
      setTxMessage(formatWalletError(err));
      setError(formatWalletError(err));
    }
  };

  const handleUnstake = async () => {
    if (!walletPubkey) return;
    try {
      setError(null);
      setTxPhase('preparing');
      setTxMessage('Preparing transaction...');
      const { anchor, connection, program, connectedPubkey, PublicKey, SystemProgram } = await prepareAnchorClient();
      const profilePda = await deriveLandlordProfilePda(connectedPubkey, program.programId);

      const amount = Math.round(Number(unstakeAmount) * LAMPORTS_PER_SOL);
      if (!amount || amount <= 0) throw new Error('Enter a valid SOL amount.');
      if (amount > profile.activeStakeLamports) throw new Error('Cannot unstake more than active stake.');

      setTxPhase('signing');
      setTxMessage('Waiting for wallet signature...');
      const txSignatureResult = await program.methods
        .unstakeLandlord(new anchor.BN(amount))
        .accounts({
          landlord: connectedPubkey,
          landlordProfile: profilePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxPhase('submitted');
      setTxSignature(txSignatureResult);
      setTxMessage('Submitted. Waiting for confirmation...');

      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      const confirmation = await connection.confirmTransaction({ signature: txSignatureResult, ...latestBlockhash }, 'confirmed');
      if (confirmation.value.err) throw new Error('Transaction failed on-chain.');

      setTxPhase('confirmed');
      setTxMessage('Unstake confirmed!');
      onRefresh();
    } catch (err: unknown) {
      setTxPhase('failed');
      setTxMessage(formatWalletError(err));
      setError(formatWalletError(err));
    }
  };

  if (!profile.exists) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-900">Landlord Stake</p>
            <p className="text-xs text-stone-500">No on-chain profile yet. Initialize one to start staking.</p>
          </div>
        </div>
        {walletPubkey && (
          <button
            type="button"
            onClick={handleStake}
            disabled={isBusy}
            className="mt-4 w-full rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : 'Initialize & Stake 0.0001 SOL'}
          </button>
        )}
        {!walletPubkey && (
          <p className="mt-3 text-xs text-stone-500">Connect a landlord wallet to initialize a stake profile.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Your Stake</p>
        {hasMinimumStake && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-stone-50 p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Staked</p>
          <p className="mt-1 text-lg font-bold text-stone-900">{activeStakeSol.toFixed(2)}</p>
          <p className="text-[11px] text-stone-400">SOL</p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Total</p>
          <p className="mt-1 text-lg font-bold text-stone-900">{totalStakedSol.toFixed(2)}</p>
          <p className="text-[11px] text-stone-400">SOL</p>
        </div>
        <div className="rounded-xl bg-stone-50 p-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Disputes</p>
          <p className="mt-1 text-lg font-bold text-stone-900">{profile.disputesLost}</p>
          <p className="text-[11px] text-stone-400">lost</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-stone-600">Stake amount (SOL)</label>
          <div className="mt-1 flex gap-2">
            <input
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm"
              placeholder="0.5"
            />
            <button
              type="button"
              onClick={handleStake}
              disabled={isBusy || !walletPubkey}
              className="flex items-center gap-1 rounded-xl bg-emerald-800 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
              Stake
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-600">Unstake amount (SOL)</label>
          <div className="mt-1 flex gap-2">
            <input
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm"
              placeholder="0.1"
            />
            <button
              type="button"
              onClick={handleUnstake}
              disabled={isBusy || !walletPubkey || profile.activeStakeLamports === 0}
              className="flex items-center gap-1 rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpFromLine className="h-4 w-4" />}
              Unstake
            </button>
          </div>
        </div>
      </div>

      {txPhase !== 'idle' && txMessage && (
        <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${txPhase === 'failed' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-stone-200 bg-stone-50 text-stone-700'}`}>
          <div className="flex items-start justify-between gap-3">
            <p>{txMessage}</p>
            {txSignature && (
              <a href={explorerUrl(txSignature)} target="_blank" rel="noreferrer" className="shrink-0 text-xs underline underline-offset-2">
                Explorer
              </a>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
