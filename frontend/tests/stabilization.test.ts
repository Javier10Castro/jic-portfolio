import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useConversationStore } from '@/store/conversationStore';
import { usePipelineStore } from '@/store/pipelineStore';
import { useDeploymentStore } from '@/store/deploymentStore';
import { usePreviewStore } from '@/store/previewStore';
import { useSummaryStore } from '@/store/summaryStore';
import { syncEngine, PersistentCache } from '@/lib/sync/sync-engine';
import {
  EventSubscriptionService,
  type ConnectionStatus,
  type ServerEvent,
} from '@/services/events';
import { PIPELINE_STAGES } from '@/types/pipeline';
import type { DeploymentRecord } from '@/types/deployment';
import type { ProjectSummary } from '@/types/summary';

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

describe('Scenario 1 — Full flow: New conversation → Answer questions → Generate → Preview → Deploy → Success', () => {
  it('creates conversation with correct initial state', () => {
    const id = useConversationStore.getState().createConversation('My Project');
    const state = useConversationStore.getState();
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].id).toBe(id);
    expect(state.conversations[0].title).toBe('My Project');
    expect(state.conversations[0].status).toBe('active');
    expect(state.conversations[0].messages).toEqual([]);
    expect(state.activeConversationId).toBe(id);
  });

  it('adds user and assistant messages to conversation', () => {
    const id = useConversationStore.getState().createConversation();
    useConversationStore.getState().addMessage(id, { role: 'user', content: 'Build a landing page', type: 'text' });
    useConversationStore.getState().addMessage(id, { role: 'assistant', content: 'Let me ask a few questions.', type: 'text' });
    const messages = useConversationStore.getState().conversations[0].messages;
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('Build a landing page');
    expect(messages[1].role).toBe('assistant');
    expect(messages[1].content).toBe('Let me ask a few questions.');
  });

  it('starts pipeline with all stages initialized', () => {
    usePipelineStore.getState().startPipeline('project-1');
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline).not.toBeNull();
    expect(pipeline!.projectId).toBe('project-1');
    expect(pipeline!.stages).toHaveLength(PIPELINE_STAGES.length);
    expect(pipeline!.status).toBe('running');
    expect(pipeline!.stages[0].status).toBe('running');
    expect(pipeline!.currentStage).toBe(PIPELINE_STAGES[0].name);
  });

  it('advances through pipeline stages', () => {
    usePipelineStore.getState().startPipeline('project-1');
    usePipelineStore.getState().completeStage('conversation');
    expect(usePipelineStore.getState().pipeline!.currentStage).toBe('questions');
    usePipelineStore.getState().advanceStage('questions');
    expect(usePipelineStore.getState().pipeline!.stages.find(s => s.name === 'questions')?.status).toBe('running');
    usePipelineStore.getState().completeStage('questions');
    expect(usePipelineStore.getState().pipeline!.currentStage).toBe('context');
  });

  it('transitions deployment from idle to deploying to deployed', () => {
    const deployStore = useDeploymentStore.getState();
    expect(deployStore.deployment.status).toBe('idle');
    deployStore.setStatus('deploying');
    expect(useDeploymentStore.getState().deployment.status).toBe('deploying');
    deployStore.setUrl('https://myapp.vercel.app');
    expect(useDeploymentStore.getState().deployment.status).toBe('deployed');
    expect(useDeploymentStore.getState().deployment.url).toBe('https://myapp.vercel.app');
  });

  it('preview store receives a URL', () => {
    usePreviewStore.getState().setPreviewUrl('https://preview.example.com');
    const { preview } = usePreviewStore.getState();
    expect(preview.url).toBe('https://preview.example.com');
    expect(preview.status).toBe('ready');
  });
});

