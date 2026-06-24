'use client';

import { useState } from 'react';
import { cn } from '@/utils/cn';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
  Cpu,
  Activity,
} from 'lucide-react';

interface StageInspectorProps {
  stage: {
    name: string;
    status: string;
    progress?: number;
    duration?: number;
    error?: string | null;
    output?: Record<string, unknown> | null;
    provider?: string | null;
    tokens?: number | null;
    cost?: number | null;
    latency?: number | null;
    logs?: string[];
  };
  isExpanded?: boolean;
  onToggle?: () => void;
}

const statusConfig = {
  pending: { icon: Clock, className: 'text-yellow-500 dark:text-yellow-400', label: 'Pending' },
  running: { icon: Loader2, className: 'text-blue-500 dark:text-blue-400 animate-spin', label: 'Running' },
  completed: { icon: CheckCircle, className: 'text-green-500 dark:text-green-400', label: 'Completed' },
  failed: { icon: AlertCircle, className: 'text-red-500 dark:text-red-400', label: 'Failed' },
} as const;

function CollapsibleSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {title}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

function JsonViewer({ data }: { data: unknown }) {
  return (
    <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 rounded p-2 max-h-48 overflow-auto whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

export default function StageInspector({ stage, isExpanded, onToggle }: StageInspectorProps) {
  const status = statusConfig[stage.status as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = status.icon;
  const hasMetrics = stage.provider || stage.tokens != null || stage.cost != null || stage.latency != null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>
          )}
          <StatusIcon className={cn('w-4 h-4', status.className)} />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h3>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
              stage.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
              stage.status === 'failed' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
              stage.status === 'running' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
              stage.status === 'pending' && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
            )}
          >
            {status.label}
          </span>
        </div>
        {stage.duration != null && (
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(stage.duration)}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {hasMetrics && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {stage.provider && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                <Cpu className="w-3 h-3" />
                {stage.provider}
              </span>
            )}
            {stage.cost != null && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                <DollarSign className="w-3 h-3" />
                ${stage.cost.toFixed(4)}
              </span>
            )}
            {stage.tokens != null && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                <Activity className="w-3 h-3" />
                {stage.tokens.toLocaleString()} tokens
              </span>
            )}
            {stage.latency != null && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                {formatDuration(stage.latency)}
              </span>
            )}
          </div>
        )}

        {stage.error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap break-all">{stage.error}</p>
          </div>
        )}

        {stage.output != null && (
          <CollapsibleSection title="Output">
            <JsonViewer data={stage.output} />
          </CollapsibleSection>
        )}

        {stage.logs && stage.logs.length > 0 && (
          <CollapsibleSection title={`Logs (${stage.logs.length})`}>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {stage.logs.map((log, i) => (
                <div key={i} className="text-xs font-mono text-gray-600 dark:text-gray-400 leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        <CollapsibleSection title="Raw JSON" defaultOpen={false}>
          <JsonViewer data={stage} />
        </CollapsibleSection>
      </div>
    </div>
  );
}
