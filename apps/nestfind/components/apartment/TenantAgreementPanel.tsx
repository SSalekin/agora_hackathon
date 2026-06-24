"use client";

import { useEffect, useRef, useState } from 'react';
import type { ApartmentListing } from '@/types/listing';
import idl from '@/idl/escrow.json';
import {
  buildAgreementView,
  formatAgreementStateLabel,
  withAgreementState,
  type AgreementUiState,
  type AgreementView,
} from '@/lib/escrow';
import { usePhantomWallet } from '@/hooks/use-phantom-wallet';

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

function explorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=${DEFAULT_CLUSTER}`;
}

type Props = { listing: ApartmentListing; onClose: () => void };

function isValidSolanaPubkey(value: string): boolean {
  try {
    const decoded = anchorWeb3Decode(value);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

function anchorWeb3Decode(base58: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const decoded: number[] = [];
  for (const char of base58) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error(`Invalid base58 character: ${char}`);
    let carry = index;
    for (let j = 0; j < decoded.length; j++) {
      const x = decoded[j] * 58 + carry;
      decoded[j] = x & 0xff;
      carry = x >> 8;
    }
    while (carry > 0) {
      decoded.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of base58) {
    if (char === '1') decoded.push(0);
    else break;
  }
  return new Uint8Array(decoded.reverse());
}

export default function TenantAgreementPanel({ listing, onClose }: Props) {
  const { publicKey: walletPubkey, connect, disconnect } = usePhantomWallet();
  const [depositSol, setDepositSol] = useState<string>('0.5');
  const [inspectionDate, setInspectionDate] = useState<string>('');
  const [agreement, setAgreement] = useState<AgreementView | null>(null);
  const [txState, setTxState] = useState<TxState>(INITIAL_TX_STATE);
  const [error, setError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<string>('');
  const [isLoadingAgreement, setIsLoadingAgreement] = useState(false);

  const landlordWallet = listing.landlordWallet;
  const isLandlordValid = isValidSolanaPubkey(landlordWallet);
  const isBusy = txState.phase !== 'idle' && txState.phase !== 'confirmed' && txState.phase !== 'failed';
  const agreementOnchain = agreement?.onchain as Record<string, any> | null;
  const connectedRole =
    walletPubkey && agreementOnchain
      ? walletPubkey === agreementOnchain.tenant?.toBase58?.()
        ? 'tenant'
        : walletPubkey === agreementOnchain.landlord?.toBase58?.()
          ? 'landlord'
          : walletPubkey === agreementOnchain.moderator?.toBase58?.()
            ? 'moderator'
            : 'viewer'
      : null;

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

  const prepareAnchorClient = async () => {
    const Anchor = await import('@anchor-lang/core');
    const anchor = Anchor as typeof import('@anchor-lang/core');
    const connection = new anchor.web3.Connection(DEFAULT_RPC_URL, 'confirmed');
    // @ts-ignore — Phantom injects window.solana
    const providerWindow = window.solana;
    if (!providerWindow) throw new Error('No wallet provider found (Phantom recommended).');
    const walletAdapter: any = {
      publicKey: providerWindow.publicKey,
      signTransaction: providerWindow.signTransaction?.bind(providerWindow),
      signAllTransactions: providerWindow.signAllTransactions?.bind(providerWindow),
    };
    const anchorProvider = new anchor.AnchorProvider(connection, walletAdapter, anchor.AnchorProvider.defaultOptions());
    const program = new anchor.Program(idl as any, anchorProvider);
    const connectedPubkey = providerWindow.publicKey as import('@solana/web3.js').PublicKey;
    if (!connectedPubkey) throw new Error('Wallet not connected');
    const landlordPubkey = new anchor.web3.PublicKey(landlordWallet);
    const listingHashBytes = await sha256Bytes(listing.id);
    const [agreementPda] = anchor.web3.PublicKey.findProgramAddressSync([
      Buffer.from('agreement'),
      connectedPubkey.toBuffer(),
      landlordPubkey.toBuffer(),
      Buffer.from(listingHashBytes),
    ], program.programId);

    return {
      anchor,
      connection,
      program,
      connectedPubkey,
      landlordPubkey,
      listingHashBytes,
      agreementPda,
    };
  };

  const getAgreementActors = async () => {
    const { anchor, connection, program, connectedPubkey } = await prepareAnchorClient();
    if (!agreement || !agreementOnchain) throw new Error('No agreement loaded');

    const tenantPubkey = new anchor.web3.PublicKey(agreementOnchain.tenant.toBase58());
    const landlordPubkey = new anchor.web3.PublicKey(agreementOnchain.landlord.toBase58());
    const moderatorPubkey = new anchor.web3.PublicKey(agreementOnchain.moderator.toBase58());
    const agreementPda = new anchor.web3.PublicKey(agreement.pda);

    return {
      anchor,
      connection,
      program,
      connectedPubkey,
      tenantPubkey,
      landlordPubkey,
      moderatorPubkey,
      agreementPda,
    };
  };

  const loadExistingAgreement = async () => {
    try {
      setIsLoadingAgreement(true);
      const { program, connectedPubkey } = await prepareAnchorClient();
      const listingHashHex = await sha256Hex(listing.id);
      const allAgreements = await (program as any).account.agreement.all();

      const matchingAgreement = allAgreements
        .map((item: any) => ({
          publicKey: item.publicKey,
          account: item.account,
        }))
        .filter(({ account }: any) => {
          const accountListingHashHex = bytesToHex(Uint8Array.from(account.listingHash));
          if (accountListingHashHex !== listingHashHex) return false;

          const connectedBase58 = connectedPubkey.toBase58();
          return (
            account.tenant?.toBase58?.() === connectedBase58 ||
            account.landlord?.toBase58?.() === connectedBase58 ||
            account.moderator?.toBase58?.() === connectedBase58
          );
        })
        .sort((a: any, b: any) => Number(b.account.createdAt ?? 0) - Number(a.account.createdAt ?? 0))[0];

      if (!matchingAgreement) {
        setAgreement(null);
        return;
      }

      setAgreement(
        buildAgreementView(
          matchingAgreement.account,
          matchingAgreement.publicKey.toBase58(),
          null,
          matchingAgreement.account.state,
        ),
      );
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setIsLoadingAgreement(false);
    }
  };

  const connectWallet = async () => {
    setError(null);
    try {
      const key = await connect();
      if (key) {
        await loadExistingAgreement();
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const prevPubkeyRef = useRef<string | null>(walletPubkey);
  useEffect(() => {
    const prev = prevPubkeyRef.current;
    const curr = walletPubkey;
    prevPubkeyRef.current = curr;

    // Wallet disconnected — clear agreement state.
    if (prev && !curr) {
      setAgreement(null);
      clearTxState();
      setError(null);
      return;
    }

    // Wallet connected or account changed — load agreement for the new pubkey.
    if (curr) {
      loadExistingAgreement().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletPubkey, listing.id]);

  const createAgreement = async () => {
    try {
      return await withTxFeedback('create agreement', async () => {
        if (!isLandlordValid) {
          throw new Error('Listing has an invalid landlord wallet address. Cannot create agreement.');
        }

        const { anchor, connection, program, connectedPubkey, landlordPubkey, listingHashBytes, agreementPda } = await prepareAnchorClient();

        if (connectedPubkey.equals(landlordPubkey)) {
          throw new Error('Tenant and landlord wallets must be different. Connect a different wallet or choose a listing with a different landlord.');
        }

        const depositLamports = Math.round(Number(depositSol || '0') * LAMPORTS_PER_SOL);
        if (!Number.isFinite(depositLamports) || depositLamports <= 0) {
          throw new Error('Deposit amount must be greater than zero');
        }
        const inspectionDeadline = inspectionDate ? Math.floor(new Date(inspectionDate).getTime() / 1000) : 0;
        if (!inspectionDeadline || inspectionDeadline <= Math.floor(Date.now() / 1000)) {
          throw new Error('Inspection deadline must be in the future');
        }

        const [configPda] = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);

        // Build and send the createAgreement transaction
        setTxState({ phase: 'signing', action: 'create agreement', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .createAgreement(Array.from(listingHashBytes), new anchor.BN(depositLamports), new anchor.BN(inspectionDeadline))
          .accounts({ tenant: connectedPubkey, landlord: landlordPubkey, config: configPda, agreement: agreementPda, systemProgram: anchor.web3.SystemProgram.programId })
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
        const { anchor, connection, program, tenantPubkey, agreementPda } = await getAgreementActors();

        setTxState({ phase: 'signing', action: 'fund agreement', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .fundAgreement()
          .accounts({ tenant: tenantPubkey, agreement: agreementPda, systemProgram: anchor.web3.SystemProgram.programId })
          .rpc();
        setTxState({ phase: 'submitted', action: 'fund agreement', signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, 'fund agreement');

        const onchain = await (program as any).account.agreement.fetch(agreementPda);
        setAgreement(buildAgreementView(onchain, agreementPda.toBase58(), txSignature, onchain.state));
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const cancelAgreement = async () => {
    try {
      return await withTxFeedback('cancel agreement', async () => {
        if (!agreement) throw new Error('No agreement to cancel');
        const currentAgreement = agreement;
        const { connection, program, connectedPubkey, tenantPubkey, landlordPubkey, agreementPda } = await getAgreementActors();

        setTxState({ phase: 'signing', action: 'cancel agreement', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .cancelAgreement()
          .accounts({
            authority: connectedPubkey,
            tenant: tenantPubkey,
            landlord: landlordPubkey,
            agreement: agreementPda,
          })
          .rpc();
        setTxState({ phase: 'submitted', action: 'cancel agreement', signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, 'cancel agreement');

        setAgreement(withAgreementState(currentAgreement, 'cancelled', { onchain: null, txSignature }));
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const releaseByTenant = async () => {
    try {
      return await withTxFeedback('release agreement', async () => {
        if (!agreement) throw new Error('No agreement to release');
        const currentAgreement = agreement;
        const { connection, program, tenantPubkey, landlordPubkey, agreementPda } = await getAgreementActors();

        setTxState({ phase: 'signing', action: 'release agreement', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .releaseByTenant()
          .accounts({
            tenant: tenantPubkey,
            landlord: landlordPubkey,
            agreement: agreementPda,
          })
          .rpc();
        setTxState({ phase: 'submitted', action: 'release agreement', signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, 'release agreement');

        setAgreement(withAgreementState(currentAgreement, 'released', { onchain: null, txSignature }));
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const openDispute = async () => {
    try {
      return await withTxFeedback('open dispute', async () => {
        if (!agreement) throw new Error('No agreement to dispute');
        const { anchor, connection, program, connectedPubkey, agreementPda } = await getAgreementActors();
        const evidenceHashBytes = await sha256Bytes(evidence || `${Date.now()}`);

        setTxState({ phase: 'signing', action: 'open dispute', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .openDispute(1, Array.from(evidenceHashBytes))
          .accounts({
            authority: connectedPubkey,
            agreement: agreementPda,
          })
          .rpc();
        setTxState({ phase: 'submitted', action: 'open dispute', signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, 'open dispute');

        const onchain = await (program as any).account.agreement.fetch(agreementPda);
        setAgreement(buildAgreementView(onchain, agreementPda.toBase58(), txSignature, onchain.state));
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const approveAgreement = async () => {
    try {
      return await withTxFeedback('approve agreement', async () => {
        const { connection, program, landlordPubkey, agreementPda } = await getAgreementActors();
        setTxState({ phase: 'signing', action: 'approve agreement', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .approveAgreement()
          .accounts({ landlord: landlordPubkey, agreement: agreementPda })
          .rpc();
        setTxState({ phase: 'submitted', action: 'approve agreement', signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, 'approve agreement');
        const onchain = await (program as any).account.agreement.fetch(agreementPda);
        setAgreement(buildAgreementView(onchain, agreementPda.toBase58(), txSignature, onchain.state));
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const releaseAfterDeadline = async () => {
    try {
      return await withTxFeedback('release after deadline', async () => {
        if (!agreement) throw new Error('No agreement to release');
        const currentAgreement = agreement;
        const { connection, program, tenantPubkey, landlordPubkey, agreementPda } = await getAgreementActors();
        setTxState({ phase: 'signing', action: 'release after deadline', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .releaseAfterDeadline()
          .accounts({ landlord: landlordPubkey, tenant: tenantPubkey, agreement: agreementPda })
          .rpc();
        setTxState({ phase: 'submitted', action: 'release after deadline', signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, 'release after deadline');
        setAgreement(withAgreementState(currentAgreement, 'released', { onchain: null, txSignature }));
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const resolveDispute = async (releaseToLandlord: boolean) => {
    try {
      return await withTxFeedback(releaseToLandlord ? 'resolve dispute: release' : 'resolve dispute: refund', async () => {
        if (!agreement) throw new Error('No agreement to resolve');
        const currentAgreement = agreement;
        const { connection, program, tenantPubkey, landlordPubkey, moderatorPubkey, agreementPda } = await getAgreementActors();
        const action = releaseToLandlord ? 'resolve dispute: release' : 'resolve dispute: refund';
        setTxState({ phase: 'signing', action, signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .resolveDispute(releaseToLandlord)
          .accounts({
            moderator: moderatorPubkey,
            tenant: tenantPubkey,
            landlord: landlordPubkey,
            agreement: agreementPda,
          })
          .rpc();
        setTxState({ phase: 'submitted', action, signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, action);
        setAgreement(withAgreementState(currentAgreement, releaseToLandlord ? 'released' : 'refunded', { onchain: null, txSignature }));
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
            <label className="text-xs font-medium">Connected wallet</label>
            <div className="mt-1 flex items-center gap-2">
              <input value={walletPubkey ?? ''} readOnly placeholder="Not connected" className="flex-1 rounded-md border px-3 py-2 text-sm" />
              <button type="button" onClick={connectWallet} disabled={isBusy} className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Connect</button>
            </div>
            {connectedRole && <p className="mt-1 text-xs text-stone-500">Role for loaded agreement: <span className="font-semibold capitalize">{connectedRole}</span></p>}
            {isLoadingAgreement && <p className="mt-1 text-xs text-stone-500">Loading existing agreement for this wallet…</p>}
          </div>
          <div>
            <label className="text-xs font-medium">Landlord wallet (from listing)</label>
            <input
              value={landlordWallet}
              readOnly
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${isLandlordValid ? 'bg-stone-50 text-stone-700' : 'border-rose-300 bg-rose-50 text-rose-700'}`}
            />
            {!isLandlordValid && (
              <p className="mt-1 text-xs text-rose-600">Invalid landlord wallet address on this listing.</p>
            )}
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
            <button
              type="button"
              onClick={createAgreement}
              disabled={isBusy || !isLandlordValid}
              className="w-full rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
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
              <button type="button" onClick={approveAgreement} disabled={isBusy || agreement.state !== 'awaitingLandlordApproval' || connectedRole !== 'landlord'} className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {txState.action === 'approve agreement' && isBusy ? 'Approving…' : 'Approve'}
              </button>
              <button type="button" onClick={fundAgreement} disabled={isBusy || agreement.state !== 'awaitingFunding' || connectedRole !== 'tenant'} className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {txState.action === 'fund agreement' && isBusy ? 'Funding…' : 'Fund'}
              </button>
              <button type="button" onClick={cancelAgreement} disabled={isBusy || !connectedRole || connectedRole === 'viewer' || !['awaitingLandlordApproval', 'awaitingFunding'].includes(agreement.state)} className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
              <button type="button" onClick={releaseByTenant} disabled={isBusy || agreement.state !== 'funded' || connectedRole !== 'tenant'} className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Release (tenant)</button>
              <button type="button" onClick={releaseAfterDeadline} disabled={isBusy || agreement.state !== 'funded' || connectedRole !== 'landlord'} className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Release after deadline</button>
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium">Evidence (optional)</label>
              <input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Short description or evidence text" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={openDispute} disabled={isBusy || agreement.state !== 'funded' || (connectedRole !== 'tenant' && connectedRole !== 'landlord')} className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{txState.action === 'open dispute' && isBusy ? 'Opening…' : 'Open dispute'}</button>
                <button type="button" onClick={() => resolveDispute(true)} disabled={isBusy || agreement.state !== 'disputed' || connectedRole !== 'moderator'} className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Moderator release</button>
                <button type="button" onClick={() => resolveDispute(false)} disabled={isBusy || agreement.state !== 'disputed' || connectedRole !== 'moderator'} className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Moderator refund</button>
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
