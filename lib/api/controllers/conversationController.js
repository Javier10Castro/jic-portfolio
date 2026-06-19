const conversation = require('../../conversation');
const { questionGenerator } = require('../../conversation/questions');
const { buildContext } = require('../../context');
const { success, created } = require('../responses');
const { NotFoundError, ValidationError } = require('../errors');
const { paginate } = require('../responses/pagination');

function listConversations(req, res) {
  const all = conversation.conversationManager.listConversations ? conversation.conversationManager.listConversations() : [];
  const { page, limit, offset } = paginate(req, all.length);
  const items = all.slice(offset, offset + limit);
  return success(res, items, {
    pagination: { page, limit, total: all.length, totalPages: Math.ceil(all.length / limit) },
  });
}

function getConversation(req, res) {
  const conv = conversation.conversationManager.loadConversation(req.params.id);
  if (!conv) throw new NotFoundError(`Conversation "${req.params.id}" not found`);
  return success(res, conv);
}

function createConversation(req, res) {
  const result = conversation.conversationManager.createConversation(req.body);
  return created(res, result);
}

function deleteConversation(req, res) {
  const result = conversation.conversationManager.deleteConversation(req.params.id);
  if (!result) throw new NotFoundError(`Conversation "${req.params.id}" not found`);
  return success(res, { deleted: true });
}

function addMessage(req, res) {
  const { content, role } = req.body;
  if (!content) throw new ValidationError('Message content is required');
  const conv = conversation.conversationManager.loadConversation(req.params.id);
  if (!conv) throw new NotFoundError(`Conversation "${req.params.id}" not found`);
  conversation.conversationManager.addMessage(conv, { role: role || 'user', content });
  const updated = conversation.conversationManager.loadConversation(req.params.id);
  return success(res, updated);
}

function generateQuestions(req, res) {
  const conv = conversation.conversationManager.loadConversation(req.params.id);
  if (!conv) throw new NotFoundError(`Conversation "${req.params.id}" not found`);
  const context = conv.session?.context || {};
  const intent = { type: req.body.intent || context.currentIntent || 'default', conversationId: req.params.id };
  const questions = questionGenerator.generateQuestions(intent, context);
  return success(res, questions);
}

function buildContextHandler(req, res) {
  const conv = conversation.conversationManager.loadConversation(req.params.id);
  if (!conv) throw new NotFoundError(`Conversation "${req.params.id}" not found`);
  const result = buildContext(req.params.id, req.body.options || { strict: false });
  return success(res, result);
}

module.exports = { listConversations, getConversation, createConversation, deleteConversation, addMessage, generateQuestions, buildContextHandler };
