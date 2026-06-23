import { create } from 'zustand';
import { Conversation, Message, ConversationContext, MissingField } from '@/types/conversation';

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  isGenerating: boolean;

  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  archiveConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  appendToMessage: (conversationId: string, messageId: string, text: string) => void;
  setStreaming: (streaming: boolean) => void;
  setGenerating: (generating: boolean) => void;
  updateContext: (conversationId: string, context: Partial<ConversationContext>) => void;
  setMissingFields: (conversationId: string, fields: MissingField[]) => void;
  clearActiveConversation: () => void;
  getActiveConversation: () => Conversation | null;
}

let convCounter = 0;

function makeId(): string {
  return `conv_${Date.now()}_${++convCounter}`;
}

const defaultContext: ConversationContext = {
  intent: { type: '', confidence: 0, label: '' },
  entities: [],
  brand: {},
  pages: [],
  features: [],
  missingFields: [],
  assets: [],
  progress: 0,
};

export const useConversationStore = create<ConversationState>()((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isStreaming: false,
  isGenerating: false,

  createConversation: (title?: string) => {
    const id = makeId();
    const conv: Conversation = {
      id,
      title: title || `Project ${convCounter}`,
      messages: [],
      status: 'active',
      context: { ...defaultContext },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      conversations: [conv, ...state.conversations],
      activeConversationId: id,
    }));
    return id;
  },

  deleteConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
    })),

  archiveConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, status: 'archived' as const, updatedAt: new Date().toISOString() } : c
      ),
    })),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (conversationId, message) => {
    const msg: Message = {
      ...message,
      id: makeId(),
      timestamp: new Date().toISOString(),
    } as Message;
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, msg], updatedAt: new Date().toISOString() }
          : c
      ),
    }));
  },

  updateMessage: (conversationId, messageId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    })),

  appendToMessage: (conversationId, messageId, text) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, content: m.content + text } : m
              ),
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    })),

  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setGenerating: (generating) => set({ isGenerating: generating }),

  updateContext: (conversationId, contextUpdates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, context: { ...c.context, ...contextUpdates }, updatedAt: new Date().toISOString() }
          : c
      ),
    })),

  setMissingFields: (conversationId, fields) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, context: { ...c.context, missingFields: fields }, updatedAt: new Date().toISOString() }
          : c
      ),
    })),

  clearActiveConversation: () => set({ activeConversationId: null }),

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get();
    return conversations.find((c) => c.id === activeConversationId) || null;
  },
}));
