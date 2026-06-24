'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, CalendarClock, ExternalLink, KeyRound } from 'lucide-react';
import type { ApartmentListing } from '@/types/listing';
import { buildAgreementView, formatAgreementStateLabel, withAgreementState, type AgreementView } from '@/lib/escrow';
import idl from '@/idl/escrow.json';
import { usePhantomWallet } from '@/hooks/use-phantom-wallet';

const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_RPC_URL =
  (process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string) || 'https://api.devnet.solana.com';
const DEFAULT_CLUSTER =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as string) || 'devnet';

type Props = {
  listings: ApartmentListing[];
};

type LandlordAgreementQueueItem = {
  agreement: AgreementView<any>;
  listing: ApartmentListing | null;
};

type TxPhase = 'idle' | 'preparing' | 'signing' | 'submitted' | 'confirming' | 'confirmed' | 'failed';

type TxState = {
  phase: TxPhase;
  action: string | null;
  signature: string | null;
  explorerUrl: string | null;
  message: string | null;
  activePda: string | null;
};

const INITIAL_TX_STATE: TxState = {
  phase: 'idle',
  action: null,
  signature: null,
  explorerUrl: null,
  message: null,
  activePda: null,
};

function txExplorerUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=${DEFAULT_CLUSTER}`;
}

function addressExplorerUrl(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=${DEFAULT_CLUSTER}`;
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function parseBigNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toString' in value) {
    return Number((value as { toString(): string }).toString());
  }
  return 0;
}

