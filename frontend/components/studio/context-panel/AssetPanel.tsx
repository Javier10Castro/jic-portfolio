'use client';

import { Image, FileText, File, Upload } from 'lucide-react';
import type { Asset } from '@/types/conversation';

const typeIcons = {
  image: Image,
  logo: Image,
  document: FileText,
  other: File,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AssetPanelProps {
  assets: Asset[];
}

export default function AssetPanel({ assets }: AssetPanelProps) {
  return (
    <div className="space-y-2">
      {assets.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500">No assets uploaded</p>
      )}
      {assets.map((asset) => {
        const Icon = typeIcons[asset.type] || File;
        return (
          <div
            key={asset.id}
            className="flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2"
          >
            <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{asset.name}</p>
              {asset.size && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatSize(asset.size)}</p>
              )}
            </div>
          </div>
        );
      })}
      <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors">
        <Upload className="w-4 h-4" />
        Upload
      </button>
    </div>
  );
}
