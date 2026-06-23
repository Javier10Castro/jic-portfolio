'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import type { PipelineLog } from '@/types/pipeline';

const levelStyles = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  warn: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  debug: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

interface StageLogProps {
  logs: PipelineLog[];
}

export default function StageLog({ logs }: StageLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Logs</span>
      </div>
      <div className="max-h-60 overflow-y-auto p-3 space-y-1">
        {logs.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No logs yet</p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 text-xs font-mono">
            <span className="text-gray-400 dark:text-gray-500 shrink-0">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase shrink-0',
                levelStyles[log.level],
              )}
            >
              {log.level}
            </span>
            <span className="text-gray-700 dark:text-gray-300 break-all">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
