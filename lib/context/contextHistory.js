const conversationManager = require('../conversation/conversationManager');
const { extractEntitiesFromMessages, extractKeyValuePairs } = require('./contextEntities');

function loadConversation(conversationId) {
  const conv = conversationManager.loadConversation(conversationId);
  if (!conv) return null;
  return conv;
}

function extractAnswers(conversation) {
  if (!conversation || !conversation.messages) return { answers: {}, entities: [] };

  const messages = conversation.messages;
  const answers = {};
  const entities = conversation.session?.context?.detectedEntities || [];
  const contextVars = conversation.session?.context?.contextVariables || {};
  const answered = conversation.session?.context?.answeredQuestions || [];
  const pending = conversation.session?.context?.pendingQuestions || [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      const content = msg.content || '';
      const extracted = extractKeyValuePairs(messages);
      Object.assign(answers, extracted);
    }
  }

  Object.assign(answers, contextVars);

  return {
    answers,
    entities,
    answeredQuestions: answered,
    pendingQuestions: pending,
    messageCount: messages.length,
    session: conversation.session,
  };
}

function extractProjectInfo(conversation) {
  const session = conversation.session || {};
  return {
    projectId: session.projectId || conversation.projectId || null,
    workspaceId: session.workspaceId || conversation.workspaceId || null,
    createdAt: session.createdAt || conversation.createdAt,
    updatedAt: session.updatedAt || conversation.updatedAt,
    status: session.status || 'active',
  };
}

module.exports = { loadConversation, extractAnswers, extractProjectInfo };
