'use client';

import { usePreviewStore } from '@/store/previewStore';
import { Monitor, Tablet, Smartphone, RotateCw, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import DeviceFrame from './DeviceFrame';

const deviceButtons = [
  { device: 'desktop' as const, icon: Monitor, label: 'Desktop' },
  { device: 'tablet' as const, icon: Tablet, label: 'Tablet' },
  { device: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
];

export default function LivePreview() {
  const preview = usePreviewStore((s) => s.preview);
  const setDevice = usePreviewStore((s) => s.setDevice);
  const setPreviewStatus = usePreviewStore((s) => s.setPreviewStatus);

  const handleRefresh = () => {
    setPreviewStatus('loading');
    setTimeout(() => setPreviewStatus('ready'), 500);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          {deviceButtons.map(({ device, icon: Icon, label }) => (
            <button
              key={device}
              onClick={() => setDevice(device)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                preview.device === device
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400',
              )}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors"
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          {preview.url && (
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      <div className="p-4">
        {preview.status === 'loading' && (
          <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
        {preview.status === 'idle' && (
          <div className="flex items-center justify-center h-64 text-sm text-gray-400 dark:text-gray-500">
            Preview not available
          </div>
        )}
        {preview.status === 'error' && (
          <div className="flex items-center justify-center h-64 text-sm text-red-500">
            {preview.error || 'Failed to load preview'}
          </div>
        )}
        {(preview.status === 'ready' || preview.status === 'loading') && preview.html && (
          <DeviceFrame device={preview.device}>
            <iframe
              srcDoc={preview.html}
              className="w-full h-64 bg-white"
              title="Live Preview"
            />
          </DeviceFrame>
        )}
        {preview.status === 'ready' && preview.url && !preview.html && (
          <DeviceFrame device={preview.device}>
            <iframe
              src={preview.url}
              className="w-full h-64 bg-white"
              title="Live Preview"
            />
          </DeviceFrame>
        )}
      </div>
    </div>
  );
}
