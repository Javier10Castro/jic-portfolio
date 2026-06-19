const WorkflowManager = require('./workflowManager');
const { WorkflowDefinition } = require('./workflowDefinition');
const { WorkflowStateMachine, STATES } = require('./workflowStateMachine');
const { WorkflowEvents, EVENT_TYPES } = require('./workflowEvents');
const ExecutionEngine = require('./executionEngine');
const ExecutionGraph = require('./executionGraph');
const CheckpointManager = require('./checkpointManager');
const RetryEngine = require('./retryEngine');
const CompensationEngine = require('./compensationEngine');
const WorkflowVersioning = require('./workflowVersioning');
const WorkflowMetrics = require('./workflowMetrics');
const WorkflowStorage = require('./workflowStorage');
const Scheduler = require('./scheduler/scheduler');
const QueueManager = require('./scheduler/queueManager');
const CronScheduler = require('./scheduler/cronScheduler');

const _manager = new WorkflowManager();

async function startWorkflow(definitionId, input, options) {
  return _manager.startWorkflow(definitionId, input, options);
}

async function resumeWorkflow(wfId, options) {
  return _manager.resumeWorkflow(wfId, options);
}

async function pauseWorkflow(wfId) {
  return _manager.pauseWorkflow(wfId);
}

async function cancelWorkflow(wfId) {
  return _manager.cancelWorkflow(wfId);
}

async function retryWorkflow(wfId, options) {
  return _manager.retryWorkflow(wfId, options);
}

async function getWorkflow(wfId) {
  return _manager.getWorkflow(wfId);
}

async function listWorkflows(filter) {
  return _manager.listWorkflows(filter);
}

function getWorkflowManager() {
  return _manager;
}

function createDefinition(def) {
  const definition = new WorkflowDefinition(def);
  _manager.registerDefinition(definition);
  return definition;
}

module.exports = {
  startWorkflow,
  resumeWorkflow,
  pauseWorkflow,
  cancelWorkflow,
  retryWorkflow,
  getWorkflow,
  listWorkflows,
  getWorkflowManager,
  createDefinition,
  WorkflowManager,
  WorkflowDefinition,
  WorkflowStateMachine,
  WorkflowEvents,
  ExecutionEngine,
  ExecutionGraph,
  CheckpointManager,
  RetryEngine,
  CompensationEngine,
  WorkflowVersioning,
  WorkflowMetrics,
  WorkflowStorage,
  Scheduler,
  QueueManager,
  CronScheduler,
  STATES,
  EVENT_TYPES,
};
