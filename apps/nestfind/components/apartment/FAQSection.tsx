'use client';

import type { FAQItem } from '@/types/faq';

interface FAQSectionProps {
  faq: FAQItem[];
  isLoading?: boolean;
}

export function FAQSection({ faq, isLoading = false }: FAQSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!faq || faq.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
        <p className="text-gray-500">No questions have been asked yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
      <div className="space-y-3">
        {faq.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 ${
              item.status === 'answered' ? 'bg-green-50 border-green-200' :
              item.status === 'skipped' ? 'bg-yellow-50 border-yellow-200' :
              'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.question}</p>
                {item.status === 'answered' && (
                  <p className="mt-2 text-gray-700">{item.answer}</p>
                )}
                {item.status === 'skipped' && (
                  <p className="mt-2 text-gray-500 italic">Landlord skipped this question</p>
                )}
                {item.status === 'pending' && (
                  <p className="mt-2 text-gray-500 italic">Awaiting landlord response</p>
                )}
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                item.status === 'answered' ? 'bg-green-100 text-green-800' :
                item.status === 'skipped' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {item.status}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Asked {new Date(item.askedAt).toLocaleDateString()}
              {item.answeredAt && ` • Answered ${new Date(item.answeredAt).toLocaleDateString()}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
