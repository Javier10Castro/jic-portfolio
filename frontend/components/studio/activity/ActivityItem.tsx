'use client';

import type { ActivityEvent } from './types';
import AgentBadge from './AgentBadge';

interface Props {
  event: ActivityEvent;
  isLatest?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-500',
  running: 'bg-yellow-500',
  failed: 'bg-red-500',
  pending: 'bg-gray-400',
};

function formatDuration(seconds?: number): string {
  if (seconds == null) return '';
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s.toFixed(0)}s` : `${m}m`;
}

export default function ActivityItem({ event, isLatest }: Props) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isLatest
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_STYLES[event.status]}`} />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <AgentBadge name={event.agent} size="sm" />
        <span className="truncate text-sm text-gray-700 dark:text-gray-300">{event.action}</span>
      </div>
      {event.duration != null && (
        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
          {formatDuration(event.duration)}
        </span>
      )}
    </div>
  );
}
