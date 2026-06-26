import { randomUUID } from 'node:crypto';
import type { FAQItem } from '@/types/faq';

export function createFAQItemWithId(
  question: string,
  answer: string,
  tenantId: string,
  language: string,
  status: 'answered' | 'skipped' | 'pending' = 'pending'
): FAQItem {
  return {
    id: randomUUID(),
    question,
    answer,
    status,
    askedBy: tenantId,
    askedAt: new Date().toISOString(),
    answeredAt: status === 'answered' ? new Date().toISOString() : undefined,
    language,
  };
}

export function updateFAQItem(
  existingItem: FAQItem,
  answer: string,
  status: 'answered' | 'skipped'
): FAQItem {
  return {
    ...existingItem,
    answer,
    status,
    answeredAt: new Date().toISOString(),
  };
}

export function mergeFAQItems(existingFAQ: FAQItem[], newItems: FAQItem[]): FAQItem[] {
  const merged = [...existingFAQ];

  for (const newItem of newItems) {
    const existingIndex = merged.findIndex((item) => item.id === newItem.id);
    if (existingIndex >= 0) {
      merged[existingIndex] = newItem;
    } else {
      merged.push(newItem);
    }
  }

  return merged;
}
