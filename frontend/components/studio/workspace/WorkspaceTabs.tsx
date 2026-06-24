'use client';

import { EDITOR_TABS, ArtifactType } from '@/types/workspace';
import { cn } from '@/utils/cn';

interface Props {
  activeTab: ArtifactType | null;
  onTabChange: (tab: ArtifactType) => void;
}

export default function WorkspaceTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2">
      {EDITOR_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
            activeTab === tab.id
              ? 'border-blue-500 text-blue-700 dark:text-blue-300'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
