import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePipelineStore } from '@/store/pipelineStore';
import { usePreviewStore } from '@/store/previewStore';
import { useDeploymentStore } from '@/store/deploymentStore';
import { useConversationStore } from '@/store/conversationStore';
import { useSummaryStore } from '@/store/summaryStore';
import { PIPELINE_STAGES } from '@/types/pipeline';

beforeEach(() => {
  useConversationStore.setState({ conversations: [], activeConversationId: null, isStreaming: false, isGenerating: false });
  usePipelineStore.setState({ pipeline: null });
  useDeploymentStore.setState({ deployment: { status: 'idle', url: null, logs: [], history: [], environment: 'development' } });
  usePreviewStore.setState({ preview: { url: null, html: null, status: 'idle', device: 'desktop' } });
  useSummaryStore.setState({ summary: null, editing: false });
});

afterEach(() => {
  sessionStorage.clear();
});

describe('Live build — Pipeline lifecycle integration', () => {
  it('pipeline can start, run stages, and complete', () => {
    usePipelineStore.getState().startPipeline('proj-1');
    expect(usePipelineStore.getState().pipeline?.status).toBe('running');

    PIPELINE_STAGES.forEach((s) => {
      usePipelineStore.getState().completeStage(s.name);
    });

    expect(usePipelineStore.getState().pipeline?.status).toBe('completed');
    expect(usePipelineStore.getState().pipeline?.stages.every((s) => s.status === 'completed')).toBe(true);
  });

  it('stage failure pauses pipeline', () => {
    usePipelineStore.getState().startPipeline('proj-2');
    usePipelineStore.getState().completeStage('conversation');
    usePipelineStore.getState().failStage('questions', 'Invalid response format');
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline?.status).toBe('failed');
    const failedStage = pipeline?.stages.find((s) => s.name === 'questions');
    expect(failedStage?.status).toBe('failed');
    expect(failedStage?.error).toBe('Invalid response format');
  });

  it('retryStage resets failure', () => {
    usePipelineStore.getState().startPipeline('proj-3');
    usePipelineStore.getState().failStage('questions', 'Error');
    usePipelineStore.getState().retryStage('questions');
    const stage = usePipelineStore.getState().pipeline?.stages.find((s) => s.name === 'questions');
    expect(stage?.status).toBe('running');
    expect(stage?.progress).toBe(0);
    expect(usePipelineStore.getState().pipeline?.status).toBe('running');
  });

  it('setStageProgress updates progress', () => {
    usePipelineStore.getState().startPipeline('proj-4');
    usePipelineStore.getState().setStageProgress('conversation', 50);
    usePipelineStore.getState().setStageProgress('conversation', 100);
    const stage = usePipelineStore.getState().pipeline?.stages.find((s) => s.name === 'conversation');
    expect(stage?.progress).toBe(100);
  });

  it('addLog adds entries to pipeline and stage', () => {
    usePipelineStore.getState().startPipeline('proj-5');
    usePipelineStore.getState().addLog({ level: 'info', message: 'Pipeline started', stage: 'conversation' });
    expect(usePipelineStore.getState().pipeline?.logs).toHaveLength(1);
    const stage = usePipelineStore.getState().pipeline?.stages.find((s) => s.name === 'conversation');
    expect(stage?.logs).toHaveLength(1);
  });
});

describe('Live build — Preview lifecycle', () => {
  it('transitions idle → loading → ready', () => {
    expect(usePreviewStore.getState().preview.status).toBe('idle');
    usePreviewStore.getState().setPreviewStatus('loading');
    expect(usePreviewStore.getState().preview.status).toBe('loading');
    usePreviewStore.getState().setPreviewStatus('ready');
    expect(usePreviewStore.getState().preview.status).toBe('ready');
  });

  it('setPreviewUrl sets url and status ready', () => {
    usePreviewStore.getState().setPreviewUrl('https://preview.dev');
    const { preview } = usePreviewStore.getState();
    expect(preview.url).toBe('https://preview.dev');
    expect(preview.status).toBe('ready');
  });

  it('resetPreview resets to idle', () => {
    usePreviewStore.getState().setPreviewUrl('https://preview.dev');
    usePreviewStore.getState().resetPreview();
    expect(usePreviewStore.getState().preview.status).toBe('idle');
    expect(usePreviewStore.getState().preview.url).toBeNull();
  });
});

describe('Live build — Deployment lifecycle', () => {
  it('transitions idle → building → deploying → deployed', () => {
    const deploy = useDeploymentStore.getState();
    expect(deploy.deployment.status).toBe('idle');
    deploy.setStatus('building');
    expect(useDeploymentStore.getState().deployment.status).toBe('building');
    deploy.setStatus('deploying');
    expect(useDeploymentStore.getState().deployment.status).toBe('deploying');
    deploy.setUrl('https://app.vercel.app');
    expect(useDeploymentStore.getState().deployment.status).toBe('deployed');
  });

  it('resetDeployment clears state', () => {
    useDeploymentStore.getState().setUrl('https://app.vercel.app');
    useDeploymentStore.getState().resetDeployment();
    expect(useDeploymentStore.getState().deployment.status).toBe('idle');
    expect(useDeploymentStore.getState().deployment.url).toBeNull();
  });
});

describe('Live build — Conversation orchestration', () => {
  it('creates conversation and adds messages', () => {
    const id = useConversationStore.getState().createConversation('Build App');
    useConversationStore.getState().addMessage(id, { role: 'user', content: 'Hello', type: 'text' });
    useConversationStore.getState().addMessage(id, { role: 'assistant', content: 'Hi', type: 'text' });
    const messages = useConversationStore.getState().conversations[0].messages;
    expect(messages).toHaveLength(2);
  });

  it('setActiveConversation switches context', () => {
    useConversationStore.getState().createConversation('Project A');
    useConversationStore.getState().createConversation('Project B');
    const convB = useConversationStore.getState().conversations[1];
    useConversationStore.getState().setActiveConversation(convB.id);
    expect(useConversationStore.getState().activeConversationId).toBe(convB.id);
  });
});
