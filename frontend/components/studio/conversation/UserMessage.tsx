'use client';

import { User } from 'lucide-react';
import type { Message } from '@/types/conversation';

interface UserMessageProps {
  message: Message;
}

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex items-start gap-3 flex-row-reverse">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
      </div>
      <div className="flex-1 rounded-2xl px-4 py-3 bg-blue-600 text-white max-w-[80%]">
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
