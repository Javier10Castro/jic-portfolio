const { getConversationTokens, getMessageCount } = require('./conversationMemory');
const { conversationEvents } = require('./conversationEvents');

const DEFAULTS = {
  tokenThreshold: 2000,
  messageThreshold: 20,
  summaryMaxTokens: 500,
};

function generateSummary(conversation, options = {}) {
  const threshold = options.tokenThreshold || DEFAULTS.tokenThreshold;
  const msgThreshold = options.messageThreshold || DEFAULTS.messageThreshold;
  const count = getMessageCount(conversation);
  const tokens = getConversationTokens(conversation);
  const shouldSummarize = tokens > threshold || count > msgThreshold;

  const summary = {
    generatedAt: new Date().toISOString(),
    type: shouldSummarize ? 'rolling' : 'preview',
    messageCount: count,
    totalTokens: tokens,
    summaryText: null,
    participantCount: _countParticipants(conversation),
    topics: _extractTopics(conversation),
    keyPoints: _extractKeyPoints(conversation),
  };

  if (shouldSummarize && conversation.messages && conversation.messages.length) {
    summary.summaryText = _deterministicSummarize(conversation, options);
    conversationEvents.emitConversationSummarized(conversation.id, {
      type: 'rolling',
      messageCount: count,
      tokensBefore: tokens,
      summaryLength: summary.summaryText.length,
    });
  } else if (conversation.messages && conversation.messages.length) {
    const recent = conversation.messages.slice(-1);
    summary.summaryText = recent.length ? `Last message: "${recent[0].content.slice(0, 80)}..."` : 'No messages yet.';
  }

  return summary;
}

function _countParticipants(conversation) {
  if (!conversation.messages) return 0;
  const roles = new Set(conversation.messages.map(m => m.role));
  return roles.size;
}

function _extractTopics(conversation) {
  if (!conversation.messages || !conversation.messages.length) return [];
  const text = conversation.messages.map(m => m.content).join(' ').toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 4);
  const freq = {};
  for (const w of words) { freq[w] = (freq[w] || 0) + 1; }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

function _extractKeyPoints(conversation) {
  if (!conversation.messages || !conversation.messages.length) return [];
  const points = [];
  for (const msg of conversation.messages) {
    const sentences = msg.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    for (const s of sentences.slice(0, 2)) {
      if (s.trim().length < 100) points.push(s.trim());
    }
  }
  return points.slice(0, 5);
}

function _deterministicSummarize(conversation, options) {
  const msgs = conversation.messages;
  const totalMsgs = msgs.length;
  const firstMsg = msgs[0];
  const lastMsg = msgs[msgs.length - 1];

  const userMsgs = msgs.filter(m => m.role === 'user').length;
  const assistantMsgs = msgs.filter(m => m.role === 'assistant').length;

  const topics = _extractTopics(conversation).slice(0, 5);

  return [
    `Conversation with ${totalMsgs} messages (${userMsgs} user, ${assistantMsgs} assistant).`,
    firstMsg ? `Started with: "${firstMsg.content.slice(0, 100)}..."` : '',
    lastMsg ? `Last message: "${lastMsg.content.slice(0, 100)}..."` : '',
    topics.length ? `Topics: ${topics.join(', ')}.` : '',
    'This is a deterministic placeholder summary — no LLM call was made.',
  ].filter(Boolean).join(' ');
}

module.exports = { generateSummary, DEFAULTS };
