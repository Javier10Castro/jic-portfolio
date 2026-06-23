'use client';

import { useEffect, useRef } from 'react';
import { useConversation } from '@/hooks/use-conversation';
import { usePipelineStore } from '@/store/pipelineStore';
import { usePreviewStore } from '@/store/previewStore';
import { useDeploymentStore } from '@/store/deploymentStore';
import { useSummaryStore } from '@/store/summaryStore';
import ChatWindow from '@/components/studio/conversation/ChatWindow';
import ConversationHeader from '@/components/studio/conversation/ConversationHeader';
import PromptInput from '@/components/studio/conversation/PromptInput';
import SuggestedQuestions from '@/components/studio/conversation/SuggestedQuestions';
import BuildPipeline from '@/components/studio/pipeline/BuildPipeline';
import LivePreview from '@/components/studio/preview/LivePreview';
import ProjectSummary from '@/components/studio/summary/ProjectSummary';
import DeploymentPanel from '@/components/studio/deployment/DeploymentPanel';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function StudioChatPage() {
  const {
    activeConv,
    messages,
    isGenerating,
    startNewConversation,
    sendMessage,
    generateProject,
    deployProject,
  } = useConversation();
  const pipeline = usePipelineStore((s) => s.pipeline);
  const preview = usePreviewStore((s) => s.preview);
  const deployment = useDeploymentStore((s) => s.deployment);
  const summary = useSummaryStore((s) => s.summary);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!activeConv && typeof window !== 'undefined') {
      startNewConversation();
    }
  }, []);

  useEffect(() => {
    if (inputRef.current && activeConv) {
      inputRef.current.focus();
    }
  }, [activeConv]);

  if (!activeConv) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={<Sparkles className="h-16 w-16" />}
          title="AI Product Studio"
          description="Start a conversation to build your application."
          action={
            <Button onClick={() => startNewConversation()} size="lg">
              Start New Project
            </Button>
          }
        />
      </div>
    );
  }

  const showPipeline = pipeline !== null;
  const showPreview = preview.status === 'ready';
  const showSummary = summary !== null && !showPreview;
  const showDeployment = deployment.status !== 'idle';

  return (
    <div className="flex-1 flex flex-col h-full">
      <ConversationHeader
        title={activeConv.title}
        status={activeConv.status}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <ChatWindow messages={messages}>
          {showSummary && <ProjectSummary />}
          {showDeployment && <DeploymentPanel onDeploy={deployProject} />}
          {showPreview && <LivePreview />}
        </ChatWindow>

        {showPipeline && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <BuildPipeline />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="p-3">
          {pipeline ? (
            <div className="flex gap-2">
              {deployment.status === 'idle' && (
                <Button onClick={generateProject} loading={isGenerating} className="w-full">
                  {isGenerating ? 'Generating...' : 'Generate Website'}
                </Button>
              )}
              {deployment.status === 'deployed' && (
                <Button onClick={deployProject} className="w-full">
                  Deploy to Production
                </Button>
              )}
            </div>
          ) : (
            <>
              {activeConv.context.missingFields.length === 0 && !isGenerating && messages.length > 3 && (
                <SuggestedQuestions
                  questions={[
                    'What colors do you want?',
                    'How many pages?',
                    'What features?',
                    'When do you need it?',
                  ]}
                  onSelect={(q) => sendMessage(q)}
                />
              )}
              <PromptInput
                onSend={sendMessage}
                disabled={isGenerating}
                placeholder="Describe your project..."
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
