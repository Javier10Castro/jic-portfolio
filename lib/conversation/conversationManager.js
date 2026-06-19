const { createSession, updateSessionTimestamps } = require('./conversationSession');
const { save, load, remove, list, exists } = require('./conversationStore');
const { appendMessage, removeMessage, updateMessage, getRecentMessages, getConversationTokens, getMessageCount } = require('./conversationMemory');
const { createContext, mergeContext } = require('./conversationContext');
const { generateSummary } = require('./conversationSummarizer');
const { conversationEvents } = require('./conversationEvents');
const { validateIntegrity } = require('./conversationValidator');

function createConversation({ projectId, workspaceId, metadata }) {
  const session = createSession({ projectId, workspaceId, metadata });
  const conversation = {
    id: session.id,
    session,
    messages: [],
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
  save(conversation);
  conversationEvents.emitConversationCreated(conversation.id, { projectId, workspaceId, metadata });
  return conversation;
}

function loadConversation(id) {
  const raw = load(id);
  if (!raw) return null;
  return {
    id: raw.id,
    session: raw.session || raw,
    messages: raw.messages || [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function saveConversation(conversation) {
  conversation.updatedAt = new Date().toISOString();
  save(conversation);
  conversationEvents.emitConversationUpdated(conversation.id, { messageCount: getMessageCount(conversation) });
}

function archiveConversation(id) {
  const conv = loadConversation(id);
  if (!conv) return { success: false, error: 'Conversation not found' };
  conv.session.status = 'archived';
  conv.updatedAt = new Date().toISOString();
  save(conv);
  conversationEvents.emitConversationUpdated(id, { status: 'archived' });
  return { success: true };
}

function deleteConversation(id) {
  const result = remove(id);
  if (result.success) {
    conversationEvents.emitConversationDeleted(id, {});
  }
  return result;
}

function getConversation(id) {
  return loadConversation(id);
}

function addMessage(conversationId, { role, content, metadata }) {
  const conv = loadConversation(conversationId);
  if (!conv) return { success: false, error: 'Conversation not found' };
  const msg = appendMessage(conv, { role, content, metadata });
  saveConversation(conv);
  return { success: true, message: msg, conversation: conv };
}

function summarizeConversation(conversationId, options) {
  const conv = loadConversation(conversationId);
  if (!conv) return { success: false, error: 'Conversation not found' };
  const summary = generateSummary(conv, options);
  conv.session.summary = summary;
  saveConversation(conv);
  return { success: true, summary };
}

function listConversations() {
  return list();
}

function validateConversation(id) {
  const conv = loadConversation(id);
  if (!conv) return { success: false, error: 'Conversation not found' };
  const errors = validateIntegrity(conv);
  return { isValid: errors.length === 0, errors };
}

module.exports = {
  createConversation,
  loadConversation,
  saveConversation,
  archiveConversation,
  deleteConversation,
  getConversation,
  addMessage,
  summarizeConversation,
  listConversations,
  validateConversation,
};
