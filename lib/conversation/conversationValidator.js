class ConversationValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConversationValidationError';
    this.details = details;
  }
}

const VALID_ROLES = ['user', 'assistant', 'system', 'tool'];
const VALID_STATUSES = ['active', 'archived', 'completed'];
const MESSAGE_KEYS = ['id', 'role', 'content', 'timestamp', 'metadata'];

function validateMessage(msg, index) {
  if (!msg || typeof msg !== 'object') {
    throw new ConversationValidationError(`Message at index ${index} must be an object`, { index });
  }
  if (!msg.role || !VALID_ROLES.includes(msg.role)) {
    throw new ConversationValidationError(`Message at index ${index} has invalid role "${msg.role}". Valid: ${VALID_ROLES.join(', ')}`, { index, role: msg.role });
  }
  if (!msg.content || typeof msg.content !== 'string') {
    throw new ConversationValidationError(`Message at index ${index} must have string content`, { index });
  }
  if (!msg.id) {
    throw new ConversationValidationError(`Message at index ${index} must have an id`, { index });
  }
}

function validateConversation(conversation) {
  const errors = [];
  if (!conversation) return [new ConversationValidationError('Conversation is null or undefined')];
  if (!conversation.id) errors.push(new ConversationValidationError('Conversation must have an id'));
  if (!conversation.session || typeof conversation.session !== 'object') errors.push(new ConversationValidationError('Conversation must have a session object'));
  if (!Array.isArray(conversation.messages)) errors.push(new ConversationValidationError('Conversation must have a messages array'));
  return errors;
}

function validateTimestamps(conversation) {
  const errors = [];
  if (!conversation.messages || !conversation.messages.length) return errors;
  let prev = null;
  for (let i = 0; i < conversation.messages.length; i++) {
    const msg = conversation.messages[i];
    const ts = new Date(msg.timestamp).getTime();
    if (isNaN(ts)) {
      errors.push(new ConversationValidationError(`Message at index ${i} has invalid timestamp`, { index: i }));
      continue;
    }
    if (prev !== null && ts < prev) {
      errors.push(new ConversationValidationError(`Message at index ${i} has timestamp before previous message`, { index: i, timestamp: msg.timestamp }));
    }
    prev = ts;
  }
  return errors;
}

function validateRoles(conversation) {
  const errors = [];
  if (!conversation.messages) return errors;
  for (let i = 0; i < conversation.messages.length; i++) {
    try { validateMessage(conversation.messages[i], i); }
    catch (e) { errors.push(e); }
  }
  return errors;
}

function validateIntegrity(conversation) {
  const errors = [...validateConversation(conversation), ...validateRoles(conversation), ...validateTimestamps(conversation)];
  return errors;
}

module.exports = {
  ConversationValidationError,
  validateMessage,
  validateConversation,
  validateTimestamps,
  validateRoles,
  validateIntegrity,
  VALID_ROLES,
  VALID_STATUSES,
};
