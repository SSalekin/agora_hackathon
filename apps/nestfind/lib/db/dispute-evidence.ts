import type { DisputeEvidence } from '@/types/escrow-persistence';
import { getEscrowCollection, isEscrowPersistenceEnabled } from './escrow-collection';

function evidenceDocId(agreementPda: string): string {
  return `escrow::evidence::${agreementPda}`;
}

export async function getEvidence(
  agreementPda: string,
): Promise<DisputeEvidence | null> {
  if (!isEscrowPersistenceEnabled()) return null;
  try {
    const collection = await getEscrowCollection();
    const result = await collection.get(evidenceDocId(agreementPda));
    return result.content as DisputeEvidence;
  } catch {
    return null;
  }
}

export async function upsertEvidence(
  agreementPda: string,
  data: Omit<DisputeEvidence, 'type' | 'agreementPda' | 'submittedAt'>,
): Promise<DisputeEvidence> {
  const doc: DisputeEvidence = {
    type: 'disputeEvidence',
    agreementPda,
    ...data,
    submittedAt: new Date().toISOString(),
  };
  const collection = await getEscrowCollection();
  await collection.upsert(evidenceDocId(agreementPda), doc);
  return doc;
}

export async function verifyEvidenceHash(
  agreementPda: string,
  onChainHashHex: string,
): Promise<{ matched: boolean; stored: DisputeEvidence | null }> {
  const stored = await getEvidence(agreementPda);
  if (!stored) return { matched: false, stored: null };
  return { matched: stored.evidenceHash === onChainHashHex, stored };
}
