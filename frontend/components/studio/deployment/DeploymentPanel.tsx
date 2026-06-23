'use client';

import { useDeploymentStore } from '@/store/deploymentStore';
import { Rocket, RotateCcw, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import DeploymentLog from './DeploymentLog';

interface DeploymentPanelProps {
  onDeploy?: () => void;
}

const envOptions = [
  { value: 'development' as const, label: 'Dev' },
  { value: 'staging' as const, label: 'Staging' },
  { value: 'production' as const, label: 'Prod' },
];

const statusLabels: Record<string, string> = {
  idle: 'Ready to deploy',
  building: 'Building...',
  deploying: 'Deploying...',
  deployed: 'Deployed',
  failed: 'Failed',
};

export default function DeploymentPanel({ onDeploy }: DeploymentPanelProps) {
  const deployment = useDeploymentStore((s) => s.deployment);
  const setEnvironment = useDeploymentStore((s) => s.setEnvironment);
  const rollback = useDeploymentStore((s) => s.rollback);

  const handleDeploy = () => {
    onDeploy?.();
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Deployment</h2>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {envOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setEnvironment(value)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-md transition-colors',
                deployment.environment === value
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {statusLabels[deployment.status]}
            </p>
            {deployment.url && (
              <a
                href={deployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                {deployment.url}
              </a>
            )}
          </div>
          <button
            onClick={handleDeploy}
            disabled={deployment.status === 'building' || deployment.status === 'deploying'}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              deployment.status === 'building' || deployment.status === 'deploying'
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700',
            )}
          >
            <Rocket className="w-4 h-4" />
            Deploy
          </button>
        </div>

        {deployment.history.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Deployment History</p>
            <div className="space-y-1">
              {deployment.history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                      v{record.version}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {new Date(record.deployedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                      record.status === 'success' && 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                      record.status === 'failed' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                      record.status === 'rolled-back' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
                    )}>
                      {record.status}
                    </span>
                    <button
                      onClick={() => rollback(record.version)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Rollback"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Deployment Logs</span>
        </div>
        <div className="max-h-40 overflow-y-auto p-3 space-y-1">
          {deployment.logs.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">No logs yet</p>
          )}
          {deployment.logs.map((entry) => (
            <DeploymentLog key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
