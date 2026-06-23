'use client';

import { cn } from '@/utils/cn';

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce',
              i === 0 && 'animation-delay-0',
              i === 1 && 'animation-delay-150',
              i === 2 && 'animation-delay-300'
            )}
          />
        ))}
      </div>
      <span className="text-sm text-gray-400 dark:text-gray-500">AI is thinking...</span>
    </div>
  );
}
