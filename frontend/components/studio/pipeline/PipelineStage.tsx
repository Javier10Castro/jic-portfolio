'use client';

import { cn } from '@/utils/cn';
import { Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react';
import type { PipelineStageState } from '@/types/pipeline';

const statusConfig = {
  pending: { icon: Circle, className: 'text-gray-400 dark:text-gray-500' },
  running: { icon: Loader2, className: 'text-blue-500 animate-spin' },
  completed: { icon: CheckCircle2, className: 'text-green-500' },
  failed: { icon: XCircle, className: 'text-red-500' },
  skipped: { icon: Circle, className: 'text-gray-300 dark:text-gray-600' },
} as const;

interface PipelineStageProps {
  stage: PipelineStageState;
  isCurrent: boolean;
}

export default function PipelineStage({ stage, isCurrent }: PipelineStageProps) {
  const config = statusConfig[stage.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-300',
        isCurrent
          ? 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/10'
          : 'border-gray-200 dark:border-gray-700',
        stage.status === 'completed' && 'border-green-200 dark:border-green-800',
        stage.status === 'failed' && 'border-red-200 dark:border-red-800',
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 shrink-0 mt-0.5">
        <Icon className={cn('w-5 h-5', config.className)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              stage.status === 'completed' && 'text-green-700 dark:text-green-300',
              stage.status === 'failed' && 'text-red-700 dark:text-red-300',
              stage.status === 'pending' && 'text-gray-500 dark:text-gray-400',
              stage.status === 'running' && 'text-blue-700 dark:text-blue-300',
              isCurrent && 'text-blue-800 dark:text-blue-200',
            )}
          >
            {stage.label}
          </span>
          {stage.duration && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{stage.duration}ms</span>
          )}
        </div>
        {stage.status === 'running' && (
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${stage.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
