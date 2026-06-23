'use client';

import { cn } from '@/utils/cn';

interface QuickRepliesProps {
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
}

export default function QuickReplies({ options, onSelect }: QuickRepliesProps) {
  if (options.length === 0) return null;

  return (
    <div className="overflow-x-auto px-4 py-2">
      <div className="flex gap-2 min-w-max">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(opt.value)}
            className={cn(
              'whitespace-nowrap px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600',
              'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800',
              'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
              'transition-colors shrink-0'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
