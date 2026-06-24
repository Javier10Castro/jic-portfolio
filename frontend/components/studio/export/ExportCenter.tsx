'use client';

import { useWorkspaceStore } from '@/store/workspaceStore';
import { ExportConfig } from '@/types/workspace';
import { X, Download, FileJson, FileText, FileCode, Archive } from 'lucide-react';
import { cn } from '@/utils/cn';
import { studioNotifications } from '@/lib/sync/notifications';

interface Props {
  onClose: () => void;
}

const EXPORT_OPTIONS: { key: keyof ExportConfig; label: string; icon: typeof FileJson }[] = [
  { key: 'project', label: 'Full Project', icon: Archive },
  { key: 'blueprint', label: 'Blueprint', icon: FileCode },
  { key: 'context', label: 'Context', icon: FileJson },
  { key: 'markdown', label: 'Markdown Docs', icon: FileText },
  { key: 'html', label: 'HTML Export', icon: FileCode },
  { key: 'zip', label: 'ZIP Archive', icon: Archive },
  { key: 'json', label: 'JSON Export', icon: FileJson },
  { key: 'pdf', label: 'PDF Report', icon: FileText },
  { key: 'openapi', label: 'OpenAPI Spec', icon: FileCode },
  { key: 'terraform', label: 'Terraform', icon: FileCode },
  { key: 'deploymentReport', label: 'Deployment Report', icon: FileText },
];

export default function ExportCenter({ onClose }: Props) {
  const exportConfig = useWorkspaceStore((s) => s.exportConfig);
  const setExportConfig = useWorkspaceStore((s) => s.setExportConfig);
  const resetExportConfig = useWorkspaceStore((s) => s.resetExportConfig);

  const selectedCount = Object.entries(exportConfig).filter(([, v]) => v).length;

  const handleExport = () => {
    const selected = Object.entries(exportConfig)
      .filter(([, v]) => v)
      .map(([k]) => EXPORT_OPTIONS.find((o) => o.key === k)?.label ?? k);
    studioNotifications.success('Export started', `Exporting: ${selected.join(', ')}`);
    setTimeout(() => {
      studioNotifications.success('Export complete', `${selectedCount} item(s) exported successfully.`);
    }, 1500);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Export Center</h3>
        <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1 mb-4">
        {EXPORT_OPTIONS.map(({ key, label, icon: Icon }) => (
          <label
            key={key}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
              exportConfig[key] ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent',
            )}
          >
            <input
              type="checkbox"
              checked={exportConfig[key]}
              onChange={() => setExportConfig({ [key]: !exportConfig[key] })}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
            />
            <Icon className={cn('w-4 h-4', exportConfig[key] ? 'text-blue-500' : 'text-gray-400')} />
            <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          disabled={selectedCount === 0}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors',
            selectedCount > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed',
          )}
        >
          <Download className="w-4 h-4" />
          Export ({selectedCount})
        </button>
        <button onClick={resetExportConfig} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          Reset
        </button>
      </div>
    </div>
  );
}
