import assert from 'node:assert';
import {
  createFAQItemWithId,
  updateFAQItem,
  mergeFAQItems,
} from '../lib/faq-updater.js';
import type { FAQItem } from '../types/faq.js';

// Test createFAQItemWithId
console.log('Testing createFAQItemWithId...');

const item = createFAQItemWithId('Is parking available?', 'Yes, street parking', 'tenant-1', 'en');
assert.ok(item.id, 'should generate an id');
assert.strictEqual(item.question, 'Is parking available?');
assert.strictEqual(item.answer, 'Yes, street parking');
assert.strictEqual(item.status, 'pending');
assert.strictEqual(item.askedBy, 'tenant-1');
assert.strictEqual(item.language, 'en');
assert.ok(item.askedAt, 'should have askedAt');
assert.strictEqual(item.answeredAt, undefined, 'pending items should not have answeredAt');

const answeredItem = createFAQItemWithId('Pets allowed?', 'No pets', 'tenant-2', 'vi', 'answered');
assert.strictEqual(answeredItem.status, 'answered');
assert.ok(answeredItem.answeredAt, 'answered items should have answeredAt');

const skippedItem = createFAQItemWithId('Gym access?', 'N/A', 'tenant-3', 'fr', 'skipped');
assert.strictEqual(skippedItem.status, 'skipped');
assert.strictEqual(skippedItem.answeredAt, undefined, 'skipped items should not have answeredAt');

console.log('All createFAQItemWithId tests passed!');

// Test updateFAQItem
console.log('Testing updateFAQItem...');

const existing: FAQItem = {
  id: 'existing-id',
  question: 'Test question?',
  answer: '',
  status: 'pending',
  askedBy: 'tenant-1',
  askedAt: '2025-01-01T00:00:00.000Z',
  language: 'en',
};

const updated = updateFAQItem(existing, 'Updated answer', 'answered');
assert.strictEqual(updated.id, 'existing-id');
assert.strictEqual(updated.answer, 'Updated answer');
assert.strictEqual(updated.status, 'answered');
assert.ok(updated.answeredAt, 'should set answeredAt');
assert.strictEqual(updated.question, 'Test question?');
assert.strictEqual(updated.askedBy, 'tenant-1');

const skippedUpdate = updateFAQItem(existing, 'Skipped answer', 'skipped');
assert.strictEqual(skippedUpdate.status, 'skipped');
assert.ok(skippedUpdate.answeredAt, 'skipped should also set answeredAt');

console.log('All updateFAQItem tests passed!');

// Test mergeFAQItems
console.log('Testing mergeFAQItems...');

const existingFAQ: FAQItem[] = [
  {
    id: 'item-1',
    question: 'Q1?',
    answer: 'A1',
    status: 'answered',
    askedBy: 't1',
    askedAt: '2025-01-01T00:00:00.000Z',
    answeredAt: '2025-01-01T01:00:00.000Z',
    language: 'en',
  },
  {
    id: 'item-2',
    question: 'Q2?',
    answer: '',
    status: 'pending',
    askedBy: 't2',
    askedAt: '2025-01-02T00:00:00.000Z',
    language: 'vi',
  },
];

// Add new items
const newItems: FAQItem[] = [
  {
    id: 'item-3',
    question: 'Q3?',
    answer: 'A3',
    status: 'answered',
    askedBy: 't3',
    askedAt: '2025-01-03T00:00:00.000Z',
    answeredAt: '2025-01-03T01:00:00.000Z',
    language: 'ja',
  },
];

const merged1 = mergeFAQItems(existingFAQ, newItems);
assert.strictEqual(merged1.length, 3, 'should add new items');
assert.strictEqual(merged1[2].id, 'item-3');

// Update existing items
const updatedItems: FAQItem[] = [
  {
    id: 'item-2',
    question: 'Q2?',
    answer: 'Updated A2',
    status: 'answered',
    askedBy: 't2',
    askedAt: '2025-01-02T00:00:00.000Z',
    answeredAt: '2025-01-02T01:00:00.000Z',
    language: 'vi',
  },
];

const merged2 = mergeFAQItems(existingFAQ, updatedItems);
assert.strictEqual(merged2.length, 2, 'should not add duplicate');
assert.strictEqual(merged2[1].answer, 'Updated A2');
assert.strictEqual(merged2[1].status, 'answered');

// Empty arrays
const merged3 = mergeFAQItems([], []);
assert.strictEqual(merged3.length, 0);

const merged4 = mergeFAQItems([], newItems);
assert.strictEqual(merged4.length, 1);

const merged5 = mergeFAQItems(existingFAQ, []);
assert.strictEqual(merged5.length, 2);

// Multiple new + updates mixed
const mixedItems: FAQItem[] = [
  {
    id: 'item-1',
    question: 'Q1?',
    answer: 'Updated A1',
    status: 'answered',
    askedBy: 't1',
    askedAt: '2025-01-01T00:00:00.000Z',
    answeredAt: '2025-01-01T02:00:00.000Z',
    language: 'en',
  },
  {
    id: 'item-4',
    question: 'Q4?',
    answer: 'A4',
    status: 'pending',
    askedBy: 't4',
    askedAt: '2025-01-04T00:00:00.000Z',
    language: 'fr',
  },
];

const merged6 = mergeFAQItems(existingFAQ, mixedItems);
assert.strictEqual(merged6.length, 3, 'should update one and add one');
assert.strictEqual(merged6[0].answer, 'Updated A1');
assert.strictEqual(merged6[2].id, 'item-4');

console.log('All mergeFAQItems tests passed!');
console.log('All tests passed!');
