'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { Message } from '@/types/conversation';
import { useConversationStore } from '@/store/conversationStore';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

interface ChatWindowProps {
  messages: Message[];
  children?: ReactNode;
}

export default function ChatWindow({ messages, children }: ChatWindowProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isStreaming = useConversationStore((s) => s.isStreaming);

  useEffect(() => {
    sentinelRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {isStreaming && <TypingIndicator />}
      {children}
      <div ref={sentinelRef} />
    </div>
  );
}
