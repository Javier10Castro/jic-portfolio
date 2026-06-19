const { buildContext } = require('../../context');
const conversation = require('../../conversation');
const { success } = require('../responses');
const { NotFoundError } = require('../errors');

function getContext(req, res) {
  const conv = conversation.conversationManager.loadConversation(req.params.conversationId);
  if (!conv) throw new NotFoundError(`Conversation "${req.params.conversationId}" not found`);
  const result = buildContext(req.params.conversationId, { strict: false });
  return success(res, result);
}

function rebuildContext(req, res) {
  const conv = conversation.conversationManager.loadConversation(req.params.conversationId);
  if (!conv) throw new NotFoundError(`Conversation "${req.params.conversationId}" not found`);
  const result = buildContext(req.params.conversationId, { strict: true, force: true });
  return success(res, result);
}

module.exports = { getContext, rebuildContext };
