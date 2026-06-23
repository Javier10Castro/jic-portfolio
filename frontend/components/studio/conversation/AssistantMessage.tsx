'use client';

import { cn } from '@/utils/cn';
import { Bot } from 'lucide-react';
import type { Message } from '@/types/conversation';
import MarkdownRenderer from './MarkdownRenderer';

interface AssistantMessageProps {
  message: Message;
}

export default function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      </div>
      <div
        className={cn(
          'flex-1 rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          message.streaming && 'animate-pulse'
        )}
      >
        <MarkdownRenderer content={message.content} />
      </div>
    </div>
  );
}
