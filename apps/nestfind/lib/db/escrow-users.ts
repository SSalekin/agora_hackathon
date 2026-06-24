import type { EscrowUser } from '@/types/escrow-persistence';
import { getEscrowCollection, isEscrowPersistenceEnabled } from './escrow-collection';

function userDocId(wallet: string): string {
  return `escrow::user::${wallet}`;
}

export async function getEscrowUser(wallet: string): Promise<EscrowUser | null> {
  if (!isEscrowPersistenceEnabled()) return null;
  try {
    const collection = await getEscrowCollection();
    const result = await collection.get(userDocId(wallet));
    return result.content as EscrowUser;
  } catch {
    return null;
  }
}

export async function upsertEscrowUser(
  wallet: string,
  data: Omit<EscrowUser, 'type' | 'wallet' | 'createdAt'>,
): Promise<EscrowUser> {
  const doc: EscrowUser = {
    type: 'escrowUser',
    wallet,
    displayName: data.displayName,
    role: data.role,
    createdAt: new Date().toISOString(),
  };
  const collection = await getEscrowCollection();
  await collection.upsert(userDocId(wallet), doc);
  return doc;
}
