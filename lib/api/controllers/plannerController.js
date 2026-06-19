const planner = require('../../planner');
const conversation = require('../../conversation');
const { buildContext } = require('../../context');
const { success } = require('../responses');
const { NotFoundError, ValidationError } = require('../errors');

function generatePlan(req, res) {
  const { conversationId, prompt, planIR } = req.body;

  if (planIR) {
    const blueprint = planner.planProject(planIR);
    return success(res, blueprint);
  }

  if (conversationId) {
    const conv = conversation.conversationManager.loadConversation(conversationId);
    if (!conv) throw new NotFoundError(`Conversation "${conversationId}" not found`);
    const context = buildContext(conversationId, { strict: false });
    const ir = context?.planIR || context?.context?.planIR || conv.session?.context?.planIR;
    if (!ir) throw new ValidationError('No Plan IR available from conversation context');
    const blueprint = planner.planProject(ir);
    return success(res, blueprint);
  }

  if (prompt) {
    const blueprint = planner.planProject({ prompt });
    return success(res, blueprint);
  }

  throw new ValidationError('Provide one of: conversationId, prompt, or planIR');
}

module.exports = { generatePlan };
