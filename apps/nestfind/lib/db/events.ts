import type { IndexedEvent } from '@/types/escrow-persistence';
import { getEscrowCollection, isEscrowPersistenceEnabled } from './escrow-collection';

function eventDocId(agreementPda: string, slot: number, eventName: string): string {
  return `escrow::event::${agreementPda}::${slot}::${eventName}`;
}

export async function listEvents(agreementPda: string): Promise<IndexedEvent[]> {
  if (!isEscrowPersistenceEnabled()) return [];
  const collection = await getEscrowCollection();

  const query = `SELECT d.* FROM \`${process.env.COUCHBASE_BUCKET || 'nestfind'}\`.\`${process.env.COUCHBASE_SCOPE || '_default'}\`.\`${process.env.COUCHBASE_ESCROW_COLLECTION || 'listings'}\` d WHERE d.type = 'indexedEvent' AND d.agreementPda = $agreementPda ORDER BY d.slot ASC`;

  const result = await collection.cluster.query(query, { parameters: { agreementPda } });
  return result.rows as IndexedEvent[];
}

export async function appendEvent(
  agreementPda: string,
  eventName: string,
  data: Record<string, unknown>,
  slot: number,
): Promise<IndexedEvent> {
  const doc: IndexedEvent = {
    type: 'indexedEvent',
    agreementPda,
    eventName,
    slot,
    data,
    indexedAt: new Date().toISOString(),
  };
  const collection = await getEscrowCollection();
  await collection.upsert(eventDocId(agreementPda, slot, eventName), doc);
  return doc;
}
