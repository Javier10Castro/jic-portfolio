'use client';

import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Artifact, APPROVAL_LABELS, APPROVAL_COLORS } from '@/types/workspace';
import { cn } from '@/utils/cn';

interface Props {
  artifact?: Artifact;
  isEditing: boolean;
  content: string;
  onContentChange: (content: string) => void;
  title: string;
  description: string;
  language?: string;
}

export default function BaseEditor({ artifact, isEditing, content, onContentChange, title, description, language }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  if (!artifact) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No {title.toLowerCase()} artifact available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', APPROVAL_COLORS[artifact.approval])}>
              {APPROVAL_LABELS[artifact.approval]}
            </span>
            {artifact.provider && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{artifact.provider}</span>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full min-h-[200px] p-4 text-xs font-mono bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-0 focus:outline-none resize-y"
            spellCheck={false}
          />
        ) : (
          <pre className="w-full min-h-[200px] max-h-96 p-4 text-xs font-mono bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-auto whitespace-pre-wrap break-all">
            {content}
          </pre>
        )}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-[10px] rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {language && isEditing && (
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-[10px] text-gray-400 dark:text-gray-500">
          {language.toUpperCase()} · {content.length} chars · v{artifact.currentVersion}
        </div>
      )}
    </div>
  );
}
