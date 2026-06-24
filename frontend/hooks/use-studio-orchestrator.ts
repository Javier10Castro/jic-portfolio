'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from './use-conversation';
import { pipelineExecutor, type StageResult, type PipelineStageName } from '@/services/pipeline-executor';
import { eventService, getAuthToken } from '@/services';
import { usePipelineStore } from '@/store/pipelineStore';
import { useDeploymentStore } from '@/store/deploymentStore';
import { usePreviewStore } from '@/store/previewStore';
import { useSummaryStore } from '@/store/summaryStore';
import { useConversationStore } from '@/store/conversationStore';
import { studioNotifications } from '@/lib/sync/notifications';
import { observability } from '@/lib/sync/observability';
import { syncEngine } from '@/lib/sync/sync-engine';
import api from '@/services/api';

export type OrchestratorPhase =
  | 'idle'
  | 'conversation'
  | 'building'
  | 'deploying'
  | 'completed'
  | 'failed'
  | 'cancelled';

export function useStudioOrchestrator() {
  const conv = useConversation();
  const [phase, setPhase] = useState<OrchestratorPhase>('idle');
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [stageResults, setStageResults] = useState<StageResult[]>([]);
  const executorRef = useRef(pipelineExecutor);
  const abortRef = useRef(false);

  const pipelineStore = usePipelineStore();
  const deploymentStore = useDeploymentStore();
  const previewStore = usePreviewStore();
  const summaryStore = useSummaryStore();
  const conversationStore = useConversationStore();


  const currentStage = usePipelineStore((s) => s.pipeline?.currentStage ?? null);
  const pipelineStatus = usePipelineStore((s) => s.pipeline?.status ?? null);

  useEffect(() => {
    const unsubBuildStart = eventService.on('build.started', () => {
      setPhase('building');
    });
    const unsubBuildFinish = eventService.on('build.finished', () => {
      setPhase('completed');
      setTimeout(() => {
        previewStore.setPreviewStatus('loading');
      }, 500);
    });
    const unsubBuildFail = eventService.on('build.failed', () => {
      setPhase('failed');
    });
    const unsubDeployStart = eventService.on('deployment.started', () => {
      setPhase('deploying');
    });
    const unsubDeployComplete = eventService.on('deployment.completed', () => {
      setPhase('completed');
    });
    const unsubDeployFail = eventService.on('deployment.failed', () => {
      setPhase('failed');
    });

    const unsubStage = eventService.on('pipeline.status', (event) => {
      const payload = event.payload as Record<string, string> | undefined;
      if (payload?.currentStage) {
        setActiveStage(payload.currentStage);
      }
    });

    return () => {
      unsubBuildStart();
      unsubBuildFinish();
      unsubBuildFail();
      unsubDeployStart();
      unsubDeployComplete();
      unsubDeployFail();
      unsubStage();
    };
  }, [previewStore]);

  const startConversation = useCallback(async (title?: string) => {
    setPhase('conversation');
    const id = await conv.startNewConversation(title);
    return id;
  }, [conv]);

  const sendMessage = useCallback(async (text: string) => {
    await conv.sendMessage(text);
  }, [conv]);

  const answerQuestion = useCallback(async (field: string, value: string | string[] | boolean) => {
    await conv.answerQuestion(field, value);
  }, [conv]);

  const runPipeline = useCallback(async () => {
    const convId = conversationStore.activeConversationId;
    if (!convId) return;

    setPhase('building');
    setStageResults([]);
    setActiveStage(null);
    abortRef.current = false;
    executorRef.current.reset();
    observability.startMark('orchestrator.pipeline');

    const token = getAuthToken();
    if (token) eventService.connect(token);

    executorRef.current.onStage((stage, result) => {
      setActiveStage(stage);
      setStageResults((prev) => {
        const filtered = prev.filter((s) => s.name !== stage);
        return [...filtered, result];
      });

      const stageStore = usePipelineStore.getState();
      if (result.status === 'running') {
        stageStore.advanceStage(stage as never);
      } else if (result.status === 'completed') {
        stageStore.completeStage(stage as never);
        studioNotifications.success(`Stage completed`, `${stage} finished`);
      } else if (result.status === 'failed') {
        stageStore.failStage(stage as never, result.error || 'Unknown error');
        studioNotifications.error(`Stage failed`, `${stage}: ${result.error}`);
      }

      if (result.provider) {
        observability.track(`provider.${result.provider}`, result.duration, { stage, tokens: result.tokens, cost: result.cost });
      }
    });

    const results = await executorRef.current.execute(convId);
    observability.endMark('orchestrator.pipeline');

    if (abortRef.current) {
      setPhase('cancelled');
      studioNotifications.info('Pipeline cancelled', 'The build was cancelled.');
      return results;
    }

    const allCompleted = results.every((r) => r.status === 'completed');
    const hasDeployment = results.find((r) => r.name === 'deployment');

    if (allCompleted) {
      setPhase(hasDeployment ? 'completed' : 'building');
      studioNotifications.success('Build complete', 'All pipeline stages finished successfully.');
      syncEngine.persist();

      setTimeout(() => {
        previewStore.setPreviewStatus('loading');
        setTimeout(() => {
          previewStore.setPreviewStatus('ready');
        }, 1000);
      }, 500);
    } else {
      setPhase('failed');
      studioNotifications.error('Build failed', 'One or more pipeline stages failed.');
    }

    return results;
  }, [conversationStore]);

  const cancelPipeline = useCallback(async () => {
    abortRef.current = true;
    executorRef.current.cancel();
    const p = usePipelineStore.getState().pipeline;
    if (p?.projectId) {
      try {
        await api.cancelPipeline(p.projectId);
      } catch { /* ignore */ }
    }
    studioNotifications.info('Cancelling', 'Stopping the build pipeline...');
    setPhase('cancelled');
  }, [pipelineStore]);

  const resumePipeline = useCallback(async () => {
    const convId = conversationStore.activeConversationId;
    const pipeline = pipelineStore.pipeline;
    if (!convId || !pipeline) {
      studioNotifications.warning('Nothing to resume', 'No active pipeline found.');
      return;
    }

    const failedStage = usePipelineStore.getState().pipeline?.stages.find((s) => s.status === 'failed');
    if (failedStage) {
      try {
        usePipelineStore.getState().retryStage(failedStage.name as never);
      } catch { /* ignore */ }
    }

    studioNotifications.info('Resuming', 'Continuing the build pipeline...');
    return runPipeline();
  }, [conversationStore, pipelineStore, runPipeline]);

  const deploy = useCallback(async () => {
    await conv.deployProject();
    setPhase('completed');
    studioNotifications.success('Deployment complete', 'Your project has been deployed.');
  }, [conv]);

  const restart = useCallback(async () => {
    abortRef.current = true;
    executorRef.current.cancel();
    pipelineStore.resetPipeline();
    deploymentStore.resetDeployment();
    previewStore.resetPreview();
    summaryStore.clearSummary();
    setPhase('idle');
    setActiveStage(null);
    setStageResults([]);
    executorRef.current.reset();
    abortRef.current = false;
    syncEngine.persist();
  }, [pipelineStore, deploymentStore, previewStore, summaryStore]);

  const recover = useCallback(async () => {
    const snapshot = loadOrchestratorSnapshot();
    if (!snapshot) return false;

    syncEngine.hydrate();
    const token = getAuthToken();
    if (token) eventService.connect(token);

    if (snapshot.pipelineActive) {
      setPhase('building');
      setActiveStage(snapshot.activeStage);
      try {
        await syncEngine.sync();
      } catch { /* ignore */ }
    } else if (snapshot.deploymentActive) {
      setPhase('deploying');
    } else if (snapshot.phase === 'conversation') {
      setPhase('conversation');
    }

    studioNotifications.info('Session restored', 'Your previous session has been recovered.');
    return true;
  }, []);

  const getCurrentStageInfo = useCallback(() => {
    const p = pipelineStore.pipeline;
    if (!p) return null;
    const stage = p.stages.find((s) => s.name === p.currentStage);
    const result = stageResults.find((r) => r.name === p.currentStage);
    return {
      name: p.currentStage,
      status: stage?.status ?? 'unknown',
      progress: stage?.progress ?? 0,
      duration: result?.duration ?? 0,
      error: result?.error ?? null,
      output: result?.output ?? null,
      provider: result?.provider ?? null,
      tokens: result?.tokens ?? null,
      cost: result?.cost ?? null,
    };
  }, [pipelineStore.pipeline, stageResults]);

  return {
    ...conv,
    phase,
    activeStage,
    stageResults,
    currentStage,
    pipelineStatus,
    startConversation,
    sendMessage,
    answerQuestion,
    runPipeline,
    cancelPipeline,
    resumePipeline,
    deploy,
    restart,
    recover,
    getCurrentStageInfo,
  };
}

interface OrchestratorSnapshot {
  phase: string;
  pipelineActive: boolean;
  deploymentActive: boolean;
  activeStage: string | null;
  timestamp: number;
}

function loadOrchestratorSnapshot(): OrchestratorSnapshot | null {
  try {
    const raw = sessionStorage.getItem('studio:orchestrator');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrchestratorSnapshot;
    if (Date.now() - parsed.timestamp > 3600000) {
      sessionStorage.removeItem('studio:orchestrator');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
