'use client';

import { useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { X, RotateCcw, Download } from 'lucide-react';
import { formatDistanceToNow } from '@/utils/date';

interface Props {
  artifactId: string;
  onClose: () => void;
}

export default function VersionTimeline({ artifactId, onClose }: Props) {
  const versions = useWorkspaceStore((s) => s.getArtifactVersions(artifactId));
  const artifacts = useWorkspaceStore((s) => s.artifacts);
  const setEditor = useWorkspaceStore((s) => s.setEditor);
  const addVersion = useWorkspaceStore((s) => s.addVersion);
  const updateArtifact = useWorkspaceStore((s) => s.updateArtifact);
  const addConsoleEntry = useWorkspaceStore((s) => s.addConsoleEntry);

  const artifact = artifacts.find((a) => a.id === artifactId);

  const handleRestore = useCallback((version: typeof versions[0]) => {
    if (!artifact) return;
    const newVersion: typeof version = {
      ...version,
      id: `v_${Date.now()}`,
      version: artifact.currentVersion + 1,
      timestamp: new Date().toISOString(),
      message: `Restored from v${version.version}`,
      author: 'user',
    };
    addVersion(newVersion);
    updateArtifact(artifact.id, {
      content: version.content,
      currentVersion: newVersion.version,
      updatedAt: new Date().toISOString(),
    });
    setEditor({ content: version.content, originalContent: version.content, isDirty: false });
    addConsoleEntry({ id: `vh_${Date.now()}`, type: 'info', message: `Restored ${artifact.name} to v${version.version}`, timestamp: Date.now() });
  }, [artifact, addVersion, updateArtifact, setEditor, addConsoleEntry]);

  if (versions.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Version History</h3>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-gray-500">No version history yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Version History</h3>
        <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-2">
        {versions.map((v, i) => (
          <div key={v.id} className="relative pl-6 pb-2">
            {i < versions.length - 1 && (
              <div className="absolute left-2.5 top-3 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
            )}
            <div className={`absolute left-2 top-1.5 w-2 h-2 rounded-full border-2 ${v.version === artifact?.currentVersion ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  v{v.version}
                  {v.version === artifact?.currentVersion && <span className="text-blue-500 ml-1">(current)</span>}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {v.author} · {formatDistanceToNow(new Date(v.timestamp))}
                </p>
                {v.message && <p className="text-[10px] text-gray-400 mt-0.5">{v.message}</p>}
                {v.provider && <p className="text-[10px] text-gray-400">{v.provider} · {v.tokens} tokens · ${v.cost}</p>}
              </div>
              <div className="flex gap-1">
                {v.version !== artifact?.currentVersion && (
                  <button onClick={() => handleRestore(v)} className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Restore">
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
