export type AgreementUiState =
  | 'awaitingLandlordApproval'
  | 'awaitingFunding'
  | 'funded'
  | 'disputed'
  | 'released'
  | 'refunded'
  | 'cancelled'
  | 'unknown';

export type AgreementView<TOnchain = unknown> = {
  onchain: TOnchain;
  pda: string;
  txSignature: string | null;
  state: AgreementUiState;
};

const AGREEMENT_STATE_MAP: Record<string, AgreementUiState> = {
  awaitinglandlordapproval: 'awaitingLandlordApproval',
  awaitingfunding: 'awaitingFunding',
  funded: 'funded',
  disputed: 'disputed',
  released: 'released',
  refunded: 'refunded',
  cancelled: 'cancelled',
};

function normalizeStateName(value: string) {
  return value.replace(/[^a-z]/gi, '').toLowerCase();
}

export function decodeAgreementState(value: unknown): AgreementUiState {
  if (typeof value === 'string') {
    return AGREEMENT_STATE_MAP[normalizeStateName(value)] ?? 'unknown';
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 1) {
      return decodeAgreementState(entries[0][0]);
    }
  }

  return 'unknown';
}

export function formatAgreementStateLabel(state: AgreementUiState): string {
  if (state === 'unknown') return 'Unknown';
  return state
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());
}

export function buildAgreementView<TOnchain>(
  onchain: TOnchain,
  pda: string,
  txSignature: string | null,
  stateValue: unknown,
): AgreementView<TOnchain> {
  return {
    onchain,
    pda,
    txSignature,
    state: decodeAgreementState(stateValue),
  };
}

export function withAgreementState<TAgreement extends { state: AgreementUiState }>(
  agreement: TAgreement,
  state: AgreementUiState,
  extra?: Record<string, unknown>,
): TAgreement {
  return {
    ...agreement,
    ...extra,
    state,
  };
}

const LAMPORTS_PER_SOL = 1_000_000_000;

export function toPersistedAgreement(
  listingId: string,
  pda: string,
  txSignature: string | null,
  onchain: Record<string, any>,
) {
  const tenantWallet = onchain.tenant?.toBase58?.() ?? '';
  const landlordWallet = onchain.landlord?.toBase58?.() ?? '';
  const listingHash = Array.from(Uint8Array.from(onchain.listingHash))
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
  const depositLamports = typeof onchain.depositLamports === 'object'
    ? Number(onchain.depositLamports.toString())
    : Number(onchain.depositLamports ?? 0);
  const inspectionDeadline = typeof onchain.inspectionDeadline === 'object'
    ? Number(onchain.inspectionDeadline.toString())
    : Number(onchain.inspectionDeadline ?? 0);
  const createdAt = typeof onchain.createdAt === 'object'
    ? Number(onchain.createdAt.toString())
    : Number(onchain.createdAt ?? 0);
  const fundedAt = typeof onchain.fundedAt === 'object'
    ? Number(onchain.fundedAt.toString())
    : Number(onchain.fundedAt ?? 0);

  return {
    pda,
    listingId,
    listingHash,
    tenantWallet,
    landlordWallet,
    depositSol: depositLamports / LAMPORTS_PER_SOL,
    depositLamports,
    inspectionDeadline: inspectionDeadline > 0 ? new Date(inspectionDeadline * 1000).toISOString() : new Date().toISOString(),
    createdAt: createdAt > 0 ? new Date(createdAt * 1000).toISOString() : new Date().toISOString(),
    fundedAt: fundedAt > 0 ? new Date(fundedAt * 1000).toISOString() : null,
    state: decodeAgreementState(onchain.state),
    lastTxSignature: txSignature,
  };
}

export async function persistAgreementAction(
  action: string,
  pda: string,
  txSignature: string,
  explorerUrl: string,
  newState: AgreementUiState,
) {
  try {
    await fetch(`/api/escrow/agreements/${pda}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signature: txSignature,
        action,
        status: 'confirmed',
        explorerUrl,
      }),
    });
    await fetch(`/api/escrow/agreements/${pda}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: newState, lastTxSignature: txSignature }),
    });
  } catch {
    // Persistence is best-effort; do not break the UI flow.
  }
}

export async function persistCreateAgreement(
  listingId: string,
  pda: string,
  txSignature: string,
  explorerUrl: string,
  onchain: Record<string, any>,
) {
  try {
    const doc = toPersistedAgreement(listingId, pda, txSignature, onchain);
    await fetch('/api/escrow/agreements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...doc, lastTxSignature: txSignature }),
    });
    await fetch(`/api/escrow/agreements/${pda}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signature: txSignature,
        action: 'create',
        status: 'confirmed',
        explorerUrl,
      }),
    });
  } catch {
    // Persistence is best-effort.
  }
}

export async function persistDisputeEvidence(
  pda: string,
  evidenceText: string,
  submittedBy: string,
) {
  try {
    await fetch(`/api/escrow/agreements/${pda}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidenceText, submittedBy, reasonCode: 1 }),
    });
  } catch {
    // Persistence is best-effort.
  }
}
