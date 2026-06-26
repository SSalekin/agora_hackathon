'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, CalendarClock, ExternalLink, KeyRound, Search, Shield, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { ApartmentListing } from '@/types/listing';
import { DEFAULT_CLUSTER } from '@/types/solana-wallet';
import { buildAgreementView, formatAgreementStateLabel, withAgreementState, persistAgreementAction, type AgreementView } from '@/lib/escrow';
import { usePhantomWallet } from '@/hooks/use-phantom-wallet';
import { useLandlordProfile } from '@/hooks/use-landlord-profile';
import { checkNetwork, formatWalletError } from '@/lib/preflight';
import { prepareAnchorClient, sha256Hex, explorerUrl } from '@/lib/solana';
import { LandlordRiskPanel } from '@/components/moderator/LandlordRiskPanel';

const LAMPORTS_PER_SOL = 1_000_000_000;

type Props = {
  listings: ApartmentListing[];
};

type DisputedAgreementItem = {
  agreement: AgreementView<Record<string, unknown>>;
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
  return explorerUrl(signature, 'tx');
}

function addressExplorerUrl(address: string) {
  return explorerUrl(address, 'address');
}

function parseBigNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toString' in value) {
    return Number((value as { toString(): string }).toString());
  }
  return 0;
}

function LandlordLookupSection() {
  const [lookupWallet, setLookupWallet] = useState('');
  const [resolvedWallet, setResolvedWallet] = useState<string | null>(null);
  const { profile, totalStakedSol, activeStakeSol, hasMinimumStake } = useLandlordProfile(resolvedWallet);

  const handleLookup = () => {
    const trimmed = lookupWallet.trim();
    if (trimmed.length >= 32) setResolvedWallet(trimmed);
  };

  return (
    <div className="rounded-[1.75rem] border border-border bg-background p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
        Landlord Lookup
      </p>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Enter a landlord wallet address to view their on-chain stake profile and risk assessment.
      </p>
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={lookupWallet}
            onChange={(e) => setLookupWallet(e.target.value)}
            placeholder="Paste a Solana wallet address..."
            className="h-11 w-full rounded-xl border border-border bg-muted pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleLookup}
          disabled={!lookupWallet.trim() || lookupWallet.trim().length < 32}
          className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Lookup
        </button>
      </div>
      {resolvedWallet && (
        <div className="mt-4">
          <LandlordRiskPanel
            wallet={resolvedWallet}
            profile={profile}
            totalStakedSol={totalStakedSol}
            activeStakeSol={activeStakeSol}
            hasMinimumStake={hasMinimumStake}
          />
        </div>
      )}
    </div>
  );
}