export function LandlordDashboard({ listings }: Props) {
  const { publicKey: walletPubkey, connect } = usePhantomWallet();
  const [queue, setQueue] = useState<LandlordAgreementQueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txState, setTxState] = useState<TxState>(INITIAL_TX_STATE);
  const [evidence, setEvidence] = useState<Record<string, string>>({});

  const isBusy =
    txState.phase !== 'idle' &&
    txState.phase !== 'confirmed' &&
    txState.phase !== 'failed';

  const listingHashMapPromise = useMemo(
    () =>
      Promise.all(
        listings.map(async (listing) => [await sha256Hex(listing.id), listing] as const),
      ).then((entries) => new Map(entries)),
    [listings],
  );

  const clearTxState = () => setTxState(INITIAL_TX_STATE);

  const setTxFailure = (action: string, pda: string, message: string) => {
    setTxState({ phase: 'failed', action, signature: null, explorerUrl: null, message, activePda: pda });
    setError(message);
  };

  const confirmSignature = async (
    connection: import('@solana/web3.js').Connection,
    signature: string,
    action: string,
    pda: string,
  ) => {
    setTxState((current) => ({
      ...current,
      phase: 'confirming',
      action,
      signature,
      explorerUrl: txExplorerUrl(signature),
      message: 'Waiting for confirmation...',
      activePda: pda,
    }));
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    const confirmation = await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed');
    if (confirmation.value.err) {
      throw new Error(`Transaction confirmed with error: ${JSON.stringify(confirmation.value.err)}`);
    }
    setTxState((current) => ({
      ...current,
      phase: 'confirmed',
      message: 'Transaction confirmed on-chain.',
    }));
  };

  const withTxFeedback = async <T,>(action: string, pda: string, work: () => Promise<T>) => {
    clearTxState();
    setError(null);
    setTxState({ phase: 'preparing', action, signature: null, explorerUrl: null, message: 'Preparing transaction...', activePda: pda });
    try {
      return await work();
    } catch (err: any) {
      const message = err?.message ?? String(err);
      setTxFailure(action, pda, message);
      throw err;
    }
  };

  const prepareAnchorClient = async () => {
    const Anchor = await import('@anchor-lang/core');
    const anchor = Anchor as typeof import('@anchor-lang/core');
    const connection = new anchor.web3.Connection(DEFAULT_RPC_URL, 'confirmed');
    // @ts-ignore
    const providerWindow = window.solana;
    if (!providerWindow) throw new Error('No wallet provider found (Phantom recommended).');
    const walletAdapter: any = {
      publicKey: providerWindow.publicKey,
      signTransaction: providerWindow.signTransaction?.bind(providerWindow),
      signAllTransactions: providerWindow.signAllTransactions?.bind(providerWindow),
    };
    const provider = new anchor.AnchorProvider(
      connection,
      walletAdapter,
      anchor.AnchorProvider.defaultOptions(),
    );
    const program = new anchor.Program(idl as any, provider);
    const connectedPubkey = providerWindow.publicKey as import('@solana/web3.js').PublicKey;
    if (!connectedPubkey) throw new Error('Wallet not connected');
    return { anchor, connection, program, connectedPubkey };
  };

  const loadQueue = async (connectedWallet?: string | null) => {
    const wallet = connectedWallet ?? walletPubkey;
    if (!wallet) return;
    try {
      setIsLoadingQueue(true);
      setError(null);

      const { program } = await prepareAnchorClient();
      const listingHashMap = await listingHashMapPromise;

      const allAgreements = await (program as any).account.agreement.all();
      const landlordAgreements = allAgreements
        .filter((item: any) => item.account.landlord?.toBase58?.() === wallet)
        .sort(
          (a: any, b: any) =>
            Number(b.account.createdAt ?? 0) - Number(a.account.createdAt ?? 0),
        )
        .map((item: any) => {
          const listingHashHex = Array.from(Uint8Array.from(item.account.listingHash))
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('');
          return {
            agreement: buildAgreementView(
              item.account,
              item.publicKey.toBase58(),
              null,
              item.account.state,
            ),
            listing: listingHashMap.get(listingHashHex) ?? null,
          };
        });

      setQueue(landlordAgreements);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const prevPubkeyRef = useRef<string | null>(walletPubkey);
  useEffect(() => {
    const prev = prevPubkeyRef.current;
    const curr = walletPubkey;
    prevPubkeyRef.current = curr;

    // Wallet disconnected — clear queue.
    if (prev && !curr) {
      setQueue([]);
      clearTxState();
      setError(null);
      return;
    }

    // Wallet connected or account changed — load queue for the new pubkey.
    if (curr) {
      loadQueue(curr).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletPubkey]);

  const connectWallet = async () => {
    setError(null);
    try {
      await connect();
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const refreshAgreement = async (pda: string) => {
    try {
      const { program } = await prepareAnchorClient();
      const onchain = await (program as any).account.agreement.fetch(
        new (await import('@solana/web3.js')).PublicKey(pda),
      );
      setQueue((prev) =>
        prev.map((item) =>
          item.agreement.pda === pda
            ? {
                ...item,
                agreement: buildAgreementView(onchain, pda, null, onchain.state),
              }
            : item,
        ),
      );
    } catch {
      // silent — next refresh will pick it up
    }
  };

  const approveAgreement = async (pda: string) => {
    try {
      await withTxFeedback('approve agreement', pda, async () => {
        const { anchor, connection, program, connectedPubkey } = await prepareAnchorClient();
        const agreementPubkey = new anchor.web3.PublicKey(pda);

        setTxState((c) => ({ ...c, phase: 'signing', message: 'Waiting for wallet signature...' }));
        const txSignature = await program.methods
          .approveAgreement()
          .accounts({ landlord: connectedPubkey, agreement: agreementPubkey })
          .rpc();
        setTxState((c) => ({ ...c, phase: 'submitted', signature: txSignature, explorerUrl: txExplorerUrl(txSignature), message: 'Submitted. Waiting for confirmation...' }));
        await confirmSignature(connection, txSignature, 'approve agreement', pda);

        const onchain = await (program as any).account.agreement.fetch(agreementPubkey);
        setQueue((prev) =>
          prev.map((item) =>
            item.agreement.pda === pda
              ? { ...item, agreement: buildAgreementView(onchain, pda, txSignature, onchain.state) }
              : item,
          ),
        );
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const cancelAgreement = async (pda: string) => {
    try {
      await withTxFeedback('cancel agreement', pda, async () => {
        const { anchor, connection, program, connectedPubkey } = await prepareAnchorClient();
        const agreementPubkey = new anchor.web3.PublicKey(pda);
        const onchain = await (program as any).account.agreement.fetch(agreementPubkey);
        const tenantPubkey = new anchor.web3.PublicKey(onchain.tenant.toBase58());
        const landlordPubkey = new anchor.web3.PublicKey(onchain.landlord.toBase58());

        setTxState((c) => ({ ...c, phase: 'signing', message: 'Waiting for wallet signature...' }));
        const txSignature = await program.methods
          .cancelAgreement()
          .accounts({
            authority: connectedPubkey,
            tenant: tenantPubkey,
            landlord: landlordPubkey,
            agreement: agreementPubkey,
          })
          .rpc();
        setTxState((c) => ({ ...c, phase: 'submitted', signature: txSignature, explorerUrl: txExplorerUrl(txSignature), message: 'Submitted. Waiting for confirmation...' }));
        await confirmSignature(connection, txSignature, 'cancel agreement', pda);

        setQueue((prev) =>
          prev.map((item) =>
            item.agreement.pda === pda
              ? { ...item, agreement: withAgreementState(item.agreement, 'cancelled', { txSignature }) }
              : item,
          ),
        );
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const releaseAfterDeadline = async (pda: string) => {
    try {
      await withTxFeedback('release after deadline', pda, async () => {
        const { anchor, connection, program, connectedPubkey } = await prepareAnchorClient();
        const agreementPubkey = new anchor.web3.PublicKey(pda);
        const onchain = await (program as any).account.agreement.fetch(agreementPubkey);
        const tenantPubkey = new anchor.web3.PublicKey(onchain.tenant.toBase58());

        setTxState((c) => ({ ...c, phase: 'signing', message: 'Waiting for wallet signature...' }));
        const txSignature = await program.methods
          .releaseAfterDeadline()
          .accounts({ landlord: connectedPubkey, tenant: tenantPubkey, agreement: agreementPubkey })
          .rpc();
        setTxState((c) => ({ ...c, phase: 'submitted', signature: txSignature, explorerUrl: txExplorerUrl(txSignature), message: 'Submitted. Waiting for confirmation...' }));
        await confirmSignature(connection, txSignature, 'release after deadline', pda);

        setQueue((prev) =>
          prev.map((item) =>
            item.agreement.pda === pda
              ? { ...item, agreement: withAgreementState(item.agreement, 'released', { txSignature }) }
              : item,
          ),
        );
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const openDispute = async (pda: string) => {
    try {
      await withTxFeedback('open dispute', pda, async () => {
        const { anchor, connection, program, connectedPubkey } = await prepareAnchorClient();
        const agreementPubkey = new anchor.web3.PublicKey(pda);
        const evidenceText = evidence[pda] || `${Date.now()}`;
        const evidenceHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(evidenceText));
        const evidenceHashBytes = new Uint8Array(evidenceHashBuf);

        setTxState((c) => ({ ...c, phase: 'signing', message: 'Waiting for wallet signature...' }));
        const txSignature = await program.methods
          .openDispute(1, Array.from(evidenceHashBytes))
          .accounts({ authority: connectedPubkey, agreement: agreementPubkey })
          .rpc();
        setTxState((c) => ({ ...c, phase: 'submitted', signature: txSignature, explorerUrl: txExplorerUrl(txSignature), message: 'Submitted. Waiting for confirmation...' }));
        await confirmSignature(connection, txSignature, 'open dispute', pda);

        const onchain = await (program as any).account.agreement.fetch(agreementPubkey);
        setQueue((prev) =>
          prev.map((item) =>
            item.agreement.pda === pda
              ? { ...item, agreement: buildAgreementView(onchain, pda, txSignature, onchain.state) }
              : item,
          ),
        );
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const resolveDispute = async (pda: string, releaseToLandlord: boolean) => {
    const action = releaseToLandlord ? 'resolve: release' : 'resolve: refund';
    try {
      await withTxFeedback(action, pda, async () => {
        const { anchor, connection, program, connectedPubkey } = await prepareAnchorClient();
        const agreementPubkey = new anchor.web3.PublicKey(pda);
        const onchain = await (program as any).account.agreement.fetch(agreementPubkey);
        const tenantPubkey = new anchor.web3.PublicKey(onchain.tenant.toBase58());
        const landlordPubkey = new anchor.web3.PublicKey(onchain.landlord.toBase58());

        setTxState((c) => ({ ...c, phase: 'signing', message: 'Waiting for wallet signature...' }));
        const txSignature = await program.methods
          .resolveDispute(releaseToLandlord)
          .accounts({
            moderator: connectedPubkey,
            tenant: tenantPubkey,
            landlord: landlordPubkey,
            agreement: agreementPubkey,
          })
          .rpc();
        setTxState((c) => ({ ...c, phase: 'submitted', signature: txSignature, explorerUrl: txExplorerUrl(txSignature), message: 'Submitted. Waiting for confirmation...' }));
        await confirmSignature(connection, txSignature, action, pda);

        setQueue((prev) =>
          prev.map((item) =>
            item.agreement.pda === pda
              ? { ...item, agreement: withAgreementState(item.agreement, releaseToLandlord ? 'released' : 'refunded', { txSignature }) }
              : item,
          ),
        );
      });
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  const renderActions = (item: LandlordAgreementQueueItem) => {
    const { agreement } = item;
    const pda = agreement.pda;
    const state = agreement.state;
    const isThisCardBusy = isBusy && txState.activePda === pda;
    const cardFeedback =
      txState.activePda === pda ? txState : null;

    return (
      <div className="mt-4 space-y-3">
        {cardFeedback && cardFeedback.phase !== 'idle' && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              cardFeedback.phase === 'failed'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-stone-200 bg-stone-50 text-stone-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold capitalize">{cardFeedback.action ?? 'Transaction'}</p>
                <p>{cardFeedback.message ?? 'Working...'}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-medium uppercase tracking-[0.14em]">{cardFeedback.phase}</p>
                {cardFeedback.signature && (
                  <a
                    href={cardFeedback.explorerUrl ?? txExplorerUrl(cardFeedback.signature)}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    View on Explorer
                  </a>
                )}
              </div>
            </div>
            {cardFeedback.signature && (
              <p className="mt-2 break-all text-xs">Signature: {cardFeedback.signature}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {state === 'awaitingLandlordApproval' && (
            <>
              <button
                type="button"
                onClick={() => approveAgreement(pda)}
                disabled={isBusy}
                className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isThisCardBusy && txState.action === 'approve agreement' ? 'Approving...' : 'Approve'}
              </button>
              <button
                type="button"
                onClick={() => cancelAgreement(pda)}
                disabled={isBusy}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isThisCardBusy && txState.action === 'cancel agreement' ? 'Cancelling...' : 'Reject'}
              </button>
            </>
          )}

          {state === 'awaitingFunding' && (
            <button
              type="button"
              onClick={() => cancelAgreement(pda)}
              disabled={isBusy}
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isThisCardBusy && txState.action === 'cancel agreement' ? 'Cancelling...' : 'Cancel'}
            </button>
          )}

          {state === 'funded' && (
            <>
              <button
                type="button"
                onClick={() => releaseAfterDeadline(pda)}
                disabled={isBusy}
                className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isThisCardBusy && txState.action === 'release after deadline'
                  ? 'Releasing...'
                  : 'Release after deadline'}
              </button>
              <button
                type="button"
                onClick={() => openDispute(pda)}
                disabled={isBusy}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isThisCardBusy && txState.action === 'open dispute' ? 'Opening...' : 'Open dispute'}
              </button>
            </>
          )}

          {state === 'disputed' && walletPubkey && (
            <>
              <button
                type="button"
                onClick={() => resolveDispute(pda, true)}
                disabled={isBusy}
                className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isThisCardBusy && txState.action === 'resolve: release'
                  ? 'Releasing...'
                  : 'Release to landlord'}
              </button>
              <button
                type="button"
                onClick={() => resolveDispute(pda, false)}
                disabled={isBusy}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isThisCardBusy && txState.action === 'resolve: refund'
                  ? 'Refunding...'
                  : 'Refund tenant'}
              </button>
              <p className="w-full text-xs text-amber-700">
                Moderator note: The hackathon moderator is a centralized role. Dispute decisions are final and cannot be appealed.
              </p>
            </>
          )}
        </div>

        {state === 'funded' && (
          <div>
            <label className="text-xs font-medium text-stone-500">Evidence (optional)</label>
            <input
              value={evidence[pda] ?? ''}
              onChange={(e) => setEvidence((prev) => ({ ...prev, [pda]: e.target.value }))}
              placeholder="Short description of the dispute"
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">
        Landlord workspace
      </p>
      <div className="mt-2 flex flex-col gap-4 rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">
            Agreement queue
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-500">
            Connect the landlord wallet to load agreements awaiting approval,
            funding, dispute resolution, or deadline release.
          </p>
          {walletPubkey && (
            <p className="mt-3 truncate text-xs text-stone-500">
              Connected wallet:{' '}
              <span className="font-semibold text-stone-700">{walletPubkey}</span>
            </p>
          )}
          {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
        </div>
        <button
          type="button"
          onClick={connectWallet}
          disabled={isBusy}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <KeyRound className="h-4 w-4" />
          {walletPubkey ? 'Refresh queue' : 'Connect landlord wallet'}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        <Building2 className="h-4 w-4 text-emerald-800" />
        <span>
          {walletPubkey
            ? isLoadingQueue
              ? 'Loading landlord agreements...'
              : `${queue.length} agreement${queue.length === 1 ? '' : 's'} linked to this landlord wallet.`
            : 'Connect a landlord wallet to load the agreement queue.'}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {queue.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center text-sm text-stone-500">
            {walletPubkey
              ? 'No on-chain agreements are currently linked to this landlord wallet.'
              : 'Connect a landlord wallet to open the agreement queue.'}
          </div>
        ) : (
          queue.map((item) => {
            const { agreement, listing } = item;
            const agreementOnchain = agreement.onchain as Record<string, any>;
            const tenant = agreementOnchain.tenant?.toBase58?.() ?? 'Unknown';
            const deadline = parseBigNumber(agreementOnchain.inspectionDeadline);
            const depositLamports = parseBigNumber(agreementOnchain.depositLamports);

            return (
              <article
                key={agreement.pda}
                className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">
                      {formatAgreementStateLabel(agreement.state)}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-bold text-stone-900">
                      {listing?.title ?? 'Unknown listing'}
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">
                      {listing?.address ?? 'No matching local listing metadata found.'}
                    </p>
                  </div>
                  <a
                    href={addressExplorerUrl(agreement.pda)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600"
                  >
                    View PDA
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="mt-4 grid gap-3 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Tenant
                    </p>
                    <p className="mt-1 break-all">{tenant}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Deposit
                    </p>
                    <p className="mt-1">
                      {(depositLamports / LAMPORTS_PER_SOL).toFixed(2)} SOL
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Deadline
                    </p>
                    <p className="mt-1 inline-flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-emerald-800" />
                      {deadline
                        ? new Date(deadline * 1000).toLocaleString()
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                {renderActions(item)}
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
