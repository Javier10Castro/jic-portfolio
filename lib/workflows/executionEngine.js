const ExecutionGraph = require('./executionGraph');
const RetryEngine = require('./retryEngine');
const { WorkflowStateMachine, STATES } = require('./workflowStateMachine');
const { WorkflowEvents } = require('./workflowEvents');
const { WorkflowDefinition } = require('./workflowDefinition');

class ExecutionEngine {
  constructor(options = {}) {
    this._retry = new RetryEngine(options.retry);
    this._events = new WorkflowEvents();
    this._running = new Map();
    this._results = new Map();
    this._terminated = new Set();
  }

  get events() {
    return this._events;
  }

  async execute(workflow, definition, context = {}) {
    const wfId = workflow.id;
    if (this._running.has(wfId)) throw new Error(`Workflow "${wfId}" is already running`);
    if (this._terminated.has(wfId)) this._terminated.delete(wfId);

    const def = definition instanceof WorkflowDefinition ? definition : new WorkflowDefinition(definition);
    const graph = new ExecutionGraph();
    const stateMachine = new WorkflowStateMachine(workflow.status || STATES.CREATED);
    const startTime = Date.now();

    this._buildGraph(graph, def.steps);
    this._running.set(wfId, { graph, stateMachine, startTime, cancelled: false });
    this._events.emit('workflow.started', { workflowId: wfId, definition: def.id, timestamp: startTime });

    if (stateMachine.canTransition(STATES.QUEUED)) stateMachine.transition(STATES.QUEUED);
    if (stateMachine.canTransition(STATES.RUNNING)) stateMachine.transition(STATES.RUNNING);

    try {
      const result = await this._executeGraph(wfId, graph, def, context, stateMachine);
      const duration = Date.now() - startTime;

      if (!this._terminated.has(wfId)) {
        if (graph.hasFailed() && !stateMachine.isTerminal()) {
          stateMachine.transition(STATES.FAILED);
          this._events.emit('workflow.failed', { workflowId: wfId, duration, errors: result.errors });
        } else if (!stateMachine.isTerminal()) {
          stateMachine.transition(STATES.COMPLETED);
          this._events.emit('workflow.completed', { workflowId: wfId, duration, output: result.output });
        }
      }

      const final = {
        workflowId: wfId,
        status: stateMachine.state,
        duration,
        output: result.output,
        errors: result.errors,
        nodes: graph.toJSON(),
        stateHistory: stateMachine.getHistory(),
      };

      this._results.set(wfId, final);
      this._running.delete(wfId);
      return final;
    } catch (err) {
      this._running.delete(wfId);
      throw err;
    }
  }

  async _executeGraph(wfId, graph, def, context, stateMachine) {
    const output = {};
    const errors = [];
    const maxIterations = (def.steps?.length || 1) * 100;
    let iterations = 0;

    while (!graph.isComplete() && !this._terminated.has(wfId)) {
      if (iterations++ > maxIterations) throw new Error(`Workflow "${wfId}" exceeded max iterations`);
      if (stateMachine.state === STATES.PAUSED || stateMachine.state === STATES.WAITING) {
        await this._sleep(100);
        continue;
      }

      if (stateMachine.state === STATES.CANCELLED) break;

      const readyNodes = graph.getReadyNodes();
      if (readyNodes.length === 0 && !graph.isComplete()) {
        const running = graph.getRunningNodes();
        if (running.length === 0) break;
        await this._sleep(50);
        continue;
      }

      const promises = readyNodes.map(node =>
        this._executeNode(wfId, graph, node, def, context, stateMachine, output, errors)
      );
      await Promise.all(promises);
    }

    return { output, errors };
  }

