'use client';

import { Type, Bold, Italic, Link, List } from 'lucide-react';
import { cn } from '@/utils/cn';

const tools = [
  { icon: Type, label: 'Edit' },
  { icon: Bold, label: 'Bold' },
  { icon: Italic, label: 'Italic' },
  { icon: Link, label: 'Link' },
  { icon: List, label: 'List' },
];

export default function MessageToolbar() {
  return (
    <div className="flex items-center gap-0.5">
      {tools.map((tool) => (
        <button
          key={tool.label}
          type="button"
          title={tool.label}
          className={cn(
            'h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors'
          )}
        >
          <tool.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
