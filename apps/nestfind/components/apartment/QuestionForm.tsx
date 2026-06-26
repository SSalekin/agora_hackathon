'use client';

import { useState } from 'react';

interface QuestionFormProps {
  listingId: string;
  tenantId: string;
  landlordWallet: string;
  listingLocation: string;
  onSubmit: (questions: string[]) => void;
  isLoading?: boolean;
}

export function QuestionForm({
  listingId,
  tenantId,
  landlordWallet,
  listingLocation,
  onSubmit,
  isLoading = false,
}: QuestionFormProps) {
  const [questions, setQuestions] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = () => {
    if (questions.length < 5) {
      setQuestions([...questions, '']);
    }
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Filter out empty questions
    const validQuestions = questions.filter(q => q.trim().length > 0);
    
    if (validQuestions.length === 0) {
      setError('Please enter at least one question');
      return;
    }
    
    // Validate question lengths
    const invalidQuestions = validQuestions.filter(q => q.trim().length < 10);
    if (invalidQuestions.length > 0) {
      setError('Each question must be at least 10 characters long');
      return;
    }
    
    onSubmit(validQuestions);
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h4 className="font-medium text-gray-900 mb-4">Ask the Landlord</h4>
      <p className="text-sm text-gray-600 mb-4">
        Have questions about this apartment? Ask the landlord directly.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((question, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => updateQuestion(index, e.target.value)}
              placeholder={`Question ${index + 1}`}
              className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                className="px-2 py-1 text-gray-500 hover:text-red-500"
                disabled={isLoading}
              >
                ×
              </button>
            )}
          </div>
        ))}
        
        {questions.length < 5 && (
          <button
            type="button"
            onClick={addQuestion}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={isLoading}
          >
            + Add another question
          </button>
        )}
        
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Questions'}
        </button>
      </form>
    </div>
  );
}
