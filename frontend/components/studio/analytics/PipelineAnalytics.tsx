'use client';

import { StageResult } from '@/services/pipeline-executor';

interface Props {
  stages: StageResult[];
}

export default function PipelineAnalytics({ stages }: Props) {
  const maxDuration = Math.max(...stages.map((s) => s.duration), 1);

  const providerMap = new Map<string, { count: number; totalDuration: number }>();
  stages.forEach((s) => {
    const p = s.provider || 'unknown';
    const entry = providerMap.get(p) || { count: 0, totalDuration: 0 };
    entry.count++;
    entry.totalDuration += s.duration;
    providerMap.set(p, entry);
  });
  const providerRows = Array.from(providerMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
  }));

  const failedCount = stages.filter((s) => s.status === 'failed').length;
  const retryCount = stages.filter((s) => s.status === 'failed' || s.status === 'running').length;

  if (stages.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Stage Duration</h3>
        <div className="space-y-2">
          {stages.map((stage) => (
            <div key={stage.name} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0 truncate">{stage.name}</span>
              <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all ${stage.status === 'failed' ? 'bg-red-400 dark:bg-red-500' : 'bg-blue-500 dark:bg-blue-400'}`}
                  style={{ width: `${(stage.duration / maxDuration) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right shrink-0">
                {stage.duration >= 1000 ? `${(stage.duration / 1000).toFixed(1)}s` : `${Math.round(stage.duration)}ms`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Provider Usage</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left pb-1 font-medium">Provider</th>
              <th className="text-right pb-1 font-medium">Count</th>
              <th className="text-right pb-1 font-medium">Avg Duration</th>
            </tr>
          </thead>
          <tbody>
            {providerRows.map((row) => (
              <tr key={row.name} className="border-b border-gray-100 dark:border-gray-700/50">
                <td className="py-1 text-gray-900 dark:text-gray-100 capitalize">{row.name}</td>
                <td className="py-1 text-right text-gray-700 dark:text-gray-300">{row.count}</td>
                <td className="py-1 text-right text-gray-700 dark:text-gray-300">
                  {row.avgDuration >= 1000 ? `${(row.avgDuration / 1000).toFixed(1)}s` : `${Math.round(row.avgDuration)}ms`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Failures & Retries</h3>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{failedCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Failed Stages</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{retryCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Retries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
