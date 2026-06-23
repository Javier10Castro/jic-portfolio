'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useConversationStore } from '@/store/conversationStore';
import { usePipelineStore,  } from '@/store/pipelineStore';
import { useSummaryStore } from '@/store/summaryStore';
import { useDeploymentStore } from '@/store/deploymentStore';
import { usePreviewStore } from '@/store/previewStore';
import { Message } from '@/types/conversation';
import type { PageSummary, FeatureSummary } from '@/types/summary';
import api from '@/services/api';
import { eventService, getAuthToken } from '@/services';

export function useConversation() {
  const store = useConversationStore();
  const {
    startPipeline, advanceStage, completeStage, failStage,
    addLog: addPipelineLog, setStageProgress, resetPipeline,
  } = usePipelineStore();
  const { setSummary } = useSummaryStore();
  const {
    setStatus: setDeployStatus, setUrl: setDeployUrl,
    addLog: addDeployLog, addToHistory,
  } = useDeploymentStore();
  const { setPreviewUrl, setPreviewStatus, setError: setPreviewError } = usePreviewStore();

  const activeConv = store.getActiveConversation();
  const isGenerating = store.isGenerating;
  const isStreaming = store.isStreaming;
  const messages = activeConv?.messages || [];
  const sseDisposed = useRef(false);
  const pipelineSubscription = useRef<(() => void) | null>(null);
  const deploymentSubscription = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      sseDisposed.current = true;
      pipelineSubscription.current?.();
      deploymentSubscription.current?.();
      pipelineSubscription.current = null;
      deploymentSubscription.current = null;
    };
  }, []);

  const subscribePipeline = useCallback((pipelineId: string) => {
    pipelineSubscription.current?.();
    const token = getAuthToken();
    if (!token) return;

    eventService.connect(token);

    const unsubStatus = eventService.on('pipeline.status', (event) => {
      if (sseDisposed.current) return;
      const payload = event.payload as Record<string, string> | undefined;
      if (!payload) return;

      if (payload.status === 'running') {
        advanceStage(payload.currentStage as never);
      } else if (payload.status === 'completed') {
        completeStage(payload.currentStage as never);
      } else if (payload.status === 'failed') {
        failStage(payload.currentStage as never, payload.error || 'Unknown error');
      }
    });

    const unsubLog = eventService.on('pipeline.log', (event) => {
      if (sseDisposed.current) return;
      const payload = event.payload as Record<string, string | number> | undefined;
      if (!payload || !payload.stage) return;
      addPipelineLog({
        level: (payload.level as 'info' | 'warn' | 'error') || 'info',
        message: String(payload.message || ''),
        stage: String(payload.stage),
      });
    });

    const unsubProgress = eventService.on('pipeline.progress', (event) => {
      if (sseDisposed.current) return;
      const payload = event.payload as Record<string, string | number> | undefined;
      if (!payload || !payload.stage || typeof payload.progress !== 'number') return;
      setStageProgress(String(payload.stage) as never, payload.progress);
    });

    pipelineSubscription.current = () => {
      unsubStatus();
      unsubLog();
      unsubProgress();
    };
  }, [advanceStage, completeStage, failStage, addPipelineLog, setStageProgress]);

  const subscribeDeployment = useCallback((deploymentId: string) => {
    deploymentSubscription.current?.();
    const token = getAuthToken();
    if (!token) return;

    eventService.connect(token);

    const unsubStatus = eventService.on('deployment.status', (event) => {
      if (sseDisposed.current) return;
      const payload = event.payload as Record<string, string> | undefined;
      if (!payload) return;
      setDeployStatus(payload.status as never);
      if (payload.url) {
        setDeployUrl(payload.url);
        setPreviewUrl(payload.url);
      }
    });

    const unsubLog = eventService.on('deployment.log', (event) => {
      if (sseDisposed.current) return;
      const payload = event.payload as Record<string, string | number> | undefined;
      if (!payload) return;
      addDeployLog({
        level: (payload.level as 'info' | 'warn' | 'error') || 'info',
        message: String(payload.message || ''),
      });
    });

    deploymentSubscription.current = () => {
      unsubStatus();
      unsubLog();
    };
  }, [setDeployStatus, setDeployUrl, setPreviewUrl, addDeployLog]);

  const startNewConversation = useCallback(async (title?: string) => {
    try {
      const res = await api.createConversation({ title });
      const id = (res as unknown as Record<string, unknown>).data
        ? ((res as unknown as Record<string, unknown>).data as Record<string, unknown>).id as string
        : (res as unknown as Record<string, unknown>).id as string || store.createConversation(title);

      const greeting: Omit<Message, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: "Hello! I'm your AI product builder. Tell me about the project you'd like to build. Describe your idea in a few sentences, and I'll help you turn it into a real application.",
        type: 'text',
      };
      store.addMessage(id, greeting);
      store.setActiveConversation(id);
      return id;
    } catch {
      const id = store.createConversation(title);
      const greeting: Omit<Message, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: "Hello! I'm your AI product builder. Tell me about the project you'd like to build.",
        type: 'text',
      };
      store.addMessage(id, greeting);
      return id;
    }
  }, [store]);

  const sendMessage = useCallback(async (text: string) => {
    const convId = store.activeConversationId;
    if (!convId) return;

    store.addMessage(convId, { role: 'user', content: text, type: 'text' });
    store.setGenerating(true);

    const assistantMsgId = `msg_${Date.now()}`;
    store.addMessage(convId, {
      role: 'assistant',
      content: '',
      type: 'text',
      streaming: true,
      id: assistantMsgId,
    } as Message);

    store.setStreaming(true);

    try {
      const res = await api.sendMessage(convId, text);
      const data = (res as unknown as Record<string, unknown>).data as Record<string, unknown> | undefined;
      const responseContent = data?.content as string || data?.response as string || '';
      const words = responseContent.split(' ');
      for (let i = 0; i < words.length; i++) {
        if (sseDisposed.current) break;
        store.appendToMessage(convId, assistantMsgId, (i > 0 ? ' ' : '') + words[i]);
        await new Promise((r) => setTimeout(r, 15));
      }

      store.updateMessage(convId, assistantMsgId, { streaming: false });

      if (data?.context) {
        store.updateContext(convId, (data.context as Record<string, unknown>));
      }
    } catch {
      store.updateMessage(convId, assistantMsgId, {
        content: "I'm sorry, I encountered an issue processing your message. Please try again.",
        streaming: false,
      });
    } finally {
      store.setStreaming(false);
      store.setGenerating(false);
    }

    try {
      const questionsRes = await api.generateQuestions(convId);
      const questionsData = (questionsRes as unknown as Record<string, unknown>).data as Record<string, unknown> | undefined;
      if (questionsData?.missingFields) {
        store.setMissingFields(convId, (questionsData.missingFields as never[]));
      }
    } catch {
      // questions are best-effort
    }
  }, [store]);

  const answerQuestion = useCallback(async (_field: string, value: string | string[] | boolean) => {
    const convId = store.activeConversationId;
    if (!convId) return;

    const answerText = typeof value === 'string' ? value : JSON.stringify(value);
    store.addMessage(convId, { role: 'user', content: answerText, type: 'answer' });

    store.setGenerating(true);

    try {
      const res = await api.sendMessage(convId, answerText);
      const data = (res as unknown as Record<string, unknown>).data as Record<string, unknown> | undefined;
      const responseContent = data?.content as string || `Got it! I've recorded your answer.`;

      store.addMessage(convId, {
        role: 'assistant',
        content: responseContent,
        type: 'text',
      });

      if (data?.context) {
        store.updateContext(convId, (data.context as Record<string, unknown>));
      }

      const questionsRes = await api.generateQuestions(convId);
      const questionsData = (questionsRes as unknown as Record<string, unknown>).data as Record<string, unknown> | undefined;
      if (questionsData?.missingFields) {
        store.setMissingFields(convId, (questionsData.missingFields as never[]));
      } else {
        store.updateContext(convId, { missingFields: [] });
      }
    } catch {
      store.addMessage(convId, {
        role: 'assistant',
        content: `Got it! I've recorded your answer.`,
        type: 'text',
      });
      store.updateContext(convId, { missingFields: [] });
    } finally {
      store.setGenerating(false);
    }
  }, [store]);

  const generateProject = useCallback(async () => {
    const convId = store.activeConversationId;
    if (!convId) return;

    store.setGenerating(true);
    store.addMessage(convId, { role: 'assistant', content: 'Starting the build pipeline...', type: 'system' });

    try {
      const pipeRes = await api.runPipeline(convId);
      const pipeData = (pipeRes as unknown as Record<string, unknown>).data as Record<string, unknown> | undefined;
      const pipelineId = pipeData?.pipelineId as string || pipeData?.id as string || `pipeline_${Date.now()}`;
      const projectId = pipeData?.projectId as string || `proj_${Date.now()}`;
      const stagesData = (pipeData?.stages as Record<string, unknown>[]) || [];

      startPipeline(projectId);

      if (stagesData.length > 0) {
        stagesData.forEach((s) => {
          const stageName = s.name as string;
          if (s.status === 'running') advanceStage(stageName as never);
          else if (s.status === 'completed') {
            advanceStage(stageName as never);
            completeStage(stageName as never);
          }
          if (typeof s.progress === 'number') setStageProgress(stageName as never, s.progress);
        });
      }

      subscribePipeline(pipelineId);

      try {
        const summaryRes = await api.getPipelineStatus(pipelineId);
        const summaryData = (summaryRes as unknown as Record<string, unknown>).data as Record<string, unknown> | undefined;
        if (summaryData) {
          const rawPages = summaryData.pages as Array<Record<string, string>> | undefined;
          const pages: PageSummary[] = rawPages
            ? rawPages.map((p) => ({ name: p.name || '', route: p.route }))
            : (activeConv?.context?.pages || []).map((p) => ({ name: p.name, route: p.route, description: p.description }));
          const rawFeatures = summaryData.features as Array<Record<string, unknown>> | undefined;
          const features: FeatureSummary[] = rawFeatures
            ? rawFeatures.map((f) => ({ name: f.name as string || '', description: f.description as string || '', included: f.included as boolean ?? true }))
            : [];
          setSummary({
            name: (summaryData.projectName as string) || (activeConv?.context?.brand?.name as string) || 'My Project',
            pages,
            features,
            colorPalette: (summaryData.colors as string[]) || (activeConv?.context?.brand?.colors as string[]) || ['#2563eb', '#ffffff'],
            typography: (summaryData.typography as string) || (activeConv?.context?.brand?.typography as string) || 'Inter',
            deploymentTarget: (summaryData.deploymentTarget as 'vercel' | 'netlify' | 'aws') || 'vercel',
            estimatedCost: (summaryData.estimatedCost as number) || 0,
            estimatedTokens: (summaryData.estimatedTokens as number) || 15000,
            estimatedTime: (summaryData.estimatedTime as number) || 120,
          });
        }
      } catch {
        const fallbackPages: PageSummary[] = (activeConv?.context?.pages || []).map((p) => ({ name: p.name, route: p.route, description: p.description }));
        setSummary({
          name: (activeConv?.context?.brand?.name as string) || 'My Project',
          pages: fallbackPages,
          features: [],
          colorPalette: (activeConv?.context?.brand?.colors as string[]) || ['#2563eb', '#ffffff'],
          typography: (activeConv?.context?.brand?.typography as string) || 'Inter',
          deploymentTarget: 'vercel',
          estimatedCost: 0,
          estimatedTokens: 15000,
          estimatedTime: 120,
        });
      }

      store.addMessage(convId, {
        role: 'assistant',
        content: `✅ Build pipeline started! Your project is being generated. You can monitor progress in the pipeline view.`,
        type: 'system',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Build failed';
      failStage('generator' as never, msg);
      store.addMessage(convId, { role: 'assistant', content: `❌ ${msg}`, type: 'error' });
    } finally {
      store.setGenerating(false);
    }
  }, [store, activeConv, startPipeline, advanceStage, completeStage, failStage, setStageProgress, addPipelineLog, setSummary, subscribePipeline]);

  const deployProject = useCallback(async () => {
    const convId = store.activeConversationId;
    if (!convId) return;

    const pipelineState = usePipelineStore.getState().pipeline;
    const projectId = activeConv?.projectId || pipelineState?.projectId || `proj_${Date.now()}`;
    setDeployStatus('deploying');
    addDeployLog({ level: 'info', message: 'Starting deployment...' });

    try {
      const depRes = await api.createDeployment({ projectId });
      const depData = (depRes as unknown as Record<string, unknown>).data as Record<string, unknown> | undefined;
      const deploymentId = depData?.deploymentId as string || depData?.id as string;
      const deploymentUrl = depData?.url as string || '';

      if (deploymentUrl) {
        setDeployUrl(deploymentUrl);
        setPreviewUrl(deploymentUrl);
        setPreviewStatus('ready');
      }

      if (deploymentId) {
        subscribeDeployment(deploymentId);
      }

      addDeployLog({ level: 'info', message: 'Deployment created successfully.' });

      if (depData) {
        addToHistory({
          id: deploymentId || `dep_${Date.now()}`,
          version: depData.version as string || '1.0.0',
          timestamp: new Date().toISOString(),
          status: 'deployed',
          url: deploymentUrl,
        } as never);
      }

      setDeployStatus('deployed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Deployment failed';
      setDeployStatus('failed');
      setPreviewError(msg);
      addDeployLog({ level: 'error', message: msg });
    }
  }, [store, activeConv, setDeployStatus, setDeployUrl, addDeployLog, addToHistory, setPreviewUrl, setPreviewStatus, setPreviewError, subscribeDeployment]);

  return {
    ...store,
    messages,
    activeConv,
    isGenerating,
    isStreaming,
    startNewConversation,
    sendMessage,
    answerQuestion,
    generateProject,
    deployProject,
  };
}
