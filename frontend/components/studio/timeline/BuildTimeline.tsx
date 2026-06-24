'use client';

import { StageResult } from '@/services/pipeline-executor';

interface Props {
  stages: StageResult[];
  onStageClick?: (stage: StageResult) => void;
  currentStage?: string | null;
}

export default function BuildTimeline({ stages, onStageClick, currentStage }: Props) {
  const dotColor = (stage: StageResult) => {
    switch (stage.status) {
      case 'completed':
        return 'bg-green-500 dark:bg-green-400';
      case 'running':
        return 'bg-yellow-500 dark:bg-yellow-400 animate-pulse';
      case 'failed':
        return 'bg-red-500 dark:bg-red-400';
      default:
        return 'bg-gray-300 dark:bg-gray-600';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms)}ms`;
  };

  if (stages.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No stages to display</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="relative">
        {stages.map((stage, idx) => (
          <div key={stage.name} className="relative flex items-start gap-4 pb-6 last:pb-0">
            {idx < stages.length - 1 && (
              <div className="absolute left-[11px] top-6 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
            )}
            <button
              onClick={() => onStageClick?.(stage)}
              className={`relative z-10 mt-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 shrink-0 transition-opacity hover:opacity-80 ${dotColor(stage)} ${currentStage === stage.name ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}
              aria-label={stage.name}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium truncate ${stage.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {stage.name}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {formatDuration(stage.duration)}
                </span>
              </div>
              {stage.error && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 truncate">{stage.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
