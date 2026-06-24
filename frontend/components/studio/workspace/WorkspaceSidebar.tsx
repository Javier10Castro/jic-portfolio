'use client';

import { useWorkspaceStore } from '@/store/workspaceStore';
import FileTree from '@/components/studio/files/FileTree';
import { cn } from '@/utils/cn';

interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function WorkspaceSidebar({ open, onToggle }: Props) {
  const artifacts = useWorkspaceStore((s) => s.artifacts);
  const comments = useWorkspaceStore((s) => s.comments);
  const selectedPreviewElement = useWorkspaceStore((s) => s.selectedPreviewElement);

  const pendingApprovals = artifacts.filter((a) => a.approval !== 'approved').length;
  const openComments = comments.filter((c) => !c.resolved).length;

  return (
    <div
      className={cn(
        'border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-200 overflow-hidden flex flex-col',
        open ? 'w-60' : 'w-0',
      )}
    >
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-w-0">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Files</p>
          <FileTree />
        </div>

        {pendingApprovals > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Pending Approvals
            </p>
            <div className="space-y-1">
              {artifacts.filter((a) => a.approval !== 'approved').slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center gap-2 px-2 py-1 rounded bg-yellow-50 dark:bg-yellow-900/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPreviewElement && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Selected Element
            </p>
            <div className="px-2 py-1.5 rounded bg-blue-50 dark:bg-blue-900/10 text-xs space-y-0.5">
              <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400">Tag:</span> {selectedPreviewElement.tagName}</p>
              <p className="text-gray-700 dark:text-gray-300 truncate"><span className="text-gray-400">Path:</span> {selectedPreviewElement.selector}</p>
              {selectedPreviewElement.provider && (
                <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400">Provider:</span> {selectedPreviewElement.provider}</p>
              )}
            </div>
          </div>
        )}

        {openComments > 0 && (
          <div className="px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
            {openComments} open comment{openComments !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="border-t border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        {open ? 'Close Sidebar' : 'Open Sidebar'}
      </button>
    </div>
  );
}
