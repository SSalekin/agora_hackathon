import type { QuestionQueueItem } from '@/types/faq';

export interface RateLimitResult {
  allowed: boolean;
  error?: string;
  retryAfterMs?: number;
}

interface RateLimitConfig {
  maxQuestionsPerHour: number;
  maxQuestionsPerDay: number;
  maxPendingPerListing: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxQuestionsPerHour: 10,
  maxQuestionsPerDay: 50,
  maxPendingPerListing: 5,
};

export function checkRateLimit(
  tenantId: string,
  listingId: string,
  queue: QuestionQueueItem[],
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Check questions per hour
  const recentQuestions = queue.filter(
    (item) =>
      item.tenantId === tenantId &&
      new Date(item.createdAt).getTime() > oneHourAgo
  );

  if (recentQuestions.length >= config.maxQuestionsPerHour) {
    return {
      allowed: false,
      error: `Rate limit exceeded: ${config.maxQuestionsPerHour} questions per hour`,
      retryAfterMs: 60 * 60 * 1000,
    };
  }

  // Check questions per day
  const dailyQuestions = queue.filter(
    (item) =>
      item.tenantId === tenantId &&
      new Date(item.createdAt).getTime() > oneDayAgo
  );

  if (dailyQuestions.length >= config.maxQuestionsPerDay) {
    return {
      allowed: false,
      error: `Rate limit exceeded: ${config.maxQuestionsPerDay} questions per day`,
      retryAfterMs: 24 * 60 * 60 * 1000,
    };
  }

  // Check pending questions per listing
  const pendingOnListing = queue.filter(
    (item) =>
      item.listingId === listingId &&
      (item.status === 'pending' || item.status === 'in-progress')
  );

  if (pendingOnListing.length >= config.maxPendingPerListing) {
    return {
      allowed: false,
      error: `Too many pending questions for this listing (${config.maxPendingPerListing} max)`,
    };
  }

  return { allowed: true };
}