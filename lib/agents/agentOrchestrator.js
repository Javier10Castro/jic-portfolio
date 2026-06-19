const ArchitectAgent = require('./architectAgent');
const DesignerAgent = require('./designerAgent');
const DeveloperAgent = require('./developerAgent');
const ContentAgent = require('./contentAgent');
const SEOAgent = require('./seoAgent');
const AccessibilityAgent = require('./accessibilityAgent');
const PerformanceAgent = require('./performanceAgent');
const DeploymentAgent = require('./deploymentAgent');
const ReviewerAgent = require('./reviewerAgent');
const QAAgent = require('./qaAgent');
const { SharedMemory, WorkingMemory } = require('./memory');
const { ExecutionGraph } = require('./planning');
const { planWorkflow } = require('./planning/taskPlanner');
const { resolveDependencies, validateDependencyOrder } = require('./planning/dependencyResolver');
const { MessageBus, AgentEvents } = require('./coordination');
const ConflictResolver = require('./coordination/conflictResolver');
const ConsensusEngine = require('./coordination/consensusEngine');

const AGENT_MAP = {
  architect: ArchitectAgent,
  designer: DesignerAgent,
  developer: DeveloperAgent,
  content: ContentAgent,
  seo: SEOAgent,
  accessibility: AccessibilityAgent,
  performance: PerformanceAgent,
  deployment: DeploymentAgent,
  reviewer: ReviewerAgent,
  qa: QAAgent,
};

const ALL_AGENT_NAMES = Object.keys(AGENT_MAP);

const TIMEOUT_DEFAULT = 30000;
const RETRY_MAX = 2;
const WORKFLOWS = new Map();

class AgentOrchestrator {
  constructor(options = {}) {
    this.options = options;
    this.shared = new SharedMemory();
    this.working = new WorkingMemory();
    this.bus = new MessageBus();
    this.events = new AgentEvents();
    this.conflictResolver = new ConflictResolver();
    this.consensus = new ConsensusEngine();
    this._agents = new Map();
    this._workflowIdCounter = 0;
    this._cancelled = new Set();
  }

  registerAgent(name, AgentClass) {
    this._agents.set(name, AgentClass);
  }

  getAgent(name) {
    const AgentClass = this._agents.get(name) || AGENT_MAP[name];
    if (!AgentClass) return null;
    if (!this._agents.has(name)) {
      this._agents.set(name, AgentClass);
    }
    return new AgentClass();
  }

  async executeWorkflow(task, options = {}) {
    const workflowId = `wf-${++this._workflowIdCounter}-${Date.now().toString(36)}`;
    const startTime = Date.now();
    this._cancelled.delete(workflowId);

    this.events.emit('workflow.started', { workflowId, task: task.type });
    this.shared.setContext('workflowId', workflowId);
    this.shared.setContext('task', task);

    const agentNames = options.agents || ALL_AGENT_NAMES;
    const plan = planWorkflow(task, { agents: agentNames });
    const graph = plan.graph;
    const timeout = options.timeout || TIMEOUT_DEFAULT;
    const maxRetries = options.maxRetries != null ? options.maxRetries : RETRY_MAX;

    const workflow = { workflowId, task, plan, graph, agents: [], startTime, status: 'running' };
    WORKFLOWS.set(workflowId, workflow);

    for (const name of agentNames) {
      const agent = this.getAgent(name);
      if (!agent) continue;
      await agent.initialize();
      this.working.pushFrame({ agent: name, status: 'initialized' });
    }

    const executionOrder = plan.executionOrder;
    const agents = {};

    for (const name of executionOrder) {
      if (this._cancelled.has(workflowId)) {
        this.events.emit('workflow.failed', { workflowId, reason: 'cancelled' });
        workflow.status = 'cancelled';
        return { success: false, workflowId, status: 'cancelled', reason: 'Workflow cancelled' };
      }

      const agent = this.getAgent(name);
      if (!agent) continue;
      agents[name] = agent;
      graph.markRunning(name);
      this.events.emit('agent.started', { workflowId, agent: name });

      this.shared.setContext('currentAgent', name);
      const context = { shared: this.shared, working: this.working, bus: this.bus, workflowId };

      let lastError = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
          this.events.emit('agent.retry', { workflowId, agent: name, attempt });
          agent.metrics.retries++;
        }

        try {
          const result = await this._executeWithTimeout(agent, task, context, timeout);
          if (result.success) {
            graph.markCompleted(name, result.output);
            this.shared.addArtifact(name, result.output, { agent: name, confidence: result.confidence });
            this.events.emit('agent.completed', { workflowId, agent: name, duration: result.executionTime, confidence: result.confidence });
            workflow.agents.push({ name, status: 'completed', duration: result.executionTime, confidence: result.confidence });
            break;
          } else {
            lastError = result.issues?.[0]?.message || 'Agent execution returned failure';
            if (attempt < maxRetries) {
              this.events.emit('agent.retry', { workflowId, agent: name, attempt: attempt + 1, error: lastError });
            }
          }
        } catch (err) {
          lastError = err.message;
          if (err.message === 'timeout') {
            this.events.emit('agent.timeout', { workflowId, agent: name, timeout });
            break;
          }
          if (attempt < maxRetries) {
            this.events.emit('agent.retry', { workflowId, agent: name, attempt: attempt + 1, error: err.message });
          }
        }
      }

