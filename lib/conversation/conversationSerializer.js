const { validateIntegrity } = require('./conversationValidator');

function exportConversation(conversation, options = {}) {
  const format = options.format || 'json';
  const includeValidation = options.includeValidation !== false;

  const result = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    source: 'jic-conversation-engine',
    conversation: {
      id: conversation.id,
      session: conversation.session,
      messages: conversation.messages,
    },
  };

  if (includeValidation) {
    result.validation = validateIntegrity(conversation);
    result.isValid = result.validation.length === 0;
  }

  if (format === 'minified') {
    return JSON.stringify(result);
  }

  return JSON.stringify(result, null, 2);
}

function importConversation(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, error: 'Invalid JSON string' };
  }

  const conv = parsed.conversation || parsed;
  if (!conv.id) {
    return { success: false, error: 'Import data must contain a conversation with an id' };
  }

  const errors = validateIntegrity(conv);
  if (errors.length) {
    return { success: false, error: 'Conversation validation failed', validationErrors: errors, conversation: conv };
  }

  return { success: true, conversation: conv };
}

function toConversationHistory(conversation) {
  if (!conversation || !conversation.messages) return [];
  return conversation.messages.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  }));
}

module.exports = { exportConversation, importConversation, toConversationHistory };
