'use client';

import { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ConsoleEntry } from '@/types/workspace';
import { X, Trash2, Terminal, AlertCircle, AlertTriangle, Info, Radio, Cpu, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';

const TAB_LABELS: Record<string, string> = {
  all: 'All', log: 'Logs', warn: 'Warnings', error: 'Errors',
  ai_call: 'AI Calls', sse: 'SSE', perf: 'Performance',
};

const TAB_ICONS: Record<string, typeof Terminal> = {
  all: Terminal, log: Info, warn: AlertTriangle, error: AlertCircle,
  ai_call: Cpu, sse: Radio, perf: Activity,
};

const TYPE_COLORS: Record<string, string> = {
  log: 'text-gray-600 dark:text-gray-400',
  warn: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
  sse: 'text-green-600 dark:text-green-400',
  ai_call: 'text-purple-600 dark:text-purple-400',
  perf: 'text-cyan-600 dark:text-cyan-400',
};

interface Props {
  onClose: () => void;
}

export default function GenerationConsole({ onClose }: Props) {
  const consoleEntries = useWorkspaceStore((s) => s.console);
  const clearConsole = useWorkspaceStore((s) => s.clearConsole);
  const [activeTab, setActiveTab] = useState('all');
  const listRef = useRef<HTMLDivElement>(null);

  const tabs = ['all', 'log', 'warn', 'error', 'ai_call', 'sse', 'perf'];

  const filtered = activeTab === 'all'
    ? consoleEntries
    : consoleEntries.filter((e) => e.type === activeTab);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [consoleEntries.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab];
            const count = tab === 'all' ? consoleEntries.length : consoleEntries.filter((e) => e.type === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors whitespace-nowrap',
                  activeTab === tab
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
                )}
              >
                <Icon className="w-3 h-3" />
                {TAB_LABELS[tab]}
                <span className="ml-0.5 text-gray-400">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearConsole} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Clear">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-[11px]">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            No entries
          </div>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className={cn('flex items-start gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50', TYPE_COLORS[entry.type])}>
              <span className="shrink-0 w-12 text-gray-400 dark:text-gray-600">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className="shrink-0 font-semibold w-12 uppercase">[{entry.type}]</span>
              <span className="flex-1 whitespace-pre-wrap break-all">{entry.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-[10px] text-gray-400">
        {consoleEntries.length} entries · {consoleEntries.filter((e) => e.type === 'error').length} errors · {consoleEntries.filter((e) => e.type === 'warn').length} warnings
      </div>
    </div>
  );
}
