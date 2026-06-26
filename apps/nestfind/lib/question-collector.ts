import type { FAQItem } from '@/types/faq';

const MAX_QUESTION_LENGTH = 500;
const MIN_QUESTION_LENGTH = 10;

export function validateQuestion(question: string): { valid: boolean; error?: string } {
  if (!question || typeof question !== 'string') {
    return { valid: false, error: 'Question is required' };
  }
  
  const trimmed = question.trim();
  
  if (trimmed.length < MIN_QUESTION_LENGTH) {
    return { valid: false, error: `Question must be at least ${MIN_QUESTION_LENGTH} characters` };
  }
  
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return { valid: false, error: `Question must be no more than ${MAX_QUESTION_LENGTH} characters` };
  }
  
  // Basic content policy - no explicit content
  const explicitPatterns = /\b(badword1|badword2|badword3)\b/i;
  if (explicitPatterns.test(trimmed)) {
    return { valid: false, error: 'Question contains inappropriate content' };
  }
  
  return { valid: true };
}

export function createFAQItem(
  question: string,
  tenantId: string,
  language: string
): Omit<FAQItem, 'id' | 'askedAt'> {
  const validation = validateQuestion(question);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  return {
    question: question.trim(),
    answer: '',
    status: 'pending',
    askedBy: tenantId,
    language,
  };
}

export function extractQuestionsFromChat(messages: string[]): string[] {
  // Simple heuristic: messages that end with ? are questions
  return messages.filter(msg => msg.trim().endsWith('?'));
}
