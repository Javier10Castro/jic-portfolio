'use client';

import type { Entity } from '@/types/conversation';

interface EntitiesPanelProps {
  entities: Entity[];
}

export default function EntitiesPanel({ entities }: EntitiesPanelProps) {
  if (entities.length === 0) {
    return <p className="text-xs text-gray-400 dark:text-gray-500">No entities extracted</p>;
  }

  return (
    <div className="space-y-2">
      {entities.map((entity, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{entity.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{entity.value}</p>
          </div>
          <span className="ml-2 shrink-0 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {Math.round(entity.confidence * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
