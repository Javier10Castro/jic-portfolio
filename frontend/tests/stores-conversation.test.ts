import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConversationStore } from '@/store/conversationStore';
import type { Conversation, Message } from '@/types/conversation';

describe('Conversation store', () => {
  beforeEach(() => {
    useConversationStore.setState({ conversations: [], activeConversationId: null, isStreaming: false, isGenerating: false });
  });

  it('createConversation creates a conversation with correct initial state', () => {
    const id = useConversationStore.getState().createConversation('Test Project');
    const state = useConversationStore.getState();
    expect(state.conversations).toHaveLength(1);
    const conv = state.conversations[0];
    expect(conv.id).toBe(id);
    expect(conv.title).toBe('Test Project');
    expect(conv.status).toBe('active');
    expect(conv.messages).toEqual([]);
    expect(conv.context).toBeDefined();
    expect(conv.context.intent).toEqual({ type: '', confidence: 0, label: '' });
    expect(conv.context.entities).toEqual([]);
    expect(conv.context.missingFields).toEqual([]);
  });

  it('createConversation adds greeting message', () => {
    const id = useConversationStore.getState().createConversation('Test');
    useConversationStore.getState().addMessage(id, { role: 'assistant', content: 'Hello! How can I help?', type: 'text' });
    const conv = useConversationStore.getState().conversations.find(c => c.id === id);
    expect(conv?.messages).toHaveLength(1);
    expect(conv?.messages[0].content).toBe('Hello! How can I help?');
    expect(conv?.messages[0].role).toBe('assistant');
  });

  it('createConversation sets it as active', () => {
    const id = useConversationStore.getState().createConversation('Test');
    expect(useConversationStore.getState().activeConversationId).toBe(id);
  });

  it('addMessage appends message to conversation', () => {
    const id = useConversationStore.getState().createConversation();
    useConversationStore.getState().addMessage(id, { role: 'user', content: 'Build a landing page', type: 'text' });
    useConversationStore.getState().addMessage(id, { role: 'assistant', content: 'Sure!', type: 'text' });
    const conv = useConversationStore.getState().conversations[0];
    expect(conv.messages).toHaveLength(2);
    expect(conv.messages[0].content).toBe('Build a landing page');
    expect(conv.messages[1].content).toBe('Sure!');
  });

  it('appendToMessage adds text to existing message', () => {
    const id = useConversationStore.getState().createConversation();
    useConversationStore.getState().addMessage(id, { role: 'assistant', content: 'Hello', type: 'text' });
    const msgId = useConversationStore.getState().conversations[0].messages[0].id;
    useConversationStore.getState().appendToMessage(id, msgId, ' World');
    const msg = useConversationStore.getState().conversations[0].messages[0];
    expect(msg.content).toBe('Hello World');
  });

  it('updateMessage updates message fields', () => {
    const id = useConversationStore.getState().createConversation();
    useConversationStore.getState().addMessage(id, { role: 'assistant', content: 'Hello', type: 'text' });
    const msgId = useConversationStore.getState().conversations[0].messages[0].id;
    useConversationStore.getState().updateMessage(id, msgId, { content: 'Updated', streaming: false });
    const msg = useConversationStore.getState().conversations[0].messages[0];
    expect(msg.content).toBe('Updated');
    expect(msg.streaming).toBe(false);
  });

  it('deleteConversation removes conversation and clears active if deleted', () => {
    const id = useConversationStore.getState().createConversation();
    expect(useConversationStore.getState().conversations).toHaveLength(1);
    useConversationStore.getState().deleteConversation(id);
    expect(useConversationStore.getState().conversations).toHaveLength(0);
    expect(useConversationStore.getState().activeConversationId).toBeNull();
  });

  it('deleteConversation does not clear active if different conversation deleted', () => {
    const id1 = useConversationStore.getState().createConversation('A');
    const id2 = useConversationStore.getState().createConversation('B');
    useConversationStore.getState().setActiveConversation(id1);
    useConversationStore.getState().deleteConversation(id2);
    expect(useConversationStore.getState().activeConversationId).toBe(id1);
  });

  it('archiveConversation sets status to archived', () => {
    const id = useConversationStore.getState().createConversation();
    useConversationStore.getState().archiveConversation(id);
    const conv = useConversationStore.getState().conversations[0];
    expect(conv.status).toBe('archived');
  });

  it('setActiveConversation switches active conversation', () => {
    const id1 = useConversationStore.getState().createConversation('A');
    const id2 = useConversationStore.getState().createConversation('B');
    useConversationStore.getState().setActiveConversation(id1);
    expect(useConversationStore.getState().activeConversationId).toBe(id1);
    useConversationStore.getState().setActiveConversation(id2);
    expect(useConversationStore.getState().activeConversationId).toBe(id2);
    useConversationStore.getState().setActiveConversation(null);
    expect(useConversationStore.getState().activeConversationId).toBeNull();
  });

  it('updateContext merges context updates', () => {
    const id = useConversationStore.getState().createConversation();
    useConversationStore.getState().updateContext(id, { progress: 50, intent: { type: 'build', confidence: 0.9, label: 'Build' } });
    const conv = useConversationStore.getState().conversations[0];
    expect(conv.context.progress).toBe(50);
    expect(conv.context.intent.type).toBe('build');
  });

  it('setMissingFields updates missing fields', () => {
    const id = useConversationStore.getState().createConversation();
    const fields = [{ field: 'brandName', label: 'Brand Name', description: 'Enter brand name', type: 'text' as const, required: true }];
    useConversationStore.getState().setMissingFields(id, fields);
    const conv = useConversationStore.getState().conversations[0];
    expect(conv.context.missingFields).toEqual(fields);
  });

  it('getActiveConversation returns correct conversation', () => {
    const id1 = useConversationStore.getState().createConversation('Other');
    const id2 = useConversationStore.getState().createConversation('Active');
    useConversationStore.getState().setActiveConversation(id2);
    const active = useConversationStore.getState().getActiveConversation();
    expect(active).not.toBeNull();
    expect(active!.id).toBe(id2);
    expect(active!.title).toBe('Active');
  });

  it('getActiveConversation returns null when no active conversation', () => {
    useConversationStore.getState().createConversation('Test');
    useConversationStore.getState().setActiveConversation(null);
    expect(useConversationStore.getState().getActiveConversation()).toBeNull();
  });
});