describe('Scenario 2 — Refresh during generation → Resume → Continue → Deploy', () => {
  it('syncEngine.hydrate restores conversation state from cached snapshot', () => {
    const conversationState = {
      conversations: [
        { id: 'c1', title: 'Resumed', messages: [], status: 'active', context: { intent: { type: '', confidence: 0, label: '' }, entities: [], missingFields: [], progress: 0 }, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      ],
      activeConversationId: 'c1',
      isStreaming: false,
      isGenerating: false,
    };
    sessionStorage.setItem('studio:sync:conversation', JSON.stringify(conversationState));
    useConversationStore.setState({ conversations: [], activeConversationId: null, isStreaming: false, isGenerating: false });
    const adapter = {
      getName: () => 'conversation',
      getState: () => useConversationStore.getState() as unknown as Record<string, unknown>,
      setState: (data: Record<string, unknown>) => {
        const d = data as unknown as { conversations?: unknown[]; activeConversationId?: string | null; isStreaming?: boolean; isGenerating?: boolean };
        useConversationStore.setState({
          conversations: (d.conversations || []) as never,
          activeConversationId: d.activeConversationId ?? null,
          isStreaming: d.isStreaming ?? false,
          isGenerating: d.isGenerating ?? false,
        });
      },
      getBackendState: async () => ({}),
      merge: (_b: Record<string, unknown>, l: Record<string, unknown>) => l,
      validate: () => [],
    };
    syncEngine.registerStore('conversation', adapter);
    syncEngine.hydrate();
    const state = useConversationStore.getState();
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].id).toBe('c1');
    expect(state.conversations[0].title).toBe('Resumed');
    expect(state.activeConversationId).toBe('c1');
  });

  it('pipeline state can be restored from cache', () => {
    const pipelineState = {
      pipeline: {
        projectId: 'p1',
        stages: PIPELINE_STAGES.map((s, i) => ({
          name: s.name,
          label: s.label,
          status: i === 0 ? 'completed' : i === 1 ? 'running' : 'pending',
          progress: i === 0 ? 100 : i === 1 ? 50 : 0,
          logs: [],
        })),
        currentStage: 'questions',
        status: 'running',
        startedAt: '2025-01-01T00:00:00Z',
        logs: [],
      },
    };
    sessionStorage.setItem('studio:sync:pipeline', JSON.stringify(pipelineState));
    usePipelineStore.setState({ pipeline: null });
    const adapter = {
      getName: () => 'pipeline',
      getState: () => {
        const p = usePipelineStore.getState().pipeline;
        return (p ? { pipeline: p } : {}) as unknown as Record<string, unknown>;
      },
      setState: (data: Record<string, unknown>) => {
        const d = data as unknown as { pipeline?: unknown };
        if (d.pipeline) usePipelineStore.getState().setPipelineFromApi(d.pipeline as never);
      },
      getBackendState: async () => ({}),
      merge: (_b: Record<string, unknown>, l: Record<string, unknown>) => l,
      validate: () => [],
    };
    syncEngine.registerStore('pipeline', adapter);
    syncEngine.hydrate();
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline).not.toBeNull();
    expect(pipeline!.projectId).toBe('p1');
    expect(pipeline!.currentStage).toBe('questions');
    expect(pipeline!.status).toBe('running');
    const questionsStage = pipeline!.stages.find(s => s.name === 'questions');
    expect(questionsStage?.status).toBe('running');
    expect(questionsStage?.progress).toBe(50);
  });

  it('setPipelineFromApi restores pipeline state correctly', () => {
    const restoredPipeline = {
      projectId: 'restored',
      stages: PIPELINE_STAGES.map((s) => ({
        name: s.name,
        label: s.label,
        status: 'completed' as const,
        progress: 100,
        logs: [],
      })),
      currentStage: 'workspace',
      status: 'completed' as const,
      startedAt: '2025-01-01T00:00:00Z',
      logs: [],
    };
    usePipelineStore.getState().setPipelineFromApi(restoredPipeline);
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline).not.toBeNull();
    expect(pipeline!.projectId).toBe('restored');
    expect(pipeline!.status).toBe('completed');
    expect(pipeline!.currentStage).toBe('workspace');
    expect(pipeline!.stages.every(s => s.status === 'completed')).toBe(true);
  });

  it('preserves active conversation ID after hydration', () => {
    useConversationStore.getState().createConversation('Session Project');
    const originalId = useConversationStore.getState().activeConversationId;
    const convState = {
      conversations: useConversationStore.getState().conversations,
      activeConversationId: originalId,
      isStreaming: false,
      isGenerating: false,
    };
    sessionStorage.setItem('studio:sync:conversation', JSON.stringify(convState));
    useConversationStore.setState({ conversations: [], activeConversationId: null, isStreaming: false, isGenerating: false });
    const adapter = {
      getName: () => 'conversation',
      getState: () => useConversationStore.getState() as unknown as Record<string, unknown>,
      setState: (data: Record<string, unknown>) => {
        const d = data as unknown as { conversations?: unknown[]; activeConversationId?: string | null; isStreaming?: boolean; isGenerating?: boolean };
        useConversationStore.setState({
          conversations: (d.conversations || []) as never,
          activeConversationId: d.activeConversationId ?? null,
          isStreaming: d.isStreaming ?? false,
          isGenerating: d.isGenerating ?? false,
        });
      },
      getBackendState: async () => ({}),
      merge: (_b: Record<string, unknown>, l: Record<string, unknown>) => l,
      validate: () => [],
    };
    syncEngine.registerStore('conversation', adapter);
    syncEngine.hydrate();
    expect(useConversationStore.getState().activeConversationId).toBe(originalId);
  });
});

