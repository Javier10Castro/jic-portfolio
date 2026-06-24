'use client';

import { useState, useMemo, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { DiffLine } from '@/types/workspace';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

function computeDiff(before: string, after: string): DiffLine[] {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const lines: DiffLine[] = [];
  const maxLen = Math.max(beforeLines.length, afterLines.length);
  for (let i = 0; i < maxLen; i++) {
    const b = beforeLines[i] ?? '';
    const a = afterLines[i] ?? '';
    if (b === a) {
      lines.push({ type: 'unchanged', content: b, lineNumber: i + 1 });
    } else {
      if (b) lines.push({ type: 'removed', content: b, lineNumber: i + 1 });
      if (a) lines.push({ type: 'added', content: a, lineNumber: i + 1 });
    }
  }
  return lines;
}

interface Props {
  artifactId: string;
  onClose: () => void;
}

export default function DiffViewer({ artifactId, onClose }: Props) {
  const artifacts = useWorkspaceStore((s) => s.artifacts);
  const versions = useWorkspaceStore((s) => s.versions);
  const setEditor = useWorkspaceStore((s) => s.setEditor);
  const addConsoleEntry = useWorkspaceStore((s) => s.addConsoleEntry);

  const artifact = artifacts.find((a) => a.id === artifactId);
  const artifactVersions = versions
    .filter((v) => v.artifactId === artifactId)
    .sort((a, b) => b.version - a.version);

  const [beforeVersion, setBeforeVersion] = useState(1);
  const [afterVersion, setAfterVersion] = useState(artifact?.currentVersion ?? 1);

  const beforeContent = artifactVersions.find((v) => v.version === beforeVersion)?.content ?? '';
  const afterContent = artifactVersions.find((v) => v.version === afterVersion)?.content ?? (artifact?.content ?? '');

  const diffLines = useMemo(() => computeDiff(beforeContent, afterContent), [beforeContent, afterContent]);

  const additions = diffLines.filter((l) => l.type === 'added').length;
  const removals = diffLines.filter((l) => l.type === 'removed').length;

  const handleAccept = useCallback(() => {
    if (!artifact) return;
    useWorkspaceStore.getState().updateArtifact(artifact.id, { content: afterContent });
    setEditor({ content: afterContent, originalContent: afterContent, isDirty: false });
    addConsoleEntry({ id: `diff_${Date.now()}`, type: 'info', message: `Accepted diff for ${artifact.name}`, timestamp: Date.now() });
    onClose();
  }, [artifact, afterContent, setEditor, addConsoleEntry, onClose]);

  const handleReject = useCallback(() => {
    if (!artifact) return;
    useWorkspaceStore.getState().updateArtifact(artifact.id, { content: beforeContent });
    setEditor({ content: beforeContent, originalContent: beforeContent, isDirty: false });
    addConsoleEntry({ id: `diff_${Date.now() + 1}`, type: 'info', message: `Rejected diff for ${artifact.name}`, timestamp: Date.now() });
    onClose();
  }, [artifact, beforeContent, setEditor, addConsoleEntry, onClose]);

  if (!artifact) {
    return <div className="p-4 text-sm text-gray-500">Artifact not found</div>;
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Diff: {artifact.name}</h3>
          <span className="text-xs text-green-600 dark:text-green-400">+{additions}</span>
          <span className="text-xs text-red-600 dark:text-red-400">-{removals}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
        <label className="text-xs text-gray-500">From:</label>
        <select value={beforeVersion} onChange={(e) => setBeforeVersion(Number(e.target.value))}
          className="text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          {artifactVersions.map((v) => <option key={v.version} value={v.version}>v{v.version}</option>)}
          <option value={0}>Original</option>
        </select>
        <ChevronDown className="w-3 h-3 text-gray-400" />
        <label className="text-xs text-gray-500">To:</label>
        <select value={afterVersion} onChange={(e) => setAfterVersion(Number(e.target.value))}
          className="text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          {artifactVersions.map((v) => <option key={v.version} value={v.version}>v{v.version}</option>)}
          <option value={0}>Current</option>
        </select>
      </div>

      <div className="max-h-96 overflow-y-auto font-mono text-xs">
        {diffLines.map((line, i) => (
          <div key={i} className={cn(
            'flex px-4 py-0.5 leading-5',
            line.type === 'added' && 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300',
            line.type === 'removed' && 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300',
            line.type === 'unchanged' && 'text-gray-700 dark:text-gray-300',
          )}>
            <span className="w-8 text-gray-400 dark:text-gray-600 shrink-0 select-none">{line.lineNumber}</span>
            <span className="w-4 shrink-0 select-none">
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </span>
            <span className="whitespace-pre-wrap break-all flex-1">{line.content}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <button onClick={handleAccept} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
          Accept
        </button>
        <button onClick={handleReject} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
          Reject
        </button>
      </div>
    </div>
  );
}
