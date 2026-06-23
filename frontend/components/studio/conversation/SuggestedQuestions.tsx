'use client';

import { cn } from '@/utils/cn';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export default function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full border border-gray-200 dark:border-gray-600',
            'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800',
            'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500',
            'transition-colors'
          )}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
