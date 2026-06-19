const crypto = require('crypto');
const { WorkflowStateMachine, STATES } = require('./workflowStateMachine');
const { WorkflowDefinition } = require('./workflowDefinition');
const ExecutionEngine = require('./executionEngine');
const CheckpointManager = require('./checkpointManager');
const CompensationEngine = require('./compensationEngine');
const WorkflowVersioning = require('./workflowVersioning');
const WorkflowMetrics = require('./workflowMetrics');
const WorkflowStorage = require('./workflowStorage');
const { WorkflowEvents } = require('./workflowEvents');

class WorkflowManager {
  constructor(options = {}) {
    this._definitions = new Map();
    this._storage = options.storage || new WorkflowStorage();
    this._engine = new ExecutionEngine(options.execution);
    this._checkpoints = new CheckpointManager(this._storage);
    this._compensation = new CompensationEngine();
    this._versioning = new WorkflowVersioning();
    this._metrics = new WorkflowMetrics();
    this._events = new WorkflowEvents();
    this._workflows = new Map();
    this._idCounter = 0;
  }

  get engine() { return this._engine; }
  get checkpoints() { return this._checkpoints; }
  get compensation() { return this._compensation; }
  get versioning() { return this._versioning; }
  get metrics() { return this._metrics; }
  get events() { return this._events; }
  get storage() { return this._storage; }

  registerDefinition(def) {
    const definition = def instanceof WorkflowDefinition ? def : new WorkflowDefinition(def);
    this._definitions.set(definition.id, definition);
    this._versioning.createVersion({ id: definition.id, definition: definition.toJSON() });
    return definition;
  }

  getDefinition(id) {
    return this._definitions.get(id) || null;
  }

  listDefinitions() {
    return Array.from(this._definitions.values()).map(d => d.toJSON());
  }

  async startWorkflow(definitionId, input = {}, options = {}) {
    const def = this._definitions.get(definitionId);
    if (!def) throw new Error(`Workflow definition "${definitionId}" not found`);

    const wfId = `wf-${++this._idCounter}-${Date.now().toString(36)}`;
    const workflow = {
      id: wfId,
      definitionId: def.id,
      name: def.name,
      type: def.type,
      version: def.version,
      status: STATES.CREATED,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      input,
      options,
      steps: def.steps,
    };

    this._workflows.set(wfId, workflow);
    await this._storage.save(workflow);
    this._events.emit('workflow.created', { workflowId: wfId, definitionId, timestamp: Date.now() });

    const stateMachine = new WorkflowStateMachine(STATES.CREATED);
    stateMachine.transition(STATES.QUEUED);
    workflow.status = STATES.QUEUED;
    workflow.updatedAt = Date.now();
    await this._storage.save(workflow);

    const agentOrchestrator = options.agentOrchestrator || null;
    const context = {
      ...input,
      agentOrchestrator,
      shared: options.shared || {},
      subworkflows: options.subworkflows || {},
    };

    this._engine.events.on('workflow.step.started', async (entry) => {
      this._events.emit('workflow.step.started', entry.data);
      if (options.onStepStart) options.onStepStart(entry.data);
    });
    this._engine.events.on('workflow.step.completed', async (entry) => {
      this._events.emit('workflow.step.completed', entry.data);
      if (options.onStepComplete) options.onStepComplete(entry.data);
      if (entry.data.stepId) {
        await this._autoCheckpoint(wfId, entry.data.stepId);
      }
    });

    return new Promise((resolve, reject) => {
      setImmediate(async () => {
        try {
          const result = await this._engine.execute(workflow, def, context);
          workflow.status = result.status;
          workflow.updatedAt = Date.now();
          workflow.result = result;
          await this._storage.save(workflow);

          const eventName = result.status === STATES.COMPLETED ? 'workflow.completed' : 'workflow.failed';
          this._events.emit(eventName, { workflowId: wfId, status: result.status, duration: result.duration });

          this._metrics.recordExecution(wfId, {
            status: result.status,
            duration: result.duration,
            retries: result.errors?.length || 0,
            stepCount: result.nodes?.nodes?.length || 0,
          });

          resolve(result);
        } catch (err) {
          workflow.status = STATES.FAILED;
          workflow.updatedAt = Date.now();
          await this._storage.save(workflow);
          this._events.emit('workflow.failed', { workflowId: wfId, error: err.message });
          this._metrics.recordExecution(wfId, { status: 'FAILED', error: err.message });
          reject(err);
        }
      });
    });
  }