  async _executeNode(wfId, graph, node, def, context, stateMachine, output, errors) {
    if (this._terminated.has(wfId)) return;

    const stepDef = def.steps?.find(s => s.id === node.id);
    if (!stepDef) {
      graph.markCompleted(node.id, null);
      return;
    }

    this._events.emit('workflow.step.started', { workflowId: wfId, stepId: node.id, type: stepDef.type });
    graph.markStarted(node.id);

    try {
      const result = await this._retry.executeWithRetry(
        async (attempt) => {
          return await this._runStep(stepDef, context, output, wfId);
        },
        node.id,
        stepDef.retryPolicy || def.retryPolicy
      );

      if (result.success) {
        graph.markCompleted(node.id, result.result);
        output[node.id] = result.result;
        this._events.emit('workflow.step.completed', { workflowId: wfId, stepId: node.id, type: stepDef.type, attempts: result.attempts });
      } else {
        graph.markFailed(node.id, result.error);
        errors.push({ stepId: node.id, error: result.error, attempts: result.attempts });
        this._events.emit('workflow.step.failed', { workflowId: wfId, stepId: node.id, error: result.error });

        if (stepDef.type === 'conditional' || stepDef.type === 'parallel') {
          const branchOutput = this._handleBranchFallback(stepDef, output, wfId);
          if (branchOutput !== null) {
            graph.markCompleted(node.id, branchOutput);
            output[node.id] = branchOutput;
            const last = errors.pop();
          }
        }

        if (stepDef.optional) {
          output[node.id] = { skipped: true, reason: result.error };
          graph.markCompleted(node.id, { skipped: true });
        }
      }
    } catch (err) {
      graph.markFailed(node.id, err.message);
      errors.push({ stepId: node.id, error: err.message });
    }
  }

  async _runStep(step, context, output, wfId) {
    switch (step.type) {
      case 'noop':
        return { skipped: true };

      case 'task':
        return this._executeTask(step, context, output);

      case 'agent':
        return this._executeAgent(step, context, output);

      case 'conditional':
        return this._executeConditional(step, context, output);

      case 'parallel':
        return this._executeParallel(step, context, output, wfId);

      case 'foreach':
        return this._executeForEach(step, context, output);

      case 'wait':
        return this._executeWait(step);

      case 'subworkflow':
        return this._executeSubworkflow(step, context, output);

      default:
        return this._executeTask(step, context, output);
    }
  }

  async _executeTask(step, context, output) {
    if (step.handler && typeof step.handler === 'function') {
      return await step.handler({ context, outputs: output, params: step.params || {} });
    }
    if (step.action && context[step.action] && typeof context[step.action] === 'function') {
      return await context[step.action](step.params || {});
    }
    return { processed: true, params: step.params || {} };
  }

  async _executeAgent(step, context, output) {
    if (context.agentOrchestrator && typeof context.agentOrchestrator.executeWorkflow === 'function') {
      const agentContext = { shared: context.shared, task: step.params || {} };
      const result = await context.agentOrchestrator.executeWorkflow(
        { type: step.agent, description: step.description || '', ...step.params },
        { agents: [step.agent], timeout: step.timeout || 30000 }
      );
      return result;
    }
    return { simulated: true, agent: step.agent, output: `Simulated execution of ${step.agent}` };
  }

  async _executeConditional(step, context, output) {
    const { condition } = step;
    const fieldValue = this._resolveField(condition.field, context, output);
    let matched = false;

    switch (condition.operator) {
      case 'equals': matched = fieldValue === condition.value; break;
      case 'notEquals': matched = fieldValue !== condition.value; break;
      case 'contains': matched = String(fieldValue || '').includes(condition.value); break;
      case 'gt': matched = Number(fieldValue) > Number(condition.value); break;
      case 'gte': matched = Number(fieldValue) >= Number(condition.value); break;
      case 'lt': matched = Number(fieldValue) < Number(condition.value); break;
      case 'lte': matched = Number(fieldValue) <= Number(condition.value); break;
      case 'exists': matched = fieldValue != null; break;
      case 'truthy': matched = !!fieldValue; break;
    }

    const branchKey = matched ? 'true' : 'false';
    const branchSteps = step.branches?.[branchKey] || [];
    const branchOutput = { matched, branch: branchKey, results: [] };

    for (const bs of branchSteps) {
      const r = await this._runStep(bs, context, output, null);
      branchOutput.results.push({ stepId: bs.id, output: r });
    }

    return branchOutput;
  }

