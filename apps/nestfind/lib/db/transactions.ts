import type { TransactionRecord } from '@/types/escrow-persistence';
import { getEscrowCollection, isEscrowPersistenceEnabled } from './escrow-collection';

function txDocId(agreementPda: string, signature: string): string {
  return `escrow::tx::${agreementPda}::${signature}`;
}

export async function listTransactions(
  agreementPda: string,
): Promise<TransactionRecord[]> {
  if (!isEscrowPersistenceEnabled()) return [];
  const collection = await getEscrowCollection();

  const query = `SELECT d.* FROM \`${process.env.COUCHBASE_BUCKET || 'nestfind'}\`.\`${process.env.COUCHBASE_SCOPE || '_default'}\`.\`${process.env.COUCHBASE_ESCROW_COLLECTION || 'listings'}\` d WHERE d.type = 'escrowTransaction' AND d.agreementPda = '${agreementPda}' ORDER BY d.submittedAt DESC`;

  const result = await collection.cluster.query(query);
  return result.rows as TransactionRecord[];
}

export async function appendTransaction(
  agreementPda: string,
  record: Omit<TransactionRecord, 'type' | 'agreementPda'>,
): Promise<TransactionRecord> {
  const doc: TransactionRecord = {
    type: 'escrowTransaction',
    agreementPda,
    ...record,
  };
  const collection = await getEscrowCollection();
  await collection.upsert(txDocId(agreementPda, record.signature), doc);
  return doc;
}
