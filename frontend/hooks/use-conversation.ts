'use client';

import { useCallback } from 'react';
import { useConversationStore } from '@/store/conversationStore';
import { usePipelineStore } from '@/store/pipelineStore';
import { useSummaryStore } from '@/store/summaryStore';
import { useDeploymentStore } from '@/store/deploymentStore';
import { Message, MissingField } from '@/types/conversation';
import { StudioStage } from '@/types/studio';
import api from '@/services/api';

export function useConversation() {
  const store = useConversationStore();
  const { startPipeline, advanceStage, completeStage, addLog } = usePipelineStore();
  const { setSummary } = useSummaryStore();
  const { setStatus: setDeployStatus, addLog: addDeployLog } = useDeploymentStore();

  const activeConv = store.getActiveConversation();
  const messages = activeConv?.messages || [];

  const startNewConversation = useCallback((title?: string) => {
    const id = store.createConversation(title);
    const greeting: Omit<Message, 'id' | 'timestamp'> = {
      role: 'assistant',
      content: "Hello! I'm your AI product builder. Tell me about the project you'd like to build. Describe your idea in a few sentences, and I'll help you turn it into a real application.",
      type: 'text',
    };
    store.addMessage(id, greeting);
    return id;
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

    const responseText = simulateResponse(text, activeConv?.context);
    const words = responseText.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise((r) => setTimeout(r, 30));
      store.appendToMessage(convId, assistantMsgId, (i > 0 ? ' ' : '') + words[i]);
    }

    store.updateMessage(convId, assistantMsgId, { streaming: false });
    store.setStreaming(false);
    store.setGenerating(false);

    store.updateContext(convId, {
      progress: Math.min((activeConv?.context.progress || 0) + 10, 100),
    });
  }, [store, activeConv]);

  const answerQuestion = useCallback((field: string, value: string | string[] | boolean, missingField: MissingField) => {
    const convId = store.activeConversationId;
    if (!convId) return;

    store.addMessage(convId, {
      role: 'user',
      content: typeof value === 'string' ? value : JSON.stringify(value),
      type: 'answer',
    });

    store.addMessage(convId, {
      role: 'assistant',
      content: `Got it! I've recorded the ${missingField.label}.`,
      type: 'text',
    });

    store.updateContext(convId, { missingFields: [] });
  }, [store]);

  const generateProject = useCallback(async () => {
    const convId = store.activeConversationId;
    if (!convId) return;

    store.setGenerating(true);
    store.addMessage(convId, { role: 'assistant', content: 'Starting the build pipeline...', type: 'system' });

    try {
      const projectId = `proj_${Date.now()}`;
      startPipeline(projectId);

      const pipelineStages: StudioStage[] = ['architecture', 'composer', 'generator', 'evaluation', 'deployment', 'workspace'];

      for (const stage of pipelineStages) {
        advanceStage(stage);
        addLog({ level: 'info', message: `Starting ${stage} stage...`, stage });

        await new Promise((r) => setTimeout(r, 1500));

        completeStage(stage);
        addLog({ level: 'info', message: `${stage} stage completed successfully`, stage });
      }

      setSummary({
        name: activeConv?.context.brand.name || 'My Project',
        pages: activeConv?.context.pages || [],
        features: [],
        colorPalette: activeConv?.context.brand.colors || ['#2563eb', '#ffffff'],
        typography: activeConv?.context.brand.typography || 'Inter',
        deploymentTarget: 'vercel',
        estimatedCost: 0,
        estimatedTokens: 15000,
        estimatedTime: 120,
      });

      store.addMessage(convId, {
        role: 'assistant',
        content: `✅ Build complete! Your project "${activeConv?.context.brand.name || 'My Project'}" has been generated. You can now preview and deploy it.`,
        type: 'system',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Build failed';
      store.addMessage(convId, { role: 'assistant', content: `❌ ${msg}`, type: 'error' });
    } finally {
      store.setGenerating(false);
    }
  }, [store, activeConv, startPipeline, advanceStage, completeStage, addLog, setSummary]);

  const deployProject = useCallback(async () => {
    setDeployStatus('deploying');
    addDeployLog({ level: 'info', message: 'Starting deployment...' });
    await new Promise((r) => setTimeout(r, 2000));
    addDeployLog({ level: 'info', message: 'Deployment successful!' });
    setDeployStatus('deployed');
  }, [setDeployStatus, addDeployLog]);

  return {
    ...store,
    messages,
    activeConv,
    startNewConversation,
    sendMessage,
    answerQuestion,
    generateProject,
    deployProject,
  };
}

const responses: Record<string, string> = {
  website: "Great, a website! Let me help you build it.\n\nTo start, could you tell me:\n- What is the main purpose of this website?\n- Who is your target audience?\n- Do you have any brand guidelines or preferences?",
  app: "An application — excellent! Let's explore the details.\n\nI'll need to understand:\n- What problem does your app solve?\n- Who will use it?\n- What platforms do you need (web, mobile, both)?",
  ecommerce: "An e-commerce site! Let me help you set up your online store.\n\nI need to know:\n- What products will you sell?\n- Do you need payment processing?\n- How many products approximately?",
  landing: "A landing page — perfect for capturing leads!\n\nLet me understand:\n- What is your offer or product?\n- What action do you want visitors to take?\n- Do you have brand colors and logo?",
  portfolio: "A portfolio site! Let's showcase your work.\n\nTell me about:\n- What type of work do you showcase?\n- How many projects?\n- Do you need a blog section?",
  blog: "A blog — great for content! Let me help set it up.\n\nI need to know:\n- What topics will you cover?\n- How often will you post?\n- Do you need comments or newsletter?",
  default: "Thanks for sharing! Let me ask a few questions to better understand your project.\n\n- What is the primary goal of this project?\n- Do you have any design preferences?\n- What timeline are you working with?",
};

function simulateResponse(text: string, context?: { brand?: { name?: string } }): string {
  const lower = text.toLowerCase();
  let response = responses.default;

  if (lower.includes('website') || lower.includes('site') || lower.includes('web')) response = responses.website;
  else if (lower.includes('app') || lower.includes('application') || lower.includes('mobile')) response = responses.app;
  else if (lower.includes('ecommerce') || lower.includes('shop') || lower.includes('store') || lower.includes('sell')) response = responses.ecommerce;
  else if (lower.includes('landing') || lower.includes('lead')) response = responses.landing;
  else if (lower.includes('portfolio') || lower.includes('showcase')) response = responses.portfolio;
  else if (lower.includes('blog') || lower.includes('article') || lower.includes('post')) response = responses.blog;

  if (context?.brand?.name) {
    response = `Working on "${context.brand.name}". ${response}`;
  }

  return response;
}