  async resumeWorkflow(wfId, options = {}) {
    const workflow = await this._storage.get(wfId);
    if (!workflow) throw new Error(`Workflow "${wfId}" not found`);

    const def = this._definitions.get(workflow.definitionId);
    if (!def) throw new Error(`Definition "${workflow.definitionId}" not found`);

    const resumed = this._engine.resume(wfId);
    if (!resumed) throw new Error(`Workflow "${wfId}" cannot be resumed`);

    this._events.emit('workflow.resumed', { workflowId: wfId, timestamp: Date.now() });
    return this._engine.getResult(wfId);
  }

  async pauseWorkflow(wfId) {
    const workflow = await this._storage.get(wfId);
    if (!workflow) throw new Error(`Workflow "${wfId}" not found`);

    const paused = this._engine.pause(wfId);
    if (!paused) throw new Error(`Workflow "${wfId}" cannot be paused`);

    workflow.status = STATES.PAUSED;
    workflow.updatedAt = Date.now();
    await this._storage.save(workflow);
    this._events.emit('workflow.paused', { workflowId: wfId, timestamp: Date.now() });
    return { workflowId: wfId, status: STATES.PAUSED };
  }

  async cancelWorkflow(wfId) {
    const workflow = await this._storage.get(wfId);
    if (!workflow) throw new Error(`Workflow "${wfId}" not found`);

    const result = this._engine.cancel(wfId);
    workflow.status = STATES.CANCELLED;
    workflow.updatedAt = Date.now();
    await this._storage.save(workflow);
    this._events.emit('workflow.cancelled', { workflowId: wfId, timestamp: Date.now() });
    return result;
  }

  async retryWorkflow(wfId, options = {}) {
    const workflow = await this._storage.get(wfId);
    if (!workflow) throw new Error(`Workflow "${wfId}" not found`);

    const def = this._definitions.get(workflow.definitionId);
    if (!def) throw new Error(`Definition "${workflow.definitionId}" not found`);

    this._events.emit('workflow.retry', { workflowId: wfId, timestamp: Date.now() });

    const newOptions = { ...workflow.options, ...options };
    const result = await this.startWorkflow(workflow.definitionId, workflow.input, newOptions);
    return result;
  }

  async getWorkflow(wfId) {
    const workflow = await this._storage.get(wfId);
    if (!workflow) return null;
    const engineResult = this._engine.getResult(wfId);
    return { ...workflow, executionResult: engineResult };
  }

  async listWorkflows(filter = {}) {
    const list = await this._storage.list(filter);
    return list;
  }

  getWorkflowGraph(wfId) {
    const result = this._engine.getResult(wfId);
    if (!result || !result.nodes) return { nodes: [], edges: [] };
    return result.nodes;
  }

  getWorkflowEvents(wfId) {
    const events = this._events.getHistory().filter(e => e.data?.workflowId === wfId);
    return events;
  }

  async getWorkflowCheckpoints(wfId) {
    return await this._checkpoints.listCheckpoints(wfId);
  }

  async _autoCheckpoint(wfId, completedStepId) {
    const workflow = await this._storage.get(wfId);
    if (!workflow) return;
    const result = this._engine.getResult(wfId);
    if (!result) return;

    await this._checkpoints.saveCheckpoint(wfId, {
      workflowId: wfId,
      completedNodes: result.nodes?.nodes?.filter(n => n.status === 'completed').map(n => n.id) || [],
      currentNode: completedStepId,
      errors: result.errors || [],
      outputs: result.output || {},
      elapsed: result.duration || 0,
      totalNodes: result.nodes?.nodes?.length || 0,
    });
  }
}

module.exports = WorkflowManager;
