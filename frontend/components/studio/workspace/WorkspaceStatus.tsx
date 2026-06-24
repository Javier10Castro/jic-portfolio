'use client';

import { useWorkspaceStore } from '@/store/workspaceStore';
import { APPROVAL_LABELS, APPROVAL_COLORS } from '@/types/workspace';
import { cn } from '@/utils/cn';

export default function WorkspaceStatus() {
  const artifacts = useWorkspaceStore((s) => s.artifacts);
  const editor = useWorkspaceStore((s) => s.editor);

  const total = artifacts.length;
  const approved = artifacts.filter((a) => a.approval === 'approved').length;
  const rejected = artifacts.filter((a) => a.approval === 'rejected').length;
  const pending = total - approved - rejected;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-[11px] text-gray-500 dark:text-gray-400">
      <span>{total} artifacts</span>
      <span className="text-green-600 dark:text-green-400">{approved} approved</span>
      {pending > 0 && <span className="text-yellow-600 dark:text-yellow-400">{pending} pending</span>}
      {rejected > 0 && <span className="text-red-600 dark:text-red-400">{rejected} rejected</span>}
      <span className="flex-1" />
      {editor.isDirty && <span className="text-yellow-600 dark:text-yellow-400">Unsaved changes</span>}
      {editor.isEditing && !editor.isDirty && <span className="text-gray-400">Editing</span>}
    </div>
  );
}