describe('Scenario 3 — SSE disconnect → Reconnect → Continue', () => {
  it('EventSubscriptionService connect/disconnect/reconnect transitions status correctly', () => {
    const service = new EventSubscriptionService();
    expect(service.status).toBe('disconnected');
    const statuses: ConnectionStatus[] = [];
    service.onStatusChange((s) => statuses.push(s));
    const mockEventSource = vi.fn(() => ({
      close: vi.fn(),
      onopen: null as (() => void) | null,
      onerror: null as (() => void) | null,
      addEventListener: vi.fn(),
    }));
    vi.stubGlobal('EventSource', mockEventSource);
    service.connect('test-token');
    service.disconnect();
    expect(service.status).toBe('disconnected');
    service.connect('test-token');
    service.reconnect();
    expect(statuses).toContain('reconnecting');
    service.disconnect();
    vi.unstubAllGlobals();
  });

  it('on method registers callback and delivers events', () => {
    const service = new EventSubscriptionService();
    const cb = vi.fn();
    service.on('build.complete', cb);
    const fakeEvent: ServerEvent = { type: 'build.complete', payload: { status: 'ok' }, id: 'e1' };
    const mockEs = {
      close: vi.fn(),
      onopen: null as (() => void) | null,
      onerror: null as (() => void) | null,
      addEventListener: vi.fn((_event: string, handler: (e: MessageEvent) => void) => {
        handler(new MessageEvent('event', { data: JSON.stringify(fakeEvent) }));
      }),
    };
    vi.stubGlobal('EventSource', vi.fn(() => mockEs));
    service.connect('t');
    expect(cb).toHaveBeenCalledWith(fakeEvent);
    service.disconnect();
    vi.unstubAllGlobals();
  });

  it('getStatus returns correct counts', () => {
    const service = new EventSubscriptionService();
    const status = service.getStatus();
    expect(status).toHaveProperty('status');
    expect(status).toHaveProperty('lastEventTime');
    expect(status).toHaveProperty('reconnectCount');
    expect(status).toHaveProperty('totalEvents');
    expect(status).toHaveProperty('lastEventId');
    expect(status.totalEvents).toBe(0);
    expect(status.reconnectCount).toBe(0);
    expect(status.status).toBe('disconnected');
    service.disconnect();
  });
});

