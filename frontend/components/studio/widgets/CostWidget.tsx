'use client';

import { StageResult } from '@/services/pipeline-executor';

interface Props {
  stages: StageResult[];
  estimatedBudget?: number;
}

export default function CostWidget({ stages, estimatedBudget }: Props) {
  const totalCost = stages.reduce((sum, s) => sum + (s.cost ?? 0), 0);
  const totalTokens = stages.reduce((sum, s) => sum + (s.tokens ?? 0), 0);
  const activeProvider = [...new Set(stages.filter((s) => s.provider).map((s) => s.provider!))].join(', ') || 'N/A';
  const avgLatency = stages.filter((s) => s.latency != null).reduce((sum, s, _, arr) => sum + (s.latency ?? 0) / arr.length, 0);

  const formatCost = (n: number) => `$${n.toFixed(2)}`;
  const formatTokens = (n: number) => n.toLocaleString();

  const budgetUsed = estimatedBudget ? (totalCost / estimatedBudget) * 100 : 0;

  const stats = [
    { label: 'Total Cost', value: formatCost(totalCost) },
    { label: 'Total Tokens', value: formatTokens(totalTokens) },
    { label: 'Active Provider', value: activeProvider },
    { label: 'Avg Latency', value: `${avgLatency.toFixed(0)}ms` },
  ];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Cost & Usage</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{stat.value}</p>
          </div>
        ))}
      </div>
      {estimatedBudget != null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Budget</span>
            <span>{budgetUsed.toFixed(0)}% used</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${budgetUsed > 90 ? 'bg-red-500' : budgetUsed > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
