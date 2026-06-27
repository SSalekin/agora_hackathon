export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  status: 'answered' | 'skipped' | 'pending';
  askedBy: string;
  askedAt: string;
  answeredAt?: string;
  language: string;
};

export type QuestionQueueItem = {
  id: string;
  listingId: string;
  tenantId: string;
  questions: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
};

export type CallSession = {
  id: string;
  questionQueueItemId: string;
  listingId: string;
  tenantId: string;
  questions: string[];
  listingLocation: string;
  landlordWallet?: string;
  landlordPhone?: string;
  callMethod: 'agora' | 'telephony';
  language: string;
  status: 'initiating' | 'active' | 'completed' | 'failed';
  startedAt: string;
  endedAt?: string;
  transcript?: string;
  // New fields for Phase 2
  channelId?: string;
  agentUid?: number;
  currentQuestionIndex?: number;
  answers: { questionIndex: number; answer: string; skipped: boolean }[];
  retryCount: number;
  lastRetryAt?: string;
  nextRetryAt?: string;
};