describe('Scenario 4 — Deployment failure → Retry → Success', () => {
  it('transitions idle → deploying → failed → deploying → deployed', () => {
    const deploy = useDeploymentStore.getState();
    expect(deploy.deployment.status).toBe('idle');
    deploy.setStatus('deploying');
    expect(useDeploymentStore.getState().deployment.status).toBe('deploying');
    deploy.setStatus('failed');
    expect(useDeploymentStore.getState().deployment.status).toBe('failed');
    deploy.setStatus('deploying');
    expect(useDeploymentStore.getState().deployment.status).toBe('deploying');
    deploy.setUrl('https://retry.vercel.app');
    expect(useDeploymentStore.getState().deployment.status).toBe('deployed');
    expect(useDeploymentStore.getState().deployment.url).toBe('https://retry.vercel.app');
  });

  it('addLog records errors during failure', () => {
    const deploy = useDeploymentStore.getState();
    deploy.addLog({ level: 'info', message: 'Deployment started' });
    deploy.addLog({ level: 'error', message: 'Build failed: missing dependency' });
    deploy.addLog({ level: 'info', message: 'Retrying deployment' });
    const { logs } = useDeploymentStore.getState().deployment;
    expect(logs).toHaveLength(3);
    expect(logs[0].message).toBe('Deployment started');
    expect(logs[1].level).toBe('error');
    expect(logs[1].message).toBe('Build failed: missing dependency');
    expect(logs[2].message).toBe('Retrying deployment');
  });

  it('addToHistory preserves failed deployment records', () => {
    const failedRecord: DeploymentRecord = {
      id: 'dep-fail-1',
      projectId: 'p1',
      url: 'https://fail.vercel.app',
      version: 'v1-fail',
      deployedAt: new Date().toISOString(),
      status: 'failed',
      environment: 'development',
    };
    useDeploymentStore.getState().addToHistory(failedRecord);
    expect(useDeploymentStore.getState().deployment.history).toHaveLength(1);
    expect(useDeploymentStore.getState().deployment.history[0].status).toBe('failed');
    const successRecord: DeploymentRecord = {
      id: 'dep-succ-1',
      projectId: 'p1',
      url: 'https://success.vercel.app',
      version: 'v2',
      deployedAt: new Date().toISOString(),
      status: 'success',
      environment: 'development',
    };
    useDeploymentStore.getState().addToHistory(successRecord);
    expect(useDeploymentStore.getState().deployment.history).toHaveLength(2);
    expect(useDeploymentStore.getState().deployment.history[0].status).toBe('success');
    expect(useDeploymentStore.getState().deployment.history[1].status).toBe('failed');
  });

  it('can retry deployment after failure', () => {
    const deploy = useDeploymentStore.getState();
    deploy.setStatus('failed');
    deploy.addLog({ level: 'error', message: 'Network timeout' });
    deploy.addLog({ level: 'info', message: 'Retrying...' });
    deploy.setStatus('deploying');
    deploy.setUrl('https://retried.vercel.app');
    const final = useDeploymentStore.getState().deployment;
    expect(final.status).toBe('deployed');
    expect(final.url).toBe('https://retried.vercel.app');
    expect(final.logs).toHaveLength(2);
  });
});

