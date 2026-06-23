'use client';

import MarkdownRenderer from './MarkdownRenderer';

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
}

export default function StreamingMessage({ content, isStreaming }: StreamingMessageProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <MarkdownRenderer content={content} />
        {isStreaming && (
          <span className="inline-block h-4 w-2 bg-blue-500 dark:bg-blue-400 ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}
