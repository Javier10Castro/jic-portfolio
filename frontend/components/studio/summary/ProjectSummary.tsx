'use client';

import { useSummaryStore } from '@/store/summaryStore';
import { DeploymentTarget } from '@/types/summary';
import { Edit3, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useState } from 'react';

const deploymentOptions: DeploymentTarget[] = ['vercel', 'netlify', 'aws', 'gcp', 'azure'];

export default function ProjectSummary() {
  const summary = useSummaryStore((s) => s.summary);
  const editing = useSummaryStore((s) => s.editing);
  const setEditing = useSummaryStore((s) => s.setEditing);
  const updateSummary = useSummaryStore((s) => s.updateSummary);

  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (!summary) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No summary available</p>
      </div>
    );
  }

  const startEdit = (field: string, currentValue: string) => {
    if (!editing) return;
    setEditField(field);
    setEditValue(currentValue);
  };

  const saveEdit = (field: string) => {
    if (field === 'name') updateSummary({ name: editValue });
    if (field === 'typography') updateSummary({ typography: editValue });
    if (field === 'deploymentTarget') updateSummary({ deploymentTarget: editValue as DeploymentTarget });
    if (field === 'estimatedCost') updateSummary({ estimatedCost: Number(editValue) });
    if (field === 'estimatedTokens') updateSummary({ estimatedTokens: Number(editValue) });
    if (field === 'estimatedTime') updateSummary({ estimatedTime: Number(editValue) });
    setEditField(null);
  };

  const renderEditable = (field: string, label: string, value: string | number, type: 'text' | 'number' | 'select' = 'text') => {
    const isEditing = editField === field;
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              {type === 'select' ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="text-xs rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  {deploymentOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="text-xs rounded border border-gray-300 bg-white px-2 py-1 w-20 text-right dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  autoFocus
                />
              )}
              <button onClick={() => saveEdit(field)} className="p-0.5 text-green-500 hover:text-green-600">
                <Check className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-900 dark:text-gray-100">{value}</span>
              {editing && (
                <button onClick={() => startEdit(field, String(value))} className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Project Summary</h2>
        <button
          onClick={() => setEditing(!editing)}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            editing
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
          )}
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-2">
        {renderEditable('name', 'Name', summary.name)}
        {renderEditable('typography', 'Typography', summary.typography)}
        {renderEditable('deploymentTarget', 'Deployment', summary.deploymentTarget, 'select')}
        {renderEditable('estimatedCost', 'Est. Cost', `$${summary.estimatedCost}`, 'number')}
        {renderEditable('estimatedTokens', 'Est. Tokens', summary.estimatedTokens.toLocaleString(), 'number')}
        {renderEditable('estimatedTime', 'Est. Time', `${summary.estimatedTime}min`, 'number')}

        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Color Palette</p>
          <div className="flex gap-1.5 flex-wrap">
            {summary.colorPalette.map((color, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-600"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {summary.pages.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Pages</p>
            <div className="space-y-0.5">
              {summary.pages.map((page, idx) => (
                <p key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                  {page.name} <span className="text-gray-400">{page.route}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {summary.features.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Features</p>
            <div className="space-y-0.5">
              {summary.features.map((feature, idx) => (
                <p key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                  {feature.name} {feature.included ? '✅' : '❌'}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