describe('Scenario 5 — Browser closed → Resume next session', () => {
  it('PersistentCache saves and loads data from sessionStorage', () => {
    const cache = new PersistentCache('test:');
    const data = { conversations: [{ id: 'c1' }], activeConversationId: 'c1' };
    cache.save('conversation', data);
    const loaded = cache.load<typeof data>('conversation');
    expect(loaded).toEqual(data);
  });

  it('PersistentCache returns null for missing keys', () => {
    const cache = new PersistentCache('test:');
    expect(cache.load('nonexistent')).toBeNull();
  });

  it('PersistentCache clear removes specific key', () => {
    const cache = new PersistentCache('test:');
    cache.save('key1', { value: 1 });
    cache.save('key2', { value: 2 });
    cache.clear('key1');
    expect(cache.load('key1')).toBeNull();
    expect(cache.load('key2')).toEqual({ value: 2 });
  });

  it('PersistentCache clearAll removes all prefixed keys', () => {
    const cache = new PersistentCache('test:');
    cache.save('a', { x: 1 });
    cache.save('b', { y: 2 });
    sessionStorage.setItem('other', 'keep');
    cache.clearAll();
    expect(cache.load('a')).toBeNull();
    expect(cache.load('b')).toBeNull();
    expect(sessionStorage.getItem('other')).toBe('keep');
  });

  it('syncEngine.hydrate restores state from sessionStorage', () => {
    const conversationState = {
      conversations: [
        { id: 'c2', title: 'Resumed Session', messages: [], status: 'active', context: { intent: { type: '', confidence: 0, label: '' }, entities: [], missingFields: [], progress: 0 }, createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z' },
      ],
      activeConversationId: 'c2',
      isStreaming: false,
      isGenerating: false,
    };
    sessionStorage.setItem('studio:sync:conversation', JSON.stringify(conversationState));
    useConversationStore.setState({ conversations: [], activeConversationId: null, isStreaming: false, isGenerating: false });
    const adapter = {
      getName: () => 'conversation',
      getState: () => useConversationStore.getState() as unknown as Record<string, unknown>,
      setState: (data: Record<string, unknown>) => {
        const d = data as unknown as { conversations?: unknown[]; activeConversationId?: string | null; isStreaming?: boolean; isGenerating?: boolean };
        useConversationStore.setState({
          conversations: (d.conversations || []) as never,
          activeConversationId: d.activeConversationId ?? null,
          isStreaming: d.isStreaming ?? false,
          isGenerating: d.isGenerating ?? false,
        });
      },
      getBackendState: async () => ({}),
      merge: (_b: Record<string, unknown>, l: Record<string, unknown>) => l,
      validate: () => [],
    };
    syncEngine.registerStore('conversation', adapter);
    syncEngine.hydrate();
    const state = useConversationStore.getState();
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].id).toBe('c2');
    expect(state.activeConversationId).toBe('c2');
  });

  it('state survives a simulated session lifecycle', () => {
    const cache = new PersistentCache('studio:sync:');
    const summaryData: ProjectSummary = {
      name: 'Session Project',
      pages: [{ name: 'home' }],
      features: [{ name: 'auth', description: 'Login', priority: 'essential' }],
      colorPalette: ['#000'],
      typography: 'Inter',
      deploymentTarget: 'vercel',
      estimatedCost: 50,
      estimatedTokens: 2000,
      estimatedTime: 15,
    };
    useSummaryStore.getState().setSummary(summaryData);
    useConversationStore.getState().createConversation('Session Project');
    const convId = useConversationStore.getState().activeConversationId;
    useConversationStore.getState().addMessage(convId!, { role: 'user', content: 'Build my site', type: 'text' });
    usePipelineStore.getState().startPipeline('p-session');
    usePreviewStore.getState().setPreviewUrl('https://preview.session.dev');
    useDeploymentStore.getState().setUrl('https://session.vercel.app');
    useSummaryStore.getState().setEditing(true);
    cache.save('conversation', useConversationStore.getState());
    cache.save('pipeline', { pipeline: usePipelineStore.getState().pipeline });
    cache.save('deployment', useDeploymentStore.getState().deployment);
    cache.save('preview', usePreviewStore.getState().preview);
    cache.save('summary', { summary: useSummaryStore.getState().summary, editing: useSummaryStore.getState().editing });
    useConversationStore.setState({ conversations: [], activeConversationId: null, isStreaming: false, isGenerating: false });
    usePipelineStore.setState({ pipeline: null });
    useDeploymentStore.setState({ deployment: { status: 'idle', url: null, logs: [], history: [], environment: 'development' } });
    usePreviewStore.setState({ preview: { url: null, html: null, status: 'idle', device: 'desktop' } });
    useSummaryStore.setState({ summary: null, editing: false });
    const loadedConv = cache.load<ReturnType<typeof useConversationStore.getState>>('conversation');
    const loadedPipeline = cache.load<{ pipeline: unknown }>('pipeline');
    const loadedDeploy = cache.load<ReturnType<typeof useDeploymentStore.getState>['deployment']>('deployment');
    const loadedPreview = cache.load<ReturnType<typeof usePreviewStore.getState>['preview']>('preview');
    const loadedSummary = cache.load<{ summary: unknown; editing: boolean }>('summary');
    expect(loadedConv?.conversations).toHaveLength(1);
    expect(loadedConv?.activeConversationId).toBe(convId);
    expect(loadedPipeline?.pipeline).not.toBeNull();
    expect(loadedDeploy?.status).toBe('deployed');
    expect(loadedDeploy?.url).toBe('https://session.vercel.app');
    expect(loadedPreview?.url).toBe('https://preview.session.dev');
    expect(loadedSummary?.summary).not.toBeNull();
    expect(loadedSummary?.editing).toBe(true);
  });
});
