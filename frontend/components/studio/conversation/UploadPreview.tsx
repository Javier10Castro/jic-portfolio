'use client';

import { X, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

interface UploadPreviewProps {
  files: { name: string; size: number; type: string }[];
  onRemove: (index: number) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPreview({ files, onRemove }: UploadPreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {files.map((file, index) => {
        const isImage = file.type.startsWith('image/');

        return (
          <div
            key={index}
            className={cn(
              'relative group flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm'
            )}
          >
            {isImage ? (
              <div className="h-8 w-8 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                <div className="h-full w-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center text-[8px] text-gray-500">
                  IMG
                </div>
              </div>
            ) : (
              <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            <div className="min-w-0 max-w-[180px]">
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
              <p className="text-[10px] text-gray-400">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-gray-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-700"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
