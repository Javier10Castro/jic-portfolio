'use client';

import { cn } from '@/utils/cn';
import type { FeatureInfo } from '@/types/conversation';

const priorityStyles = {
  essential: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'nice-to-have': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  future: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

interface FeaturesPanelProps {
  features: FeatureInfo[];
}

export default function FeaturesPanel({ features }: FeaturesPanelProps) {
  if (features.length === 0) {
    return <p className="text-xs text-gray-400 dark:text-gray-500">No features defined</p>;
  }

  return (
    <div className="space-y-2">
      {features.map((feature, idx) => (
        <div
          key={idx}
          className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{feature.name}</p>
            <span
              className={cn(
                'shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                priorityStyles[feature.priority],
              )}
            >
              {feature.priority}
            </span>
          </div>
          {feature.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{feature.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
