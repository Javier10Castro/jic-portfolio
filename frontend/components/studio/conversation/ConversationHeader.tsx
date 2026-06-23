'use client';

import { ChevronLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import ConversationStatus from './ConversationStatus';

interface ConversationHeaderProps {
  title: string;
  status: string;
  onBack?: () => void;
}

export default function ConversationHeader({ title, status, onBack }: ConversationHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {onBack && (
        <button
          onClick={onBack}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {title}
        </h2>
      </div>
      <ConversationStatus status={status} />
    </div>
  );
}
