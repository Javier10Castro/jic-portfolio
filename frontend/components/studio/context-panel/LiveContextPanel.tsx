'use client';

import { useState } from 'react';
import { useConversationStore } from '@/store/conversationStore';
import { useConversation } from '@/hooks/use-conversation';
import { ChevronDown, ChevronRight, Target, Database, Building2, FileText, ListTodo, HelpCircle, Paperclip, BarChart3 } from 'lucide-react';
import { cn } from '@/utils/cn';
import IntentDisplay from './IntentDisplay';
import EntitiesPanel from './EntitiesPanel';
import BrandPanel from './BrandPanel';
import FeaturesPanel from './FeaturesPanel';
import MissingFields from './MissingFields';
import AssetPanel from './AssetPanel';

interface SectionConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  render: () => React.ReactNode;
}

export default function LiveContextPanel() {
  const conversation = useConversationStore((s) => s.getActiveConversation());
  const { answerQuestion } = useConversation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const context = conversation?.context;

  const toggle = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const sections: SectionConfig[] = [
    {
      key: 'intent',
      label: 'Intent',
      icon: Target,
      render: () => context?.intent ? <IntentDisplay intent={context.intent} /> : null,
    },
    {
      key: 'entities',
      label: 'Entities',
      icon: Database,
      render: () => context?.entities ? <EntitiesPanel entities={context.entities} /> : null,
    },
    {
      key: 'brand',
      label: 'Brand',
      icon: Building2,
      render: () => context?.brand ? <BrandPanel brand={context.brand} /> : null,
    },
    {
      key: 'pages',
      label: 'Pages',
      icon: FileText,
      render: () => {
        const pages = context?.pages;
        if (!pages || pages.length === 0) return <p className="text-xs text-gray-400 dark:text-gray-500">No pages defined</p>;
        return (
          <div className="space-y-1">
            {pages.map((page, idx) => (
              <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{page.name}</span>
                {page.route && <span className="text-gray-400 dark:text-gray-500 ml-1 text-xs">{page.route}</span>}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: 'features',
      label: 'Features',
      icon: ListTodo,
      render: () => context?.features ? <FeaturesPanel features={context.features} /> : null,
    },
    {
      key: 'missingFields',
      label: 'Missing Fields',
      icon: HelpCircle,
      render: () => {
        const fields = context?.missingFields;
        if (!fields) return null;
        return (
          <MissingFields
            fields={fields}
            onAnswer={(field, value) => {
              answerQuestion(field, value);
            }}
          />
        );
      },
    },
    {
      key: 'assets',
      label: 'Assets',
      icon: Paperclip,
      render: () => context?.assets ? <AssetPanel assets={context.assets} /> : null,
    },
    {
      key: 'progress',
      label: 'Progress',
      icon: BarChart3,
      render: () => {
        const progress = context?.progress ?? 0;
        return (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Completion</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Project Context</h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {sections.map((section) => {
          const Icon = section.icon;
          const isCollapsed = collapsed[section.key];
          return (
            <div key={section.key}>
              <button
                onClick={() => toggle(section.key)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}
                <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{section.label}</span>
              </button>
              {!isCollapsed && (
                <div className="px-4 pb-3 pt-1">
                  {section.render()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
