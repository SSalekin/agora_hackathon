"use client";

import { useEffect, useRef, useState } from 'react';
import type { ApartmentListing } from '@/types/listing';
import { DEFAULT_CLUSTER } from '@/types/solana-wallet';
import {
  buildAgreementView,
  decodeAgreementState,
  formatAgreementStateLabel,
  withAgreementState,
  persistCreateAgreement,
  persistAgreementAction,
  persistDisputeEvidence,
  type AgreementUiState,
  type AgreementView,
} from '@/lib/escrow';
import { usePhantomWallet } from '@/hooks/use-phantom-wallet';
import { checkNetwork, checkBalance, formatWalletError } from '@/lib/preflight';
import {
  prepareAnchorClient,
  deriveAgreementPda,
  deriveConfigPda,
  deriveLandlordProfilePda,
  sha256Bytes,
  sha256Hex,
  bytesToHex,
  explorerUrl,
} from '@/lib/solana';
import { useLandlordProfile } from '@/hooks/use-landlord-profile';
import { LandlordReputationPanel } from '@/components/landlord/LandlordReputationPanel';

const LAMPORTS_PER_SOL = 1_000_000_000;
const PROGRAM_ID = '9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X';

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
  const [depositSol, setDepositSol] = useState<string>(String(listing.defaultDepositSol));
  const [inspectionDate, setInspectionDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + listing.defaultInspectionDays);
    return d.toISOString().slice(0, 16);
  });
  const [agreement, setAgreement] = useState<AgreementView | null>(null);
  const [txState, setTxState] = useState<TxState>(INITIAL_TX_STATE);
  const [error, setError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<string>('');
  const [isLoadingAgreement, setIsLoadingAgreement] = useState(false);
  const [pdaPreview, setPdaPreview] = useState<{ listingHash: string; agreementPda: string } | null>(null);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);

  const landlordWallet = listing.landlordWallet;
  const isLandlordValid = isValidSolanaPubkey(landlordWallet);
  const { profile: landlordProfile, totalStakedSol, activeStakeSol, hasMinimumStake } = useLandlordProfile(landlordWallet);
  const isBusy = txState.phase !== 'idle' && txState.phase !== 'confirmed' && txState.phase !== 'failed';
  const agreementOnchain = agreement?.onchain as Record<string, { toBase58?: () => string }> | null;
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
    } catch (err: unknown) {
      const message = formatWalletError(err);
      setTxFailure(action, message);
      throw err;
    }
  };

  const prepareClient = async () => {
    const client = await prepareAnchorClient();
    const landlordPubkey = new client.PublicKey(landlordWallet);
    const listingHashBytes = await sha256Bytes(listing.id);
    const agreementPda = await deriveAgreementPda(
      client.connectedPubkey,
      landlordPubkey,
      listingHashBytes,
      client.program.programId,
    );
    return { ...client, landlordPubkey, listingHashBytes, agreementPda };
  };

  const getAgreementActors = async () => {
    const client = await prepareAnchorClient();
    if (!agreement || !agreementOnchain) throw new Error('No agreement loaded');

    const tenantPubkey = new client.PublicKey(agreementOnchain.tenant!.toBase58!());
    const landlordPubkey = new client.PublicKey(agreementOnchain.landlord!.toBase58!());
    const moderatorPubkey = new client.PublicKey(agreementOnchain.moderator!.toBase58!());
    const agreementPda = new client.PublicKey(agreement.pda);

    return {
      ...client,
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
      const listingHashHexValue = await sha256Hex(listing.id);
      const allAgreements = await (program as any).account.agreement.all();

      const matchingAgreement = allAgreements
        .map((item: { publicKey: { toBase58(): string }; account: Record<string, unknown> }) => ({
          publicKey: item.publicKey,
          account: item.account,
        }))
        .filter(({ account }: { account: Record<string, { toBase58?: () => string } | unknown> }) => {
          const rawHash = account.listingHash;
          if (!rawHash || !(rawHash instanceof Uint8Array) && !Array.isArray(rawHash)) return false;
          const accountListingHashHex = bytesToHex(Uint8Array.from(rawHash as ArrayLike<number>));
          if (accountListingHashHex !== listingHashHexValue) return false;

          const connectedBase58 = connectedPubkey.toBase58();
          const acct = account as Record<string, { toBase58?: () => string }>;
          return (
            acct.tenant?.toBase58?.() === connectedBase58 ||
            acct.landlord?.toBase58?.() === connectedBase58 ||
            acct.moderator?.toBase58?.() === connectedBase58
          );
        })
        .sort((a: { account: Record<string, unknown> }, b: { account: Record<string, unknown> }) => {
          const aCreatedAt = typeof a.account.createdAt === 'object' ? Number((a.account.createdAt as { toString(): string }).toString()) : Number(a.account.createdAt ?? 0);
          const bCreatedAt = typeof b.account.createdAt === 'object' ? Number((b.account.createdAt as { toString(): string }).toString()) : Number(b.account.createdAt ?? 0);
          return bCreatedAt - aCreatedAt;
        })[0];

      if (!matchingAgreement) {
        setAgreement(null);
        return;
      }

      setAgreement(
        buildAgreementView(
          matchingAgreement.account,
          matchingAgreement.publicKey.toBase58(),
          null,
          (matchingAgreement.account as Record<string, unknown>).state,
        ),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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
      // Check network.
      (async () => {
        try {
          const { connection } = await prepareAnchorClient();
          const result = await checkNetwork(connection, DEFAULT_CLUSTER);
          setNetworkWarning(result.ok ? null : result.error ?? null);
        } catch {
          setNetworkWarning(null);
        }
      })();

      loadExistingAgreement().catch(() => {});
      // Derive PDA preview for display.
      (async () => {
        try {
          const { PublicKey, connectedPubkey } = await prepareAnchorClient();
          const landlordPubkey = new PublicKey(landlordWallet);
          const listingHashBuf = await sha256Bytes(listing.id);
          const listingHashHexStr = bytesToHex(listingHashBuf);
          const programId = new PublicKey(PROGRAM_ID);
          const agreementPda = await deriveAgreementPda(connectedPubkey, landlordPubkey, listingHashBuf, programId);
          setPdaPreview({ listingHash: listingHashHexStr, agreementPda: agreementPda.toBase58() });
        } catch {
          // PDA preview is informational only; ignore derivation errors.
        }
      })();
    } else {
      setPdaPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletPubkey, listing.id]);

  const createAgreement = async () => {
    try {
      return await withTxFeedback('create agreement', async () => {
        if (!isLandlordValid) {
          throw new Error('Listing has an invalid landlord wallet address. Cannot create agreement.');
        }

        const { anchor, connection, program, connectedPubkey, PublicKey, landlordPubkey, listingHashBytes, agreementPda } = await prepareClient();

        // --- Role separation ---
        if (connectedPubkey.equals(landlordPubkey)) {
          throw new Error('Tenant and landlord wallets must be different. Connect a different wallet or choose a listing with a different landlord.');
        }

        // Check tenant != moderator and landlord != moderator.
        const configPda = await deriveConfigPda(program.programId);
        const configAccount = await (program as any).account.config.fetch(configPda);
        const moderatorPubkey = new PublicKey(configAccount.moderator);
        if (connectedPubkey.equals(moderatorPubkey)) {
          throw new Error('Connected wallet is the moderator. The tenant cannot also be the moderator.');
        }
        if (landlordPubkey.equals(moderatorPubkey)) {
          throw new Error('This listing\'s landlord is the moderator. Choose a listing with a different landlord.');
        }

        // --- SOL amount precision ---
        const depositInput = depositSol.trim();
        const depositNumber = Number(depositInput);
        if (!depositInput || !Number.isFinite(depositNumber)) {
          throw new Error('Enter a valid deposit amount in SOL.');
        }
        const decimalPart = depositInput.includes('.') ? depositInput.split('.')[1] ?? '' : '';
        if (decimalPart.length > 9) {
          throw new Error('SOL amount has too many decimals. Maximum is 9 decimal places (1 lamport).');
        }
        const depositLamports = Math.round(depositNumber * LAMPORTS_PER_SOL);
        if (depositLamports <= 0) {
          throw new Error('Deposit amount must be greater than zero.');
        }
        if (depositLamports > 100 * LAMPORTS_PER_SOL) {
          throw new Error('Deposit amount exceeds maximum (100 SOL). Use a smaller amount.');
        }

        // --- Future deadline ---
        const inspectionDeadline = inspectionDate ? Math.floor(new Date(inspectionDate).getTime() / 1000) : 0;
        if (!inspectionDeadline) {
          throw new Error('Inspection deadline is required.');
        }
        const nowSec = Math.floor(Date.now() / 1000);
        if (inspectionDeadline <= nowSec) {
          throw new Error('Inspection deadline must be in the future.');
        }
        const minDeadline = nowSec + 3600; // at least 1 hour from now
        if (inspectionDeadline < minDeadline) {
          throw new Error('Inspection deadline must be at least 1 hour from now.');
        }

        // --- Listing configuration ---
        if (!listing.id || !listing.title || !listing.address) {
          throw new Error('Listing is missing required fields (id, title, address).');
        }
        if (!listing.landlordWallet) {
          throw new Error('Listing is missing a landlord wallet address.');
        }

        // --- Insufficient balance ---
        const balanceResult = await checkBalance(connection, connectedPubkey, depositLamports);
        if (!balanceResult.ok) {
          throw new Error(balanceResult.error);
        }

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
        persistCreateAgreement(listing.id, agreementPda.toBase58(), txSignature, explorerUrl(txSignature), onchain);
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  };

  const fundAgreement = async () => {
    try {
      return await withTxFeedback('fund agreement', async () => {
        if (!agreement) throw new Error('No agreement to fund');
        const { anchor, connection, program, tenantPubkey, agreementPda } = await getAgreementActors();

        // Pre-flight: verify agreement state is awaiting funding.
        const freshOnchain = await (program as any).account.agreement.fetch(agreementPda);
        const freshState = decodeAgreementState(freshOnchain.state);
        if (freshState !== 'awaitingFunding') {
          throw new Error(`Agreement is not awaiting funding. Current state: ${formatAgreementStateLabel(freshState)}.`);
        }

        // Pre-flight: verify inspection deadline has not passed.
        const deadline = typeof freshOnchain.inspectionDeadline === 'object'
          ? Number(freshOnchain.inspectionDeadline.toString())
          : Number(freshOnchain.inspectionDeadline ?? 0);
        if (deadline > 0 && Math.floor(Date.now() / 1000) > deadline) {
          throw new Error('Inspection deadline has passed. The agreement can no longer be funded.');
        }

        // Pre-flight: verify caller is the tenant.
        const onchainTenant = freshOnchain.tenant?.toBase58?.();
        if (onchainTenant !== tenantPubkey.toBase58()) {
          throw new Error('Connected wallet is not the tenant for this agreement.');
        }

        // Pre-flight: check balance covers deposit + fees.
        const depositLamports = typeof freshOnchain.depositLamports === 'object'
          ? Number(freshOnchain.depositLamports.toString())
          : Number(freshOnchain.depositLamports ?? 0);
        const balanceResult = await checkBalance(connection, tenantPubkey, depositLamports);
        if (!balanceResult.ok) {
          throw new Error(balanceResult.error);
        }

        setTxState({ phase: 'signing', action: 'fund agreement', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .fundAgreement()
          .accounts({ tenant: tenantPubkey, agreement: agreementPda, systemProgram: anchor.web3.SystemProgram.programId })
          .rpc();
        setTxState({ phase: 'submitted', action: 'fund agreement', signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, 'fund agreement');

        const onchain = await (program as any).account.agreement.fetch(agreementPda);
        setAgreement(buildAgreementView(onchain, agreementPda.toBase58(), txSignature, onchain.state));
        persistAgreementAction('fund', agreement.pda, txSignature, explorerUrl(txSignature), decodeAgreementState(onchain.state));
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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
        persistAgreementAction('cancel', agreement.pda, txSignature, explorerUrl(txSignature), 'cancelled');
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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
        persistAgreementAction('release', agreement.pda, txSignature, explorerUrl(txSignature), 'released');
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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
        persistAgreementAction('dispute', agreement.pda, txSignature, explorerUrl(txSignature), 'disputed');
        if (evidence) {
          persistDisputeEvidence(agreement.pda, evidence, connectedPubkey.toBase58());
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    }
  };

  const approveAgreement = async () => {
    try {
      return await withTxFeedback('approve agreement', async () => {
        const { connection, program, landlordPubkey, agreementPda } = await getAgreementActors();
        const profilePda = await deriveLandlordProfilePda(landlordPubkey, program.programId);
        setTxState({ phase: 'signing', action: 'approve agreement', signature: null, explorerUrl: null, message: 'Waiting for wallet signature...' });
        const txSignature = await program.methods
          .approveAgreement()
          .accounts({ landlord: landlordPubkey, landlordProfile: profilePda, agreement: agreementPda })
          .rpc();
        setTxState({ phase: 'submitted', action: 'approve agreement', signature: txSignature, explorerUrl: explorerUrl(txSignature), message: 'Transaction submitted. Waiting for confirmation...' });
        await confirmSignature(connection, txSignature, 'approve agreement');
        const onchain = await (program as any).account.agreement.fetch(agreementPda);
        setAgreement(buildAgreementView(onchain, agreementPda.toBase58(), txSignature, onchain.state));
        if (agreement) persistAgreementAction('approve', agreement.pda, txSignature, explorerUrl(txSignature), decodeAgreementState(onchain.state));
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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
        persistAgreementAction('releaseAfterDeadline', agreement.pda, txSignature, explorerUrl(txSignature), 'released');
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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
        persistAgreementAction('resolve', agreement.pda, txSignature, explorerUrl(txSignature), releaseToLandlord ? 'released' : 'refunded');
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
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
            <p className="font-semibold text-blue-600">{listing.monthlyRentVnd.toLocaleString()} VND</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium">Connected wallet</label>
            <div className="mt-1 flex items-center gap-2">
              <input value={walletPubkey ?? ''} readOnly placeholder="Not connected" className="flex-1 rounded-md border px-3 py-2 text-sm" />
              <button type="button" onClick={connectWallet} disabled={isBusy} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Connect</button>
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

        {pdaPreview && (
          <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
            <p className="font-semibold text-stone-700">On-chain preview</p>
            <p className="mt-1 break-all">Listing hash: <span className="font-mono text-stone-500">{pdaPreview.listingHash}</span></p>
            <p className="mt-1 break-all">Agreement PDA: <span className="font-mono text-stone-500">{pdaPreview.agreementPda}</span></p>
          </div>
        )}

        {isLandlordValid && landlordProfile.exists && (
          <LandlordReputationPanel
            profile={landlordProfile}
            totalStakedSol={totalStakedSol}
            activeStakeSol={activeStakeSol}
            hasMinimumStake={hasMinimumStake}
          />
        )}

        {isLandlordValid && !landlordProfile.exists && connectedRole === 'tenant' && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This landlord has no on-chain stake profile. They must stake at least 0.0001 SOL before they can approve agreements.
          </div>
        )}

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
              className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
              <button type="button" onClick={approveAgreement} disabled={isBusy || agreement.state !== 'awaitingLandlordApproval' || connectedRole !== 'landlord'} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {txState.action === 'approve agreement' && isBusy ? 'Approving…' : 'Approve'}
              </button>
              <button type="button" onClick={fundAgreement} disabled={isBusy || agreement.state !== 'awaitingFunding' || connectedRole !== 'tenant'} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
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
              {(connectedRole === 'moderator' || agreement.state === 'disputed') && (
                <p className="mt-2 text-xs text-amber-700">
                  Moderator note: The hackathon moderator is a centralized role. Dispute decisions are final and cannot be appealed.
                </p>
              )}
            </div>
          </div>
        )}

        {networkWarning && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {networkWarning}
          </div>
        )}

        {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
      </div>
    </div>
  );
}
