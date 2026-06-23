"use client";

import { useState } from 'react';
import type { ApartmentListing } from '@/types/listing';
import idl from '@/idl/escrow.json';

const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_RPC_URL = (process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string) || 'https://api.devnet.solana.com';
const DEFAULT_CLUSTER = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as string) || 'devnet';

async function sha256Bytes(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return new Uint8Array(buf);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input: string) {
  return bytesToHex(await sha256Bytes(input));
}

type TxPhase = 'idle' | 'preparing' | 'signing' | 'submitted' | 'confirming' | 'confirmed' | 'failed';

type TxState = {
  phase: TxPhase;
  action: string | null;
  signature: string | null;
  explorerUrl: string | null;
  message: string | null;
};

const INITIAL_TX_STATE: TxState = {
  phase: 'idle',
  action: null,
  signature: null,
  explorerUrl: null,
  message: null,
};

type AgreementUiState =
  | 'awaitingLandlordApproval'
  | 'awaitingFunding'
  | 'funded'
  | 'disputed'
  | 'released'
  | 'refunded'
  | 'cancelled'
  | 'unknown';

function decodeAgreementState(value: unknown): AgreementUiState {
  if (typeof value === 'string') {
    const normalized = value.replace(/_/g, '').toLowerCase();
    if (normalized === 'awaitinglandlordapproval') return 'awaitingLandlordApproval';
    if (normalized === 'awaitingfunding') return 'awaitingFunding';
    if (normalized === 'funded') return 'funded';
    if (normalized === 'disputed') return 'disputed';
    if (normalized === 'released') return 'released';
    if (normalized === 'refunded') return 'refunded';
    if (normalized === 'cancelled') return 'cancelled';
    return 'unknown';
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 1) {
      return decodeAgreementState(keys[0]);
    }
  }

  return 'unknown';
}

function formatAgreementStateLabel(state: AgreementUiState): string {
  if (state === 'unknown') return 'Unknown';
  return state
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());
}

function buildAgreementView(
  onchain: unknown,
  pda: string,
  txSignature: string | null,
  stateValue: unknown,
) {
  return {
    onchain,
    pda,
    txSignature,
    state: decodeAgreementState(stateValue),
  };
}

function withAgreementState<T extends { state?: AgreementUiState }>(
  agreement: T,
  state: AgreementUiState,
  extra?: Record<string, unknown>,
) {
  return {
    ...agreement,
    ...extra,
    state,
  };
}

function explorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=${DEFAULT_CLUSTER}`;
}

type Props = { listing: ApartmentListing; onClose: () => void };

export default function TenantAgreementPanel({ listing, onClose }: Props) {
  const [walletPubkey, setWalletPubkey] = useState<string | null>(null);
  const [depositSol, setDepositSol] = useState<string>('0.5');
  const [landlord, setLandlord] = useState<string>('');
  const [inspectionDate, setInspectionDate] = useState<string>('');
  const [agreement, setAgreement] = useState<any>(null);
  const [txState, setTxState] = useState<TxState>(INITIAL_TX_STATE);
  const [error, setError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<string>('');

  const isBusy = txState.phase !== 'idle' && txState.phase !== 'confirmed' && txState.phase !== 'failed';

  const clearTxState = () => setTxState(INITIAL_TX_STATE);

  const setTxFailure = (action: string, message: string) => {
    setTxState({ phase: 'failed', action, signature: null, explorerUrl: null, message });
    setError(message);
  };

  const confirmSignature = async (connection: import('@solana/web3.js').Connection, signature: string, action: string) => {
    setTxState((current) => ({ ...current, phase: 'confirming', action, signature, explorerUrl: explorerUrl(signature), message: 'Waiting for confirmation...' }));
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    const confirmation = await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed');
    if (confirmation.value.err) {
      throw new Error(`Transaction confirmed with error: ${JSON.stringify(confirmation.value.err)}`);
    }
    setTxState((current) => ({ ...current, phase: 'confirmed', message: 'Transaction confirmed on-chain.' }));
  };

  const withTxFeedback = async <T,>(action: string, work: () => Promise<T>) => {
    clearTxState();
    setError(null);
    setTxState({ phase: 'preparing', action, signature: null, explorerUrl: null, message: 'Preparing transaction...' });
    try {
      const result = await work();
      return result;
    } catch (err: any) {
      const message = err?.message ?? String(err);
      setTxFailure(action, message);
      throw err;
    }
  };

  const connectWallet = async () => {
    setError(null);
    try {
      // Basic Phantom support via window.solana
      // This is intentionally minimal; consider using Wallet Adapter later.
      // @ts-ignore
      const provider = window.solana;
      if (!provider) throw new Error('No wallet provider found (Phantom recommended).');
      // @ts-ignore
      const resp = await provider.connect();
      // @ts-ignore
      setWalletPubkey(resp.publicKey?.toString?.() ?? provider.publicKey?.toString?.() ?? null);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const createAgreement = async () => {
    try {
      return await withTxFeedback('create agreement', async () => {
        // Prepare on-chain client
        const Anchor = await import('@anchor-lang/core');
        const anchor = Anchor as typeof import('@anchor-lang/core');
        const connection = new anchor.web3.Connection(DEFAULT_RPC_URL, 'confirmed');

        // Ensure wallet provider
        // @ts-ignore
        const providerWindow = window.solana;
        if (!providerWindow) throw new Error('No wallet provider found (Phantom recommended).');
        // Minimal wallet adapter for Anchor
        const walletAdapter: any = {
          publicKey: providerWindow.publicKey,
          signTransaction: providerWindow.signTransaction?.bind(providerWindow),
          signAllTransactions: providerWindow.signAllTransactions?.bind(providerWindow),
        };

        const provider = new anchor.AnchorProvider(connection, walletAdapter, anchor.AnchorProvider.defaultOptions());
        const programId = new anchor.web3.PublicKey((idl as any).address);
        const program = new anchor.Program(idl as any, provider);

        const tenantPubkey = providerWindow.publicKey as import('@solana/web3.js').PublicKey;
        if (!tenantPubkey) throw new Error('Wallet not connected');
        const landlordPubkey = new anchor.web3.PublicKey(landlord || tenantPubkey);

        const listingHashBytes = await sha256Bytes(listing.id);
        const depositLamports = Math.round(Number(depositSol || '0') * LAMPORTS_PER_SOL);
        if (!Number.isFinite(depositLamports) || depositLamports <= 0) {
          throw new Error('Deposit amount must be greater than zero');
        }
        const inspectionDeadline = inspectionDate ? Math.floor(new Date(inspectionDate).getTime() / 1000) : 0;
        if (!inspectionDeadline || inspectionDeadline <= Math.floor(Date.now() / 1000)) {
          throw new Error('Inspection deadline must be in the future');
        }

        const [configPda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);
        const [agreementPda] = anchor.web3.PublicKey.findProgramAddressSync([
          Buffer.from('agreement'),
          tenantPubkey.toBuffer(),
          landlordPubkey.toBuffer(),
          Buffer.from(listingHashBytes),
        ], program.programId);

        // Build and send the createAgreement transaction
        setTxState({ phase: 'signing', action: 'create agreement', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .createAgreement(Array.from(listingHashBytes), new anchor.BN(depositLamports), new anchor.BN(inspectionDeadline))
          .accounts({ tenant: tenantPubkey, landlord: landlordPubkey, config: configPda, agreement: agreementPda, systemProgram: anchor.web3.SystemProgram.programId })
          .rpc();
        setTxState({ phase: 'submitted', action: 'create agreement', signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, 'create agreement');

        // Fetch on-chain agreement account
        const onchain = await (program as any).account.agreement.fetch(agreementPda);
        setAgreement(buildAgreementView(onchain, agreementPda.toBase58(), txSignature, onchain.state));
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const fundAgreement = async () => {
    try {
      return await withTxFeedback('fund agreement', async () => {
        if (!agreement) throw new Error('No agreement to fund');
        const Anchor = await import('@anchor-lang/core');
        const anchor = Anchor as typeof import('@anchor-lang/core');
        const connection = new anchor.web3.Connection(DEFAULT_RPC_URL, 'confirmed');
        // @ts-ignore
        const providerWindow = window.solana;
        if (!providerWindow) throw new Error('No wallet provider found');
        const walletAdapter: any = {
          publicKey: providerWindow.publicKey,
          signTransaction: providerWindow.signTransaction?.bind(providerWindow),
          signAllTransactions: providerWindow.signAllTransactions?.bind(providerWindow),
        };
        const provider = new anchor.AnchorProvider(connection, walletAdapter, anchor.AnchorProvider.defaultOptions());
        const programId = new anchor.web3.PublicKey((idl as any).address);
        const program = new anchor.Program(idl as any, provider);

        const tenantPubkey = providerWindow.publicKey as import('@solana/web3.js').PublicKey;
        if (!tenantPubkey) throw new Error('Wallet not connected');
        const landlordPubkey = new anchor.web3.PublicKey(landlord || tenantPubkey);
        const listingHashBytes = await sha256Bytes(listing.id);
        const [agreementPda] = anchor.web3.PublicKey.findProgramAddressSync([
          Buffer.from('agreement'),
          tenantPubkey.toBuffer(),
          landlordPubkey.toBuffer(),
          Buffer.from(listingHashBytes),
        ], program.programId);

        setTxState({ phase: 'signing', action: 'fund agreement', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .fundAgreement()
          .accounts({ tenant: tenantPubkey, agreement: agreementPda, systemProgram: anchor.web3.SystemProgram.programId })
          .rpc();
        setTxState({ phase: 'submitted', action: 'fund agreement', signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, 'fund agreement');

        const onchain = await (program as any).account.agreement.fetch(agreementPda);
        setAgreement({ ...agreement, ...buildAgreementView(onchain, agreementPda.toBase58(), txSignature, onchain.state) });
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const cancelAgreement = async () => {
    if (!agreement) return setError('No agreement to cancel');
    setTxState({ phase: 'confirmed', action: 'cancel agreement', signature: null, explorerUrl: null, message: 'This demo action remains local until the cancel transaction is wired.' });
    setAgreement(withAgreementState(agreement, 'cancelled'));
  };

  const releaseByTenant = async () => {
    if (!agreement) return setError('No agreement to release');
    setTxState({ phase: 'confirmed', action: 'release agreement', signature: null, explorerUrl: null, message: 'This demo action remains local until the release transaction is wired.' });
    setAgreement(withAgreementState(agreement, 'released'));
  };

  const openDispute = async () => {
    try {
      return await withTxFeedback('open dispute', async () => {
        if (!agreement) throw new Error('No agreement to dispute');
        const evidenceHash = await sha256Hex(evidence || `${Date.now()}`);
        setTxState({ phase: 'confirmed', action: 'open dispute', signature: null, explorerUrl: null, message: 'This demo dispute is local until the dispute transaction is wired.' });
        setAgreement(withAgreementState(agreement, 'disputed', { dispute: { reasonCode: 1, evidenceHash } }));
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  return (
    <div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Listing</p>
            <p className="text-sm text-stone-700">{listing.title}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500">Rent</p>
            <p className="font-semibold text-emerald-800">{listing.monthlyRentVnd.toLocaleString()} VND</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium">Tenant wallet</label>
            <div className="mt-1 flex items-center gap-2">
              <input value={walletPubkey ?? ''} readOnly placeholder="Not connected" className="flex-1 rounded-md border px-3 py-2 text-sm" />
              <button type="button" onClick={connectWallet} disabled={isBusy} className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Connect</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Landlord public key</label>
            <input value={landlord} onChange={(e) => setLandlord(e.target.value)} placeholder="Landlord wallet address" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium">Deposit (SOL)</label>
            <input value={depositSol} onChange={(e) => setDepositSol(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium">Inspection deadline</label>
            <input type="datetime-local" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={createAgreement} disabled={isBusy} className="w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {txState.phase === 'signing' || txState.action === 'create agreement' ? 'Creating…' : 'Create agreement'}
            </button>
          </div>
        </div>

        {txState.phase !== 'idle' && (
          <div className={`rounded-md border px-3 py-2 text-sm ${txState.phase === 'failed' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-stone-200 bg-stone-50 text-stone-700'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold capitalize">{txState.action ?? 'Transaction'}</p>
                <p>{txState.message ?? 'Working...'}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-medium uppercase tracking-[0.14em]">{txState.phase}</p>
                {txState.signature && <a href={txState.explorerUrl ?? explorerUrl(txState.signature)} target="_blank" rel="noreferrer" className="underline underline-offset-2">View on Explorer</a>}
              </div>
            </div>
            {txState.signature && <p className="mt-2 break-all text-xs">Signature: {txState.signature}</p>}
          </div>
        )}

        {agreement && (
          <div className="rounded-md border p-3">
            <p className="text-xs text-stone-500">Agreement state: <span className="font-semibold">{formatAgreementStateLabel(agreement.state)}</span></p>
            {agreement.txSignature && <p className="mt-1 text-xs text-stone-500">Last on-chain signature: <a href={explorerUrl(agreement.txSignature)} target="_blank" rel="noreferrer" className="underline underline-offset-2">{agreement.txSignature}</a></p>}
            <pre className="mt-2 max-h-40 overflow-auto text-xs text-stone-700">{JSON.stringify(agreement, null, 2)}</pre>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={fundAgreement} disabled={isBusy || agreement.state !== 'awaitingFunding'} className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {txState.action === 'fund agreement' && isBusy ? 'Funding…' : 'Fund'}
              </button>
              <button type="button" onClick={cancelAgreement} disabled={isBusy} className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
              <button type="button" onClick={releaseByTenant} disabled={isBusy || agreement.state !== 'funded'} className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Release (tenant)</button>
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium">Evidence (optional)</label>
              <input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Short description or evidence text" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={openDispute} disabled={isBusy} className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{txState.action === 'open dispute' && isBusy ? 'Opening…' : 'Open dispute'}</button>
                <button type="button" onClick={() => { setAgreement(null); clearTxState(); onClose(); }} disabled={isBusy} className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Close</button>
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
      </div>
    </div>
  );
}