      if (graph.getNode(name).status !== 'completed') {
        graph.markFailed(name, lastError);
        this.events.emit('agent.failed', { workflowId, agent: name, error: lastError });
        workflow.agents.push({ name, status: 'failed', error: lastError });
      }
    }

    const reviewAgent = new ReviewerAgent();
    this.events.emit('agent.review.started', { workflowId });
    const reviewResult = await reviewAgent.execute(task, context);
    this.shared.addArtifact('reviewer', reviewResult.output);
    this.events.emit('agent.review.completed', { workflowId, passed: reviewResult.output.passed });

    const qaAgent = new QAAgent();
    const qaResult = await qaAgent.execute(task, context);
    this.shared.addArtifact('qa', qaResult.output);

    const conflicts = this.conflictResolver.detect(workflow.agents);
    const resolvedConflicts = conflicts.length > 0 ? this.conflictResolver.resolveConflicts(conflicts, { projectType: task.type }) : [];

    const totalTime = Date.now() - startTime;
    workflow.duration = totalTime;
    workflow.status = graph.hasFailures() ? 'failed' : 'completed';

    if (workflow.status === 'completed') {
      this.events.emit('workflow.completed', { workflowId, duration: totalTime, agents: agentNames.length });
    } else {
      this.events.emit('workflow.failed', { workflowId, duration: totalTime, failedAgents: executionOrder.filter(n => graph.getNode(n)?.status === 'failed') });
    }

    return {
      success: workflow.status === 'completed',
      workflowId,
      status: workflow.status,
      duration: totalTime,
      agents: workflow.agents,
      graph: graph.toJSON(),
      review: { result: reviewResult.output, passed: reviewResult.output.passed },
      qa: { result: qaResult.output, passed: qaResult.output.passed },
      conflicts: resolvedConflicts,
      artifacts: this.shared.listArtifacts(),
    };
  }

  async executeSequential(tasks, options = {}) {
    const results = [];
    for (const task of tasks) {
      results.push(await this.executeWorkflow(task, options));
    }
    return results;
  }

  async executeParallel(tasks, options = {}) {
    return Promise.all(tasks.map(task => this.executeWorkflow(task, options)));
  }

  cancelWorkflow(workflowId) {
    this._cancelled.add(workflowId);
    const wf = WORKFLOWS.get(workflowId);
    if (wf) wf.status = 'cancelled';
    return { success: true, workflowId };
  }

  getWorkflowStatus(workflowId) {
    const wf = WORKFLOWS.get(workflowId);
    if (!wf) return null;
    return {
      workflowId: wf.workflowId,
      status: wf.status,
      task: wf.task,
      agents: wf.agents,
      duration: wf.duration || (Date.now() - wf.startTime),
      startedAt: wf.startTime,
    };
  }

  listWorkflows(limit = 20) {
    const list = [];
    for (const [, wf] of WORKFLOWS) {
      list.push({
        workflowId: wf.workflowId,
        task: wf.task?.type || 'unknown',
        status: wf.status,
        agents: wf.agents?.length || 0,
        duration: wf.duration || null,
        startedAt: wf.startTime,
      });
      if (list.length >= limit) break;
    }
    return list.reverse();
  }

  getMetrics() {
    const allAgents = [];
    for (const name of ALL_AGENT_NAMES) {
      const agent = this.getAgent(name);
      if (agent) allAgents.push(agent.metricsReport());
    }
    return {
      agents: allAgents,
      totalWorkflows: WORKFLOWS.size,
      activeWorkflows: Array.from(WORKFLOWS.values()).filter(w => w.status === 'running').length,
      busMessageCount: this.bus.getHistory().length,
      consensusDecisions: this.consensus.getDecisionHistory().length,
    };
  }

  async _executeWithTimeout(agent, task, context, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), timeout);
      agent.execute(task, context).then(result => {
        clearTimeout(timer);
        resolve(result);
      }).catch(err => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}

async function executeAgentWorkflow(task, context = {}) {
  const orchestrator = new AgentOrchestrator();
  return orchestrator.executeWorkflow(task, context);
}

module.exports = { AgentOrchestrator, executeAgentWorkflow, WORKFLOWS, AGENT_MAP, ALL_AGENT_NAMES };
