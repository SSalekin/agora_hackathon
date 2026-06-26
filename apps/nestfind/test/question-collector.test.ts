import assert from 'node:assert';
import { validateQuestion, createFAQItem, extractQuestionsFromChat } from '../lib/question-collector.js';

// Test validateQuestion
console.log('Testing validateQuestion...');

// Valid question
assert.deepStrictEqual(validateQuestion('Is this apartment still available?'), { valid: true });
assert.deepStrictEqual(validateQuestion('What is the rent for this place?'), { valid: true });

// Empty/null/undefined
assert.deepStrictEqual(validateQuestion(''), { valid: false, error: 'Question is required' });
assert.deepStrictEqual(validateQuestion(null as unknown as string), { valid: false, error: 'Question is required' });
assert.deepStrictEqual(validateQuestion(undefined as unknown as string), { valid: false, error: 'Question is required' });
assert.deepStrictEqual(validateQuestion(123 as unknown as string), { valid: false, error: 'Question is required' });

// Too short
assert.deepStrictEqual(validateQuestion('Short?'), { valid: false, error: 'Question must be at least 10 characters' });
assert.deepStrictEqual(validateQuestion('Hi'), { valid: false, error: 'Question must be at least 10 characters' });

// Too long
const longQuestion = 'A'.repeat(501);
assert.deepStrictEqual(validateQuestion(longQuestion), { valid: false, error: 'Question must be no more than 500 characters' });

// Trimming
assert.deepStrictEqual(validateQuestion('   Is this place available?   '), { valid: true });
assert.deepStrictEqual(validateQuestion('   Short?   '), { valid: false, error: 'Question must be at least 10 characters' });

console.log('All validateQuestion tests passed!');

// Test createFAQItem
console.log('Testing createFAQItem...');

const faqItem = createFAQItem('Is this apartment still available?', 'tenant-123', 'en');
assert.strictEqual(faqItem.question, 'Is this apartment still available?');
assert.strictEqual(faqItem.answer, '');
assert.strictEqual(faqItem.status, 'pending');
assert.strictEqual(faqItem.askedBy, 'tenant-123');
assert.strictEqual(faqItem.language, 'en');

// Throws on invalid question
assert.throws(
  () => createFAQItem('Short', 'tenant-123', 'en'),
  { message: 'Question must be at least 10 characters' }
);

// Trims question
const trimmedItem = createFAQItem('   What is the rent?   ', 'tenant-456', 'fr');
assert.strictEqual(trimmedItem.question, 'What is the rent?');

console.log('All createFAQItem tests passed!');

// Test extractQuestionsFromChat
console.log('Testing extractQuestionsFromChat...');

// Mixed messages - only questions ending with ? are extracted
assert.deepStrictEqual(
  extractQuestionsFromChat([
    'Hello',
    'Is this available?',
    'I like this place',
    'How many bedrooms?',
    'Thanks',
    'What about parking?',
  ]),
  ['Is this available?', 'How many bedrooms?', 'What about parking?']
);

// Empty array
assert.deepStrictEqual(extractQuestionsFromChat([]), []);

// No questions
assert.deepStrictEqual(extractQuestionsFromChat(['Hello', 'Thanks', 'Goodbye']), []);

// All questions
assert.deepStrictEqual(
  extractQuestionsFromChat(['Is this available?', 'What is the rent?']),
  ['Is this available?', 'What is the rent?']
);

// Handles whitespace
assert.deepStrictEqual(
  extractQuestionsFromChat(['  Is this available?  ', 'Thanks  ']),
  ['  Is this available?  ']
);

console.log('All extractQuestionsFromChat tests passed!');
console.log('All tests passed!');
