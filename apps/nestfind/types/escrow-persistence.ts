import type { AgreementUiState } from '@/lib/escrow';

export type EscrowUser = {
  type: 'escrowUser';
  wallet: string;
  displayName: string;
  role: 'tenant' | 'landlord' | 'moderator';
  createdAt: string;
};

export type PersistedAgreement = {
  type: 'escrowAgreement';
  pda: string;
  listingId: string;
  listingHash: string;
  tenantWallet: string;
  landlordWallet: string;
  depositSol: number;
  depositLamports: number;
  inspectionDeadline: string;
  createdAt: string;
  fundedAt: string | null;
  state: AgreementUiState;
  lastIndexedAt: string;
  lastTxSignature: string | null;
};

export type TransactionRecord = {
  type: 'escrowTransaction';
  agreementPda: string;
  signature: string;
  action: string;
  status: 'pending' | 'confirmed' | 'failed';
  submittedAt: string;
  confirmedAt: string | null;
  explorerUrl: string;
};

export type DisputeEvidence = {
  type: 'disputeEvidence';
  agreementPda: string;
  reasonCode: number;
  description: string;
  evidenceText: string;
  evidenceHash: string;
  submittedBy: string;
  submittedAt: string;
};

export type IndexedEvent = {
  type: 'indexedEvent';
  agreementPda: string;
  eventName: string;
  slot: number;
  data: Record<string, unknown>;
  indexedAt: string;
};

export type AgreementListFilter = {
  wallet?: string;
  role?: 'tenant' | 'landlord' | 'moderator';
  state?: AgreementUiState;
};
