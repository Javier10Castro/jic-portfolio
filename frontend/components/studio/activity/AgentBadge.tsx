'use client';

import type { PropsWithChildren } from 'react';

interface Props {
  name: string;
  size?: 'sm' | 'md';
}

const AGENT_COLORS: Record<string, string> = {
  Planner: 'bg-blue-500',
  Claude: 'bg-purple-500',
  GPT: 'bg-green-500',
  Gemini: 'bg-orange-500',
  'SEO Optimizer': 'bg-teal-500',
  Generator: 'bg-pink-500',
  Designer: 'bg-indigo-500',
};

function getColor(name: string): string {
  return AGENT_COLORS[name] ?? 'bg-gray-500';
}

export default function AgentBadge({ name, size = 'sm' }: Props) {
  const dotSize = size === 'md' ? 'h-2.5 w-2.5' : 'h-2 w-2';
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 ${textSize}`}>
      <span className={`inline-block rounded-full ${dotSize} ${getColor(name)}`} />
      <span className="font-medium text-gray-700 dark:text-gray-300">{name}</span>
    </span>
  );
}
