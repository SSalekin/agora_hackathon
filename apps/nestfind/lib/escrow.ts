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
