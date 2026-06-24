import type { PersistedAgreement, AgreementListFilter } from '@/types/escrow-persistence';
import { getEscrowCollection, isEscrowPersistenceEnabled } from './escrow-collection';

const DOC_PREFIX = 'escrow::agreement::';

function agreementDocId(pda: string): string {
  return `${DOC_PREFIX}${pda}`;
}

export async function getAgreement(pda: string): Promise<PersistedAgreement | null> {
  if (!isEscrowPersistenceEnabled()) return null;
  try {
    const collection = await getEscrowCollection();
    const result = await collection.get(agreementDocId(pda));
    return result.content as PersistedAgreement;
  } catch {
    return null;
  }
}

export async function listAgreements(
  filter: AgreementListFilter = {},
): Promise<PersistedAgreement[]> {
  if (!isEscrowPersistenceEnabled()) return [];
  const collection = await getEscrowCollection();

  const query = `SELECT d.* FROM \`${process.env.COUCHBASE_BUCKET || 'nestfind'}\`.\`${process.env.COUCHBASE_SCOPE || '_default'}\`.\`${process.env.COUCHBASE_ESCROW_COLLECTION || 'listings'}\` d WHERE d.type = 'escrowAgreement'${filter.state ? ` AND d.state = '${filter.state}'` : ''}${filter.wallet ? ` AND (d.tenantWallet = '${filter.wallet}' OR d.landlordWallet = '${filter.wallet}')` : ''} ORDER BY d.createdAt DESC`;

  const result = await collection.cluster.query(query);
  return result.rows as PersistedAgreement[];
}

export async function upsertAgreement(
  pda: string,
  data: Omit<PersistedAgreement, 'type' | 'pda'>,
): Promise<PersistedAgreement> {
  const doc: PersistedAgreement = {
    type: 'escrowAgreement',
    pda,
    ...data,
  };
  const collection = await getEscrowCollection();
  await collection.upsert(agreementDocId(pda), doc);
  return doc;
}

export async function updateAgreementState(
  pda: string,
  state: PersistedAgreement['state'],
  lastTxSignature?: string,
): Promise<void> {
  const existing = await getAgreement(pda);
  if (!existing) return;
  const updated: PersistedAgreement = {
    ...existing,
    state,
    lastIndexedAt: new Date().toISOString(),
    ...(lastTxSignature ? { lastTxSignature } : {}),
  };
  const collection = await getEscrowCollection();
  await collection.upsert(agreementDocId(pda), updated);
}