export function ModeratorDashboard({ listings }: Props) {
  const { publicKey: walletPubkey, connect } = usePhantomWallet();
  const [disputed, setDisputed] = useState<DisputedAgreementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txState, setTxState] = useState<TxState>(INITIAL_TX_STATE);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);

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
    } catch (err: unknown) {
      const message = formatWalletError(err);
      setTxFailure(action, pda, message);
      throw err;
    }
  };

  const loadDisputedAgreements = async (connectedWallet?: string | null) => {
    if (!connectedWallet) return;
    try {
      setIsLoading(true);
      setError(null);

      const { program } = await prepareAnchorClient();
      const listingHashMap = await listingHashMapPromise;

      const allAgreements = await (program as any).account.agreement.all();
      const disputedAgreements = allAgreements
        .filter((item: any) => {
          const state = decodeState(item.account.state);
          return state === 'disputed';
        })
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

      setDisputed(disputedAgreements);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const prevPubkeyRef = useRef<string | null>(walletPubkey);
  useEffect(() => {
    const prev = prevPubkeyRef.current;
    const curr = walletPubkey;
    prevPubkeyRef.current = curr;

    if (prev && !curr) {
      setDisputed([]);
      clearTxState();
      setError(null);
      return;
    }

    if (curr) {
      (async () => {
        try {
          const { connection } = await prepareAnchorClient();
          const result = await checkNetwork(connection, DEFAULT_CLUSTER);
          setNetworkWarning(result.ok ? null : result.error ?? null);
        } catch {
          setNetworkWarning(null);
        }
      })();

      loadDisputedAgreements(curr).catch(() => {});
    }
  }, [walletPubkey]);

  const connectWallet = async () => {
    setError(null);
    try {
      await connect();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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

        setDisputed((prev) =>
          prev.map((item) =>
            item.agreement.pda === pda
              ? { ...item, agreement: withAgreementState(item.agreement, releaseToLandlord ? 'released' : 'refunded', { txSignature }) }
              : item,
          ),
        );
        persistAgreementAction(releaseToLandlord ? 'resolve:release' : 'resolve:refund', pda, txSignature, txExplorerUrl(txSignature), releaseToLandlord ? 'released' : 'refunded');
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
        Moderator workspace
      </p>
      <div className="mt-2 flex flex-col gap-4 rounded-[1.75rem] border border-border bg-background p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">
            Dispute resolution
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Connect the moderator wallet to review disputed agreements and resolve
            deposit disputes between tenants and landlords.
          </p>
          {walletPubkey && (
            <p className="mt-3 truncate text-xs text-muted-foreground">
              Connected wallet:{' '}
              <span className="font-semibold text-foreground">{walletPubkey}</span>
            </p>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        <button
          type="button"
          onClick={connectWallet}
          disabled={isBusy}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <KeyRound className="h-4 w-4" />
          {walletPubkey ? 'Refresh disputes' : 'Connect moderator wallet'}
        </button>
      </div>

      <div className="mt-6">
        <LandlordLookupSection />
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-primary" />
        <span>
          {walletPubkey
            ? isLoading
              ? 'Loading disputed agreements...'
              : `${disputed.length} disputed agreement${disputed.length === 1 ? '' : 's'} found across all landlords.`
            : 'Connect a moderator wallet to view disputed agreements.'}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {disputed.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-background/60 px-6 py-14 text-center text-sm text-muted-foreground">
            {walletPubkey
              ? 'No disputed agreements found. All clear.'
              : 'Connect a moderator wallet to view disputed agreements.'}
          </div>
        ) : (
          disputed.map((item) => {
            const { agreement, listing } = item;
            const agreementOnchain = agreement.onchain as Record<string, { toBase58?: () => string }>;
            const tenant = agreementOnchain.tenant?.toBase58?.() ?? 'Unknown';
            const landlord = agreementOnchain.landlord?.toBase58?.() ?? 'Unknown';
            const deadline = parseBigNumber((agreementOnchain as Record<string, unknown>).inspectionDeadline);
            const depositLamports = parseBigNumber((agreementOnchain as Record<string, unknown>).depositLamports);

            return (
              <DisputedCard
                key={agreement.pda}
                agreement={agreement}
                listing={listing}
                tenant={tenant}
                landlord={landlord}
                deadline={deadline}
                depositLamports={depositLamports}
                isBusy={isBusy}
                txState={txState}
                onResolve={resolveDispute}
              />
            );
          })
        )}
      </div>

      {networkWarning && (
        <div className="mt-6 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {networkWarning}
        </div>
      )}
    </main>
  );
}

function DisputedCard({
  agreement,
  listing,
  tenant,
  landlord,
  deadline,
  depositLamports,
  isBusy,
  txState,
  onResolve,
}: {
  agreement: AgreementView<Record<string, unknown>>;
  listing: ApartmentListing | null;
  tenant: string;
  landlord: string;
  deadline: number;
  depositLamports: number;
  isBusy: boolean;
  txState: TxState;
  onResolve: (pda: string, releaseToLandlord: boolean) => void;
}) {
  const { profile, totalStakedSol, activeStakeSol, hasMinimumStake } = useLandlordProfile(landlord);
  const pda = agreement.pda;
  const isThisCardBusy = isBusy && txState.activePda === pda;
  const cardFeedback = txState.activePda === pda ? txState : null;

  return (
    <article className="rounded-[1.75rem] border border-border bg-background p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-destructive">
            {formatAgreementStateLabel(agreement.state)}
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-foreground">
            {listing?.title ?? 'Unknown listing'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {listing?.address ?? 'No matching local listing metadata found.'}
          </p>
        </div>
        <a
          href={addressExplorerUrl(agreement.pda)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
        >
          View PDA
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tenant
          </p>
          <p className="mt-1 break-all">{tenant}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Landlord
          </p>
          <p className="mt-1 break-all">{landlord}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Deposit
          </p>
          <p className="mt-1">
            {(depositLamports / LAMPORTS_PER_SOL).toFixed(2)} SOL
          </p>
        </div>
      </div>

      <div className="mt-4">
        <LandlordRiskPanel
          wallet={landlord}
          profile={profile}
          totalStakedSol={totalStakedSol}
          activeStakeSol={activeStakeSol}
          hasMinimumStake={hasMinimumStake}
        />
      </div>

      {cardFeedback && cardFeedback.phase !== 'idle' && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            cardFeedback.phase === 'failed'
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-border bg-muted text-foreground'
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

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onResolve(pda, true)}
          disabled={isBusy}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isThisCardBusy && txState.action === 'resolve: release' ? 'Releasing...' : 'Release to landlord'}
        </button>
        <button
          type="button"
          onClick={() => onResolve(pda, false)}
          disabled={isBusy}
          className="rounded-xl border border-stone-300 px-4 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isThisCardBusy && txState.action === 'resolve: refund' ? 'Refunding...' : 'Refund tenant'}
        </button>
      </div>
      <p className="mt-2 text-xs text-warning">
        Moderator note: The hackathon moderator is a centralized role. Dispute decisions are final and cannot be appealed.
      </p>
    </article>
  );
}

function decodeState(value: unknown): string {
  if (typeof value === 'string') return value.replace(/[^a-z]/gi, '').toLowerCase();
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 1) return entries[0][0].replace(/[^a-z]/gi, '').toLowerCase();
  }
  return '';
}
