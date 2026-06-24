'use client';

import { useEffect, useRef, useState } from 'react';
import { useStudioOrchestrator } from '@/hooks/use-studio-orchestrator';
import { usePipelineStore } from '@/store/pipelineStore';
import { usePreviewStore } from '@/store/previewStore';
import { useDeploymentStore } from '@/store/deploymentStore';
import { useSummaryStore } from '@/store/summaryStore';
import { eventService } from '@/services/events';
import ChatWindow from '@/components/studio/conversation/ChatWindow';
import ConversationHeader from '@/components/studio/conversation/ConversationHeader';
import PromptInput from '@/components/studio/conversation/PromptInput';
import SuggestedQuestions from '@/components/studio/conversation/SuggestedQuestions';
import ActivityFeed from '@/components/studio/activity/ActivityFeed';
import BuildTimeline from '@/components/studio/timeline/BuildTimeline';
import BuildPipeline from '@/components/studio/pipeline/BuildPipeline';
import LivePreview from '@/components/studio/preview/LivePreview';
import ProjectSummary from '@/components/studio/summary/ProjectSummary';
import DeploymentPanel from '@/components/studio/deployment/DeploymentPanel';
import CostWidget from '@/components/studio/widgets/CostWidget';
import PipelineAnalytics from '@/components/studio/analytics/PipelineAnalytics';
import ArtifactViewer from '@/components/studio/artifacts/ArtifactViewer';
import StageInspector from '@/components/studio/stage-inspector/StageInspector';
import Workspace from '@/components/studio/workspace/Workspace';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ArtifactType, ApprovalStatus } from '@/types/workspace';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Sparkles, Activity, BarChart3, Eye, Package, Columns } from 'lucide-react';
import type { ActivityEvent } from '@/components/studio/activity/types';
import type { StageResult } from '@/services/pipeline-executor';

