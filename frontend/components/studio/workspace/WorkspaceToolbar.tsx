'use client';

import {
  Save, Undo2, Redo2, RotateCcw, RefreshCw, Download,
  CheckCircle2, XCircle, MessageSquare, Expand, Eye,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  isEditing: boolean;
  isDirty: boolean;
  approval?: string;
  artifactName?: string;
  onEdit: () => void;
  onSave: () => void;
  onReset: () => void;
  onRegenerate: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCompare: () => void;
  onComment: () => void;
  onExpand: () => void;
}

export default function WorkspaceToolbar({
  isEditing, isDirty, approval, artifactName,
  onEdit, onSave, onReset, onRegenerate,
  onApprove, onReject, onCompare, onComment, onExpand,
}: Props) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex-1 flex items-center gap-1">
        {artifactName && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">{artifactName}</span>
        )}
        {isEditing && (
          <>
            <button onClick={onSave} disabled={!isDirty} className={cn('p-1.5 rounded transition-colors', isDirty ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-gray-300 dark:text-gray-600')} title="Save">
              <Save className="w-4 h-4" />
            </button>
            <button onClick={onReset} className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300" title="Reset">
              <Undo2 className="w-4 h-4" />
            </button>
            <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
          </>
        )}
        <button onClick={onRegenerate} className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300" title="Regenerate">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={onCompare} className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300" title="Compare versions">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={onExpand} className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300" title="Expand">
          <Expand className="w-4 h-4" />
        </button>
        <button onClick={onComment} className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300" title="Comment">
          <MessageSquare className="w-4 h-4" />
        </button>
        <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
        <button onClick={onEdit} className={cn('p-1.5 rounded transition-colors', isEditing ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300')} title="Toggle edit">
          <Undo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        {approval && (
          <>
            <button onClick={onApprove} className="p-1.5 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" title="Approve">
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <button onClick={onReject} className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Reject">
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
        <button className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300" title="Export">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
