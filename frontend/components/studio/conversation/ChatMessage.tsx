'use client';

import type { Message } from '@/types/conversation';
import AssistantMessage from './AssistantMessage';
import UserMessage from './UserMessage';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'system') return null;

  if (message.role === 'assistant') {
    return (
      <div className="flex justify-start">
        <AssistantMessage message={message} />
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <UserMessage message={message} />
    </div>
  );
}
