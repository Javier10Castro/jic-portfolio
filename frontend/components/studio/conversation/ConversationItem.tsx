'use client';

import { cn } from '@/utils/cn';
import { formatRelativeTime, truncate } from '@/utils/format';
import type { Conversation } from '@/types/conversation';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export default function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-3 rounded-lg transition-colors',
        isActive
          ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            'text-sm font-medium truncate flex-1',
            isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'
          )}
        >
          {truncate(conversation.title, 30)}
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">
          {formatRelativeTime(conversation.updatedAt)}
        </span>
      </div>
      {lastMessage && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
          {truncate(lastMessage.content, 40)}
        </p>
      )}
      {isActive && <div className="h-1 w-1 rounded-full bg-blue-500 mt-1.5" />}
    </button>
  );
}
