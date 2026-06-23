'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import type { DeploymentLogEntry } from '@/types/deployment';

const levelStyles = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  warn: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

interface DeploymentLogProps {
  entry: DeploymentLogEntry;
}

export default function DeploymentLog({ entry }: DeploymentLogProps) {
  return (
    <div className="flex items-start gap-2 text-xs font-mono">
      <span className="text-gray-400 dark:text-gray-500 shrink-0">
        {new Date(entry.timestamp).toLocaleTimeString()}
      </span>
      <span
        className={cn(
          'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase shrink-0',
          levelStyles[entry.level],
        )}
      >
        {entry.level}
      </span>
      <span className="text-gray-700 dark:text-gray-300 break-all">{entry.message}</span>
    </div>
  );
}
