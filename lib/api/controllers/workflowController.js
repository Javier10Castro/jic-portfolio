const { getWorkflowManager } = require('../../workflows');
const { success, created } = require('../responses');
const { ValidationError, NotFoundError } = require('../errors');

function getManager() {
  return getWorkflowManager();
}

function listDefinitions(req, res) {
  const defs = getManager().listDefinitions();
  return success(res, defs);
}

async function listWorkflows(req, res) {
  const { status, type, limit } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.workflowType = type;
  const workflows = await getManager().listWorkflows(filter);
  return success(res, { workflows, total: workflows.length, limit: parseInt(limit) || 50 });
}

async function getWorkflow(req, res) {
  const wf = await getManager().getWorkflow(req.params.id);
  if (!wf) throw new NotFoundError(`Workflow "${req.params.id}" not found`);
  return success(res, wf);
}

async function createWorkflow(req, res) {
  const { definitionId, input, options } = req.body;
  if (!definitionId) throw new ValidationError('definitionId is required');

  try {
    const result = await getManager().startWorkflow(definitionId, input || {}, options || {});
    return created(res, { workflowId: result.workflowId, status: result.status });
  } catch (err) {
    if (err.message.includes('not found')) throw new NotFoundError(err.message);
    throw err;
  }
}

async function pauseWorkflow(req, res) {
  const { id } = req.params;
  try {
    const result = await getManager().pauseWorkflow(id);
    return success(res, result);
  } catch (err) {
    if (err.message.includes('not found')) throw new NotFoundError(err.message);
    throw err;
  }
}

async function resumeWorkflow(req, res) {
  const { id } = req.params;
  try {
    const result = await getManager().resumeWorkflow(id, req.body || {});
    return success(res, result);
  } catch (err) {
    if (err.message.includes('not found')) throw new NotFoundError(err.message);
    throw err;
  }
}

async function cancelWorkflow(req, res) {
  const { id } = req.params;
  try {
    const result = await getManager().cancelWorkflow(id);
    return success(res, result);
  } catch (err) {
    if (err.message.includes('not found')) throw new NotFoundError(err.message);
    throw err;
  }
}

async function retryWorkflow(req, res) {
  const { id } = req.params;
  try {
    const result = await getManager().retryWorkflow(id, req.body || {});
    return success(res, { workflowId: result.workflowId, status: result.status });
  } catch (err) {
    if (err.message.includes('not found')) throw new NotFoundError(err.message);
    throw err;
  }
}

function getWorkflowGraph(req, res) {
  const graph = getManager().getWorkflowGraph(req.params.id);
  return success(res, graph);
}

function getWorkflowEvents(req, res) {
  const events = getManager().getWorkflowEvents(req.params.id);
  return success(res, events);
}

async function getWorkflowCheckpoints(req, res) {
  const checkpoints = await getManager().getWorkflowCheckpoints(req.params.id);
  return success(res, checkpoints);
}

module.exports = {
  listDefinitions, listWorkflows, getWorkflow, createWorkflow,
  pauseWorkflow, resumeWorkflow, cancelWorkflow, retryWorkflow,
  getWorkflowGraph, getWorkflowEvents, getWorkflowCheckpoints,
};
