'use client';

interface Props {
  name: string;
  status: string;
  duration?: number;
}

const STATUS_COLORS: Record<string, string> = {
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

export default function StageHeader({ name, status, duration }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
      <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-400'}`} />
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{name}</span>
      {duration != null && (
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{formatDuration(duration)}</span>
      )}
    </div>
  );
}
