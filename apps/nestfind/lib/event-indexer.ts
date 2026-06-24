import idl from '@/idl/escrow.json';
import { decodeAgreementState, type AgreementUiState } from '@/lib/escrow';
import { getAgreement, upsertAgreement, updateAgreementState } from '@/lib/db/agreements';
import { appendEvent } from '@/lib/db/events';
import { isEscrowPersistenceEnabled } from '@/lib/db/escrow-collection';

const LAMPORTS_PER_SOL = 1_000_000_000;
const DEFAULT_RPC_URL =
  (process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string) || 'https://api.devnet.solana.com';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseBigNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toString' in value) {
    return Number((value as { toString(): string }).toString());
  }
  return 0;
}

function unixToIso(unix: number): string {
  return new Date(unix * 1000).toISOString();
}

type IndexerResult = {
  agreementsScanned: number;
  agreementsCreated: number;
  agreementsUpdated: number;
  eventsPersisted: number;
  errors: string[];
};

export async function runIndexer(): Promise<IndexerResult> {
  if (!isEscrowPersistenceEnabled()) {
    return { agreementsScanned: 0, agreementsCreated: 0, agreementsUpdated: 0, eventsPersisted: 0, errors: ['Escrow persistence not enabled'] };
  }

  const result: IndexerResult = {
    agreementsScanned: 0,
    agreementsCreated: 0,
    agreementsUpdated: 0,
    eventsPersisted: 0,
    errors: [],
  };

  try {
    const Anchor = await import('@anchor-lang/core');
    const anchor = Anchor as typeof import('@anchor-lang/core');
    const connection = new anchor.web3.Connection(DEFAULT_RPC_URL, 'confirmed');
    const program = new anchor.Program(idl as any, { connection } as any);

    const allAgreements = await (program as any).account.agreement.all();

    for (const item of allAgreements) {
      try {
        const pda = item.publicKey.toBase58();
        const account = item.account;
        result.agreementsScanned++;

        const onchainState: AgreementUiState = decodeAgreementState(account.state);
        const tenantWallet = account.tenant?.toBase58?.() ?? '';
        const landlordWallet = account.landlord?.toBase58?.() ?? '';
        const listingHash = bytesToHex(Uint8Array.from(account.listingHash));
        const depositLamports = parseBigNumber(account.depositLamports);
        const inspectionDeadline = parseBigNumber(account.inspectionDeadline);
        const createdAt = parseBigNumber(account.createdAt);
        const fundedAt = parseBigNumber(account.fundedAt);

        const existing = await getAgreement(pda);

        if (!existing) {
          await upsertAgreement(pda, {
            listingId: '',
            listingHash,
            tenantWallet,
            landlordWallet,
            depositSol: depositLamports / LAMPORTS_PER_SOL,
            depositLamports,
            inspectionDeadline: unixToIso(inspectionDeadline),
            createdAt: createdAt > 0 ? unixToIso(createdAt) : new Date().toISOString(),
            fundedAt: fundedAt > 0 ? unixToIso(fundedAt) : null,
            state: onchainState,
            lastIndexedAt: new Date().toISOString(),
            lastTxSignature: null,
          });
          result.agreementsCreated++;

          await appendEvent(pda, 'AgreementCreated', {
            tenant: tenantWallet,
            landlord: landlordWallet,
            listingHash,
            depositLamports,
            inspectionDeadline,
          }, 0);
          result.eventsPersisted++;
        } else if (existing.state !== onchainState) {
          await updateAgreementState(pda, onchainState);
          result.agreementsUpdated++;

          await appendEvent(pda, 'StateReconciled', {
            from: existing.state,
            to: onchainState,
          }, 0);
          result.eventsPersisted++;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(msg);
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`Indexer initialization failed: ${msg}`);
  }

  return result;
}
