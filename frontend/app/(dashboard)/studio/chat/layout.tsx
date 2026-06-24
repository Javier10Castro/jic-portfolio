'use client';

import { useConversationStore } from '@/store/conversationStore';
import ConversationList from '@/components/studio/conversation/ConversationList';
import LiveContextPanel from '@/components/studio/context-panel/LiveContextPanel';
import StudioDiagnosticsPanel from '@/components/studio/diagnostics/StudioDiagnosticsPanel';
import { useStudioRecovery } from '@/hooks/use-studio-recovery';
import { useIsTablet } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';
import { useState } from 'react';

export default function StudioChatLayout({ children }: { children: React.ReactNode }) {
  useStudioRecovery();
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const isTablet = useIsTablet();
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Left Column — Conversation List */}
      <div
        className={cn(
          'w-72 lg:w-80 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 flex-shrink-0 overflow-y-auto',
          isTablet && !showLeft && 'hidden',
          isTablet && showLeft && 'fixed inset-0 z-50 w-full'
        )}
      >
        {isTablet && showLeft && (
          <button
            onClick={() => setShowLeft(false)}
            className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <ConversationList />
      </div>

      {/* Center Column — Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">
        {isTablet && (
          <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <button
              onClick={() => setShowLeft(true)}
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              Conversations
            </button>
            {activeConversationId && (
              <button
                onClick={() => setShowRight(!showRight)}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400 ml-auto"
              >
                {showRight ? 'Hide Context' : 'Show Context'}
              </button>
            )}
          </div>
        )}
        {children}
      </div>

      {/* Right Column — Context Panel */}
      {activeConversationId && (
        <div
          className={cn(
            'w-80 xl:w-96 border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 flex-shrink-0 overflow-y-auto',
            isTablet && !showRight && 'hidden',
            isTablet && showRight && 'fixed inset-0 z-50 w-full'
          )}
        >
          {isTablet && showRight && (
            <button
              onClick={() => setShowRight(false)}
              className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 z-10"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <LiveContextPanel />
        </div>
      )}
      <StudioDiagnosticsPanel />
    </div>
  );
}
