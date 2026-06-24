'use client';

import { useState } from 'react';

interface Artifact {
  id: string;
  name: string;
  type: string;
  content: string;
  stage: string;
}

interface Props {
  artifacts: Artifact[];
  onDownload?: (artifact: Artifact) => void;
}

export default function ArtifactViewer({ artifacts, onDownload }: Props) {
  const types = [...new Set(artifacts.map((a) => a.type))];
  const [activeType, setActiveType] = useState<string>(types[0] || '');
  const filtered = artifacts.filter((a) => a.type === activeType);

  if (artifacts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No artifacts generated yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeType === type
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="space-y-3 p-4">
        {filtered.map((artifact) => (
          <div key={artifact.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{artifact.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{artifact.stage}</p>
              </div>
              {onDownload && (
                <button
                  onClick={() => onDownload(artifact)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Download
                </button>
              )}
            </div>
            <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
              <code>{artifact.content}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
