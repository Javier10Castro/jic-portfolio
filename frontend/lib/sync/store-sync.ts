import { syncEngine, type StoreAdapter } from './sync-engine';
import { useConversationStore } from '@/store/conversationStore';
import { usePipelineStore } from '@/store/pipelineStore';
import { usePreviewStore } from '@/store/previewStore';
import { useDeploymentStore } from '@/store/deploymentStore';
import { useSummaryStore } from '@/store/summaryStore';
import api from '@/services/api';

function createConversationAdapter(): StoreAdapter {
  return {
    getName: () => 'conversation',
    getState: () => useConversationStore.getState() as unknown as Record<string, unknown>,
    setState: (data) => {
      const s = useConversationStore.getState();
      const d = data as unknown as {
        conversations?: unknown[];
        activeConversationId?: string | null;
        isStreaming?: boolean;
        isGenerating?: boolean;
      };
      if (d.conversations) s.conversations = d.conversations as never;
      if (d.activeConversationId !== undefined) s.activeConversationId = d.activeConversationId ?? null;
      if (d.isStreaming !== undefined) s.isStreaming = d.isStreaming;
      if (d.isGenerating !== undefined) s.isGenerating = d.isGenerating;
    },
    getBackendState: async () => {
      try {
        const res = await api.listConversations();
        const data = (res as unknown as Record<string, unknown>).data as Record<string, unknown>[] | undefined;
        return { conversations: data || [] } as unknown as Record<string, unknown>;
      } catch {
        return { conversations: [] };
      }
    },
    merge: (backend, _local) => {
      const bConvs = (backend.conversations || []) as Array<Record<string, unknown>>;
      return { conversations: bConvs } as unknown as Record<string, unknown>;
    },
    validate: () => [],
  };
}

function createPipelineAdapter(): StoreAdapter {
  return {
    getName: () => 'pipeline',
    getState: () => {
      const p = usePipelineStore.getState().pipeline;
      return (p ? { pipeline: p } : {}) as unknown as Record<string, unknown>;
    },
    setState: (data) => {
      const d = data as unknown as { pipeline?: unknown };
      if (d.pipeline) usePipelineStore.getState().setPipelineFromApi(d.pipeline as never);
    },
    getBackendState: async () => {
      const p = usePipelineStore.getState().pipeline;
      if (!p?.projectId) return {};
      try {
        const res = await api.getPipeline(p.projectId);
        const data = (res as unknown as Record<string, unknown>).data as Record<string, unknown> | undefined;
        return { pipeline: data || {} };
      } catch {
        return {};
      }
    },
    merge: (backend, _local) => {
      const bp = backend.pipeline as Record<string, unknown> | undefined;
      return bp ? { pipeline: bp } as unknown as Record<string, unknown> : _local;
    },
    validate: () => [],
  };
}

function createPreviewAdapter(): StoreAdapter {
  return {
    getName: () => 'preview',
    getState: () => usePreviewStore.getState().preview as unknown as Record<string, unknown>,
    setState: (data) => {
      const store = usePreviewStore.getState();
      store.resetPreview();
      const d = data as unknown as {
        url?: string | null; html?: string | null;
        status?: string; device?: string; error?: string;
      };
      if (d.url) store.setPreviewUrl(d.url);
      if (d.html) store.setPreviewHtml(d.html);
      if (d.status) store.setPreviewStatus(d.status as never);
      if (d.device) store.setDevice(d.device as never);
      if (d.error) store.setError(d.error);
    },
    getBackendState: async () => ({}),
    merge: (_backend, local) => local,
    validate: () => [],
  };
}

function createDeploymentAdapter(): StoreAdapter {
  return {
    getName: () => 'deployment',
    getState: () => useDeploymentStore.getState().deployment as unknown as Record<string, unknown>,
    setState: (data) => {
      const store = useDeploymentStore.getState();
      store.resetDeployment();
      const d = data as unknown as {
        status?: string; url?: string | null;
        environment?: string; history?: unknown[];
      };
      if (d.status) store.setStatus(d.status as never);
      if (d.url) store.setUrl(d.url);
      if (d.environment) store.setEnvironment(d.environment as never);
      if (d.history) d.history.forEach((h) => store.addToHistory(h as never));
    },
    getBackendState: async () => ({}),
    merge: (_backend, local) => local,
    validate: () => [],
  };
}

function createSummaryAdapter(): StoreAdapter {
  return {
    getName: () => 'summary',
    getState: () => {
      const s = useSummaryStore.getState();
      return { summary: s.summary, editing: s.editing } as unknown as Record<string, unknown>;
    },
    setState: (data) => {
      const d = data as unknown as { summary?: unknown; editing?: boolean };
      const store = useSummaryStore.getState();
      if (d.summary) store.setSummary(d.summary as never);
      if (d.editing !== undefined) store.setEditing(d.editing);
    },
    getBackendState: async () => ({}),
    merge: (_backend, local) => local,
    validate: () => [],
  };
}

export function registerSyncAdapters(): void {
  syncEngine.registerStore('conversation', createConversationAdapter());
  syncEngine.registerStore('pipeline', createPipelineAdapter());
  syncEngine.registerStore('preview', createPreviewAdapter());
  syncEngine.registerStore('deployment', createDeploymentAdapter());
  syncEngine.registerStore('summary', createSummaryAdapter());
}