export default function StudioChatPage() {
  const {
    activeConv,
    messages,
    isGenerating,
    phase,
    activeStage,
    stageResults,
    startConversation,
    sendMessage,
    runPipeline,
    cancelPipeline,
    resumePipeline,
    deploy,
    restart,
    getCurrentStageInfo,
  } = useStudioOrchestrator();

  const pipeline = usePipelineStore((s) => s.pipeline);
  const preview = usePreviewStore((s) => s.preview);
  const deployment = useDeploymentStore((s) => s.deployment);
  const summary = useSummaryStore((s) => s.summary);
  const workspaceArtifacts = useWorkspaceStore((s) => s.artifacts);
  const addArtifact = useWorkspaceStore((s) => s.addArtifact);
  const setActiveEditor = useWorkspaceStore((s) => s.setActiveEditor);
  const addConsoleEntry = useWorkspaceStore((s) => s.addConsoleEntry);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStage, setSelectedStage] = useState<StageResult | null>(null);
  const [showTab, setShowTab] = useState<'pipeline' | 'analytics' | 'artifacts' | 'workspace'>('pipeline');
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [artifacts, setArtifacts] = useState<Array<{ id: string; name: string; type: string; content: string; stage: string }>>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; message: string }>>([]);

  useEffect(() => {
    if (!activeConv && typeof window !== 'undefined') {
      startConversation();
    }
  }, []);

  useEffect(() => {
    if (inputRef.current && activeConv) {
      inputRef.current.focus();
    }
  }, [activeConv]);

  useEffect(() => {
    const unsubPreview = eventService.on('preview.updated', () => {
      setRefreshKey((k) => k + 1);
    });
    const unsubBuildFinished = eventService.on('build.finished', () => {
      setTimeout(() => setRefreshKey((k) => k + 1), 1000);
    });
    const unsubDeploy = eventService.on('deployment.completed', () => {
      setTimeout(() => setRefreshKey((k) => k + 1), 500);
    });
    return () => { unsubPreview(); unsubBuildFinished(); unsubDeploy(); };
  }, []);

  useEffect(() => {
    if (stageResults.length === 0) return;
    const latest = stageResults[stageResults.length - 1];
    const event: ActivityEvent = {
      id: `act_${Date.now()}_${stageResults.length}`,
      stage: latest.name,
      agent: latest.provider || latest.name.charAt(0).toUpperCase() + latest.name.slice(1),
      action: latest.status === 'completed' ? 'completed' : latest.status === 'failed' ? 'failed' : 'processing',
      status: latest.status as ActivityEvent['status'],
      timestamp: Date.now(),
      duration: latest.duration,
      detail: latest.error || undefined,
    };
    setActivityEvents((prev) => [event, ...prev].slice(0, 50));

    if (latest.status === 'completed' && latest.output) {
      const content = JSON.stringify(latest.output, null, 2);
      setArtifacts((prev) => [...prev, {
        id: `art_${Date.now()}`,
        name: `${latest.name} Output`,
        type: latest.name,
        content,
        stage: latest.name,
      }]);
    }
  }, [stageResults]);

  useEffect(() => {
    if (stageResults.length === 0 || workspaceArtifacts.length > 0) return;
    const artifactTypes: Record<string, { type: ArtifactType; name: string }> = {
      conversation: { type: 'blueprint', name: 'Blueprint' },
      questions: { type: 'context', name: 'Context' },
      context: { type: 'context', name: 'Project Context' },
      planner: { type: 'design', name: 'Design Plan' },
      design: { type: 'design', name: 'Design Tokens' },
      content: { type: 'content', name: 'Page Content' },
      generation: { type: 'code', name: 'Generated Code' },
      postprocessing: { type: 'code', name: 'Processed Code' },
      deployment: { type: 'deployment', name: 'Deployment Config' },
      workspace: { type: 'metadata', name: 'Workspace Metadata' },
    };
    stageResults.forEach((sr) => {
      const mapping = artifactTypes[sr.name];
      if (mapping && sr.status === 'completed') {
        addArtifact({
          id: `art_${sr.name}`,
          type: mapping.type,
          name: mapping.name,
          content: JSON.stringify(sr.output || { status: 'completed' }, null, 2),
          approval: 'draft' as ApprovalStatus,
          currentVersion: 1,
          provider: sr.provider,
          tokens: sr.tokens,
          cost: sr.cost,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        addConsoleEntry({
          id: `ce_artifact_${sr.name}`,
          type: 'info' as const,
          message: `Artifact created: ${mapping.name}`,
          timestamp: Date.now(),
        });
      }
    });
  }, [stageResults, workspaceArtifacts.length]);

  if (!activeConv) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={<Sparkles className="h-16 w-16" />}
          title="AI Product Studio"
          description="Start a conversation to build your application."
          action={
            <Button onClick={() => startConversation()} size="lg">
              Start New Project
            </Button>
          }
        />
      </div>
    );
  }

  const showPipeline = pipeline !== null || phase === 'building' || phase === 'cancelled';
  const showPreview = preview.status === 'ready';
  const showSummary = summary !== null && !showPreview;
  const showDeployment = deployment.status !== 'idle';
  const stageInfo = getCurrentStageInfo();

  return (
    <div className="flex-1 flex flex-col h-full">
      <ConversationHeader
        title={activeConv.title}
        status={activeConv.status}
      />

      {showPipeline && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs">
          <button onClick={() => setShowTab('pipeline')} className={`px-2 py-1 rounded ${showTab === 'pipeline' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <Activity className="w-3 h-3 inline mr-1" />Pipeline
          </button>
          <button onClick={() => setShowTab('analytics')} className={`px-2 py-1 rounded ${showTab === 'analytics' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <BarChart3 className="w-3 h-3 inline mr-1" />Analytics
          </button>
          <button onClick={() => setShowTab('artifacts')} className={`px-2 py-1 rounded ${showTab === 'artifacts' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <Package className="w-3 h-3 inline mr-1" />Artifacts
          </button>
          {workspaceArtifacts.length > 0 && (
            <button onClick={() => setShowTab('workspace')} className={`px-2 py-1 rounded ${showTab === 'workspace' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <Columns className="w-3 h-3 inline mr-1" />Workspace
            </button>
          )}
          {phase === 'building' && (
            <button onClick={cancelPipeline} className="ml-auto px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
              Cancel
            </button>
          )}
          {phase === 'failed' && (
            <button onClick={resumePipeline} className="ml-auto px-2 py-1 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded">
              Retry
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        <ChatWindow messages={messages}>
          {showSummary && <ProjectSummary />}
          {showDeployment && <DeploymentPanel onDeploy={deploy} />}
          {showPreview && <LivePreview key={refreshKey} />}
        </ChatWindow>

        {showTab === 'workspace' && workspaceArtifacts.length > 0 && (
          <div className="flex-1 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
            <Workspace />
          </div>
        )}

        {showPipeline && showTab !== 'workspace' && (
          <div className="border-t border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[45vh]">
            {showTab === 'pipeline' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                <div className="lg:col-span-2 p-3 border-r border-gray-200 dark:border-gray-700">
                  <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <BuildPipeline />
                      <div className="mt-3">
                        <CostWidget stages={stageResults} />
                      </div>
                    </div>
                    <div className="w-48 shrink-0 hidden lg:block">
                      <BuildTimeline stages={stageResults} currentStage={activeStage} onStageClick={setSelectedStage} />
                    </div>
                  </div>
                </div>
                <div className="p-3 max-h-[45vh] overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Activity</p>
                  <ActivityFeed events={activityEvents} />
                </div>
              </div>
            )}

            {showTab === 'analytics' && (
              <div className="p-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <PipelineAnalytics stages={stageResults} />
                  {stageInfo && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Current Stage</p>
                      <StageInspector stage={stageInfo} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {showTab === 'artifacts' && (
              <div className="p-3">
                <ArtifactViewer artifacts={artifacts} onDownload={(a) => {
                  const blob = new Blob([a.content], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const aEl = document.createElement('a');
                  aEl.href = url; aEl.download = `${a.stage}-${a.name}.json`;
                  aEl.click(); URL.revokeObjectURL(url);
                }} />
              </div>
            )}

            {selectedStage && (
              <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center" onClick={() => setSelectedStage(null)}>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="p-4">
                    <StageInspector stage={{
                      ...selectedStage,
                      status: selectedStage.status,
                      progress: selectedStage.status === 'running' ? 50 : selectedStage.status === 'completed' ? 100 : 0,
                    }} />
                    <button onClick={() => setSelectedStage(null)} className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="p-3">
          {showPipeline ? (
            <div className="flex gap-2">
              {deployment.status === 'idle' && phase !== 'failed' && phase !== 'cancelled' && (
                <Button onClick={runPipeline} loading={isGenerating} className="w-full">
                  {isGenerating ? 'Building...' : 'Build & Deploy'}
                </Button>
              )}
              {phase === 'failed' && (
                <Button onClick={resumePipeline} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                  Retry Failed Stages
                </Button>
              )}
              {phase === 'cancelled' && (
                <Button onClick={restart} className="w-full">
                  Start Over
                </Button>
              )}
              {deployment.status === 'deployed' && (
                <Button onClick={deploy} className="w-full">
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
