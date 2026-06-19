const crypto = require('crypto');

function _generateMessageId() {
  return `msg-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

function _estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function appendMessage(conversation, { role, content, metadata }) {
  if (!conversation.messages) conversation.messages = [];
  const msg = {
    id: _generateMessageId(),
    role,
    content,
    timestamp: new Date().toISOString(),
    metadata: metadata || {},
  };
  conversation.messages.push(msg);
  return msg;
}

function removeMessage(conversation, messageId) {
  if (!conversation.messages) return false;
  const idx = conversation.messages.findIndex(m => m.id === messageId);
  if (idx === -1) return false;
  conversation.messages.splice(idx, 1);
  return true;
}

function updateMessage(conversation, messageId, updates) {
  if (!conversation.messages) return null;
  const msg = conversation.messages.find(m => m.id === messageId);
  if (!msg) return null;
  const allowed = ['content', 'metadata'];
  for (const key of Object.keys(updates)) {
    if (allowed.includes(key)) {
      if (key === 'metadata' && typeof updates[key] === 'object') {
        msg.metadata = { ...msg.metadata, ...updates[key] };
      } else {
        msg[key] = updates[key];
      }
    }
  }
  return msg;
}

function getRecentMessages(conversation, count = 10) {
  if (!conversation.messages) return [];
  return conversation.messages.slice(-count);
}

function getConversationTokens(conversation) {
  if (!conversation.messages) return 0;
  return conversation.messages.reduce((sum, m) => sum + _estimateTokens(m.content), 0);
}

function getMessageCount(conversation) {
  return conversation.messages ? conversation.messages.length : 0;
}

module.exports = {
  appendMessage,
  removeMessage,
  updateMessage,
  getRecentMessages,
  getConversationTokens,
  getMessageCount,
  _estimateTokens,
};
