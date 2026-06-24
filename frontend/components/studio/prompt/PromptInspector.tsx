'use client';

import { GenerationRecord } from '@/types/workspace';
import { X, Cpu, Thermometer, Sigma, Clock } from 'lucide-react';

interface Props {
  record: GenerationRecord;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  );
}

export default function PromptInspector({ record, onClose }: Props) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Prompt Inspector</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{record.type} · {record.provider}/{record.model}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Cpu className="w-3.5 h-3.5" />
          {record.provider}/{record.model}
        </div>
        {record.temperature != null && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Thermometer className="w-3.5 h-3.5" />
            {record.temperature}
          </div>
        )}
        {record.tokens != null && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Sigma className="w-3.5 h-3.5" />
            {record.tokens} tokens
          </div>
        )}
        {record.latency != null && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            {record.latency}ms
          </div>
        )}
      </div>

      <div className="max-h-[50vh] overflow-y-auto space-y-4">
        {record.systemPrompt && (
          <Section title="System Prompt">
            <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{record.systemPrompt}</pre>
          </Section>
        )}
        {record.developerPrompt && (
          <Section title="Developer Prompt">
            <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{record.developerPrompt}</pre>
          </Section>
        )}
        {record.userPrompt && (
          <Section title="User Prompt">
            <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{record.userPrompt}</pre>
          </Section>
        )}
        {record.context && (
          <Section title="Context">
            <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{JSON.stringify(record.context, null, 2)}</pre>
          </Section>
        )}
      </div>
    </div>
  );
}