  async _executeParallel(step, context, output, wfId) {
    const branchEntries = Object.entries(step.branches || {});
    const results = await Promise.allSettled(
      branchEntries.map(async ([key, steps]) => {
        const branchResults = [];
        for (const s of steps) {
          const r = await this._runStep(s, { ...context, branch: key }, output, wfId);
          branchResults.push({ stepId: s.id, output: r });
        }
        return { branch: key, results: branchResults };
      })
    );

    return {
      branches: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message }),
    };
  }

  async _executeForEach(step, context, output) {
    const collection = this._resolveField(step.collection, context, output) || [];
    const itemResults = [];

    for (let i = 0; i < collection.length; i++) {
      const itemContext = { ...context, item: collection[i], itemIndex: i };
      for (const s of step.steps || []) {
        const r = await this._runStep(s, itemContext, output, null);
        itemResults.push({ stepId: s.id, index: i, output: r });
      }
    }

    return { count: collection.length, results: itemResults };
  }

  async _executeWait(step) {
    const duration = step.duration || step.params?.duration || 1000;
    await this._sleep(duration);
    return { waited: duration };
  }

  async _executeSubworkflow(step, context, output) {
    const subId = step.workflowId;
    if (context.subworkflows && context.subworkflows[subId]) {
      const subDef = context.subworkflows[subId];
      return await this.execute(
        { id: `${subId}-${Date.now()}`, status: STATES.CREATED },
        subDef,
        { ...context, parentOutput: output }
      );
    }
    return { simulated: true, subworkflow: subId };
  }

  _handleBranchFallback(step, output, wfId) {
    if (!step.branches) return null;
    const results = {};
    for (const [key, steps] of Object.entries(step.branches)) {
      results[key] = { skipped: true, reason: 'Fallback due to execution error' };
    }
    return { fallback: true, branches: results };
  }

  _resolveField(fieldPath, context, output) {
    if (!fieldPath) return undefined;
    const parts = fieldPath.split('.');
    let value = { context, output };
    for (const part of parts) {
      if (value == null) return undefined;
      value = value[part];
    }
    return value;
  }

  _buildGraph(graph, steps) {
    if (!steps) return;
    for (const step of steps) {
      graph.addNode(step.id, { type: step.type, label: step.name || step.id });
    }

    const stepMap = {};
    for (const step of steps) stepMap[step.id] = step;

    for (const step of steps) {
      if (step.dependsOn) {
        const deps = Array.isArray(step.dependsOn) ? step.dependsOn : [step.dependsOn];
        for (const dep of deps) {
          if (stepMap[dep]) graph.addEdge(dep, step.id);
        }
      }
    }
  }

  pause(wfId) {
    const running = this._running.get(wfId);
    if (!running) return false;
    if (running.stateMachine.canTransition(STATES.PAUSED)) {
      running.stateMachine.transition(STATES.PAUSED);
      this._events.emit('workflow.paused', { workflowId: wfId });
      return true;
    }
    return false;
  }

  resume(wfId) {
    const running = this._running.get(wfId);
    if (!running) return false;
    if (running.stateMachine.canResume()) {
      running.stateMachine.transition(STATES.RUNNING);
      this._events.emit('workflow.resumed', { workflowId: wfId });
      return true;
    }
    return false;
  }

  cancel(wfId) {
    const running = this._running.get(wfId);
    if (running) {
      running.stateMachine.transition(STATES.CANCELLED);
      running.cancelled = true;
    }
    this._terminated.add(wfId);
    this._events.emit('workflow.cancelled', { workflowId: wfId });

    if (!this._results.has(wfId)) {
      this._results.set(wfId, { workflowId: wfId, status: STATES.CANCELLED, duration: 0, output: {}, errors: [], nodes: { nodes: [], edges: [] }, stateHistory: [] });
    }
    return { workflowId: wfId, status: STATES.CANCELLED };
  }

  getResult(wfId) {
    return this._results.get(wfId) || null;
  }

  isRunning(wfId) {
    return this._running.has(wfId);
  }

  getRunningCount() {
    return this._running.size;
  }

  query(query = {}) {
    const results = Array.from(this._results.values());
    if (query.status) return results.filter(r => r.status === query.status);
    return results;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ExecutionEngine;
