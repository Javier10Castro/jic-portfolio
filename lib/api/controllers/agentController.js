const { executeAgentWorkflow, AgentOrchestrator } = require('../../agents');
const { success } = require('../responses');
const { ValidationError } = require('../errors');

const orchestrator = new AgentOrchestrator();

function listAgents(req, res) {
  const agents = require('../../agents').ALL_AGENT_NAMES.map(name => {
    const agent = orchestrator.getAgent(name);
    return { id: name, name: agent?.name || name, metrics: agent?.metricsReport() || {} };
  });
  return success(res, agents);
}

function getAgent(req, res) {
  const agent = orchestrator.getAgent(req.params.id);
  if (!agent) return res.status(404).json({ success: false, errors: [{ code: 'NotFoundError', message: `Agent "${req.params.id}" not found` }] });
  return success(res, { id: agent.id, name: agent.name, metrics: agent.metricsReport(), health: agent._initialized ? 'ok' : 'uninitialized' });
}

async function runWorkflow(req, res) {
  const { task, options } = req.body;
  if (!task || !task.type) throw new ValidationError('task.type is required');

  try {
    const result = await orchestrator.executeWorkflow(task, options || {});
    return success(res, result);
  } catch (err) {
    res.status(500).json({
      success: false, data: null,
      errors: [{ code: 'WorkflowError', message: err.message, details: {} }],
      meta: { timestamp: new Date().toISOString() },
      requestId: req.requestId,
    });
  }
}

async function reviewWorkflow(req, res) {
  const { workflowId } = req.body;
  if (!workflowId) throw new ValidationError('workflowId is required');

  const status = orchestrator.getWorkflowStatus(workflowId);
  if (!status) return res.status(404).json({ success: false, errors: [{ code: 'NotFoundError', message: `Workflow "${workflowId}" not found` }] });

  return success(res, { workflowId, status, review: orchestrator.shared.getArtifact('reviewer'), qa: orchestrator.shared.getArtifact('qa') });
}

function listWorkflows(req, res) {
  const workflows = orchestrator.listWorkflows(parseInt(req.query.limit) || 20);
  return success(res, workflows);
}

function getWorkflowMetrics(req, res) {
  return success(res, orchestrator.getMetrics());
}

function cancelWorkflow(req, res) {
  const { workflowId } = req.body;
  if (!workflowId) throw new ValidationError('workflowId is required');
  const result = orchestrator.cancelWorkflow(workflowId);
  return success(res, result);
}

module.exports = { listAgents, getAgent, runWorkflow, reviewWorkflow, listWorkflows, getWorkflowMetrics, cancelWorkflow };
