'use client';

import type { DetectedIntent } from '@/types/conversation';

interface IntentDisplayProps {
  intent: DetectedIntent;
}

export default function IntentDisplay({ intent }: IntentDisplayProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {intent.type}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {Math.round(intent.confidence * 100)}%
        </span>
      </div>
      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{intent.label}</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${Math.round(intent.confidence * 100)}%` }}
        />
      </div>
    </div>
  );
}
