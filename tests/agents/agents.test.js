const assert = require('assert');

describe('Multi-Agent System', function() {
  describe('Agent Memory', () => {
    const AgentMemory = require('../../lib/agents/memory/agentMemory');

    it('stores and retrieves values', () => {
      const m = new AgentMemory('test');
      m.set('key1', 'value1');
      assert.strictEqual(m.get('key1'), 'value1');
    });

    it('returns null for missing keys', () => {
      const m = new AgentMemory('test');
      assert.strictEqual(m.get('nonexistent'), null);
    });

    it('has() checks key existence', () => {
      const m = new AgentMemory('test');
      m.set('a', 1);
      assert(m.has('a'));
      assert(!m.has('b'));
    });

    it('delete() removes keys', () => {
      const m = new AgentMemory('test');
      m.set('a', 1);
      m.delete('a');
      assert(!m.has('a'));
    });

    it('clear() removes all', () => {
      const m = new AgentMemory('test');
      m.set('a', 1);
      m.set('b', 2);
      m.clear();
      assert.strictEqual(m.size(), 0);
    });

    it('remember() stores event history', () => {
      const m = new AgentMemory('test');
      m.remember('task.started', { id: 1 });
      m.remember('task.completed', { id: 1 });
      assert.strictEqual(m.recall('task.started').length, 1);
      assert.strictEqual(m.recall('task.completed').length, 1);
    });

    it('getHistory returns events', () => {
      const m = new AgentMemory('test');
      m.remember('a', {});
      m.remember('b', {});
      assert.strictEqual(m.getHistory().length, 2);
    });

    it('snapshot returns state', () => {
      const m = new AgentMemory('test');
      m.set('x', 10);
      m.remember('event', {});
      const snap = m.snapshot();
      assert.strictEqual(snap.agentId, 'test');
      assert.strictEqual(snap.store.x, 10);
    });
  });

  describe('Shared Memory', () => {
    const SharedMemory = require('../../lib/agents/memory/sharedMemory');

    it('manages context', () => {
      const m = new SharedMemory();
      m.setContext('project', 'test');
      assert.strictEqual(m.getContext('project'), 'test');
    });

    it('getAllContext returns all', () => {
      const m = new SharedMemory();
      m.setContext('a', 1);
      m.setContext('b', 2);
      assert.deepStrictEqual(m.getAllContext(), { a: 1, b: 2 });
    });

    it('manages artifacts', () => {
      const m = new SharedMemory();
      m.addArtifact('plan', { pages: 5 }, { version: 1 });
      assert(m.hasArtifact('plan'));
      assert.strictEqual(m.getArtifact('plan').pages, 5);
    });

    it('listArtifacts returns metadata', () => {
      const m = new SharedMemory();
      m.addArtifact('a', { data: 1 });
      const list = m.listArtifacts();
      assert(list.some(l => l.name === 'a'));
    });

    it('removeArtifact deletes', () => {
      const m = new SharedMemory();
      m.addArtifact('x', {});
      m.removeArtifact('x');
      assert(!m.hasArtifact('x'));
    });

    it('addMessage stores messages', () => {
      const m = new SharedMemory();
      const msg = m.addMessage('architect', 'developer', 'request', { task: 'build' });
      assert(msg.id);
      assert.strictEqual(msg.from, 'architect');
      assert.strictEqual(msg.to, 'developer');
    });

    it('getMessage filters by agent', () => {
      const m = new SharedMemory();
      m.addMessage('a', 'b', 't', {});
      m.addMessage('c', 'd', 't', {});
      assert.strictEqual(m.getMessages('a').length, 1);
    });
  });

  describe('Working Memory', () => {
    const WorkingMemory = require('../../lib/agents/memory/workingMemory');

    it('manages state', () => {
      const w = new WorkingMemory();
      w.setState('phase', 'design');
      assert.strictEqual(w.getState('phase'), 'design');
    });

    it('pushFrame and popFrame stack', () => {
      const w = new WorkingMemory();
      w.pushFrame({ agent: 'architect' });
      w.pushFrame({ agent: 'designer' });
      const top = w.popFrame();
      assert.strictEqual(top.agent, 'designer');
      assert.strictEqual(w.peekFrame().agent, 'architect');
    });

    it('getAllState returns all', () => {
      const w = new WorkingMemory();
      w.setState('a', 1);
      w.setState('b', 2);
      assert.deepStrictEqual(w.getAllState(), { a: 1, b: 2 });
    });
  });

  describe('Execution Graph', () => {
    const ExecutionGraph = require('../../lib/agents/planning/executionGraph');

    it('adds nodes', () => {
      const g = new ExecutionGraph();
      g.addNode('architect');
      assert(g.getNode('architect'));
    });

    it('throws on duplicate node', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      assert.throws(() => g.addNode('a'));
    });

    it('adds edges', () => {
      const g = new ExecutionGraph();
      g.addNode('architect');
      g.addNode('designer');
      g.addEdge('architect', 'designer');
      const node = g.getNode('designer');
      assert(node.dependencies.includes('architect'));
    });

    it('getReadyNodes returns nodes with met dependencies', () => {
      const g = new ExecutionGraph();
      g.addNode('architect');
      g.addNode('designer');
      g.addEdge('architect', 'designer');
      const ready = g.getReadyNodes();
      assert.strictEqual(ready.length, 1);
      assert.strictEqual(ready[0].id, 'architect');
    });

    it('marks completed and failed', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.markCompleted('a', { output: 'done' });
      assert.strictEqual(g.getNode('a').status, 'completed');
      g.markFailed('b', 'error');
    });

    it('isComplete checks all nodes', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.markCompleted('a', {});
      assert(g.isComplete());
    });

    it('getExecutionOrder returns DAG order', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.addNode('b');
      g.addNode('c');
      g.addEdge('a', 'b');
      g.addEdge('b', 'c');
      const order = g.getExecutionOrder();
      assert.deepStrictEqual(order, ['a', 'b', 'c']);
    });

    it('toJSON serializes graph', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      const json = g.toJSON();
      assert(Array.isArray(json.nodes));
      assert(Array.isArray(json.edges));
    });
  });

  describe('Dependency Resolver', () => {
    const { resolveDependencies, suggestParallelGroups, validateDependencyOrder, DEPENDENCIES } = require('../../lib/agents/planning/dependencyResolver');

    it('resolves dependencies for agents', () => {
      const deps = resolveDependencies({}, ['architect', 'designer']);
      assert(deps.find(d => d.agent === 'designer').dependencies.includes('architect'));
    });

    it('suggestParallelGroups returns applicable groups', () => {
      const groups = suggestParallelGroups(['designer', 'content', 'seo']);
      assert(groups.some(g => g.includes('designer') && g.includes('content')));
    });

    it('validateDependencyOrder passes valid order', () => {
      const result = validateDependencyOrder(['architect', 'designer', 'developer'], ['architect', 'designer', 'developer']);
      assert(result.valid);
    });

    it('validateDependencyOrder fails invalid order', () => {
      const result = validateDependencyOrder(['developer', 'architect'], ['architect', 'developer']);
      assert(!result.valid);
    });

    it('DEPENDENCIES defines all agents', () => {
      assert(DEPENDENCIES.architect);
      assert(DEPENDENCIES.designer);
      assert(DEPENDENCIES.developer);
      assert(DEPENDENCIES.content);
      assert(DEPENDENCIES.seo);
      assert(DEPENDENCIES.reviewer);
      assert(DEPENDENCIES.qa);
    });
  });

  describe('Task Planner', () => {
    const { planWorkflow, estimateDuration, ALL_AGENTS } = require('../../lib/agents/planning/taskPlanner');

    it('planWorkflow creates execution plan', () => {
      const plan = planWorkflow({ type: 'website' });
      assert(plan.graph);
      assert(Array.isArray(plan.executionOrder));
      assert(plan.executionOrder.length > 0);
      assert.strictEqual(plan.totalAgents, ALL_AGENTS.length);
    });

    it('executionOrder respects dependencies', () => {
      const plan = planWorkflow({ type: 'website' });
      const order = plan.executionOrder;
      assert(order.indexOf('architect') < order.indexOf('designer'));
      assert(order.indexOf('architect') < order.indexOf('developer'));
      assert(order.indexOf('reviewer') > order.indexOf('developer'));
      assert(order.indexOf('qa') > order.indexOf('reviewer'));
    });

    it('planWorkflow with custom agents', () => {
      const plan = planWorkflow({ type: 'test' }, { agents: ['architect', 'developer', 'qa'] });
      assert.strictEqual(plan.totalAgents, 3);
    });

    it('estimateDuration returns number', () => {
      const dur = estimateDuration(['architect', 'developer']);
      assert(typeof dur === 'number');
      assert(dur > 0);
    });

    it('ALL_AGENTS has all 10 agents', () => {
      assert.strictEqual(ALL_AGENTS.length, 10);
    });
  });

  describe('Message Bus', () => {
    const MessageBus = require('../../lib/agents/coordination/messageBus');

    it('publishes and subscribes', (done) => {
      const bus = new MessageBus();
      bus.subscribe('test', 'custom.event', (msg) => {
        assert.strictEqual(msg.type, 'custom.event');
        assert.strictEqual(msg.payload.data, 'hello');
        done();
      });
      bus.publish('sender', 'test', 'custom.event', { data: 'hello' });
    });

    it('broadcast sends to all', (done) => {
      const bus = new MessageBus();
      bus.subscribe('a', 'broadcast.test', () => { done(); });
      bus.broadcast('system', 'broadcast.test', {});
    });

    it('getHistory returns messages', () => {
      const bus = new MessageBus();
      bus.publish('a', 'b', 'test', {});
      assert(bus.getHistory().length > 0);
    });

    it('clear removes all', () => {
      const bus = new MessageBus();
      bus.publish('a', 'b', 't', {});
      bus.clear();
      assert.strictEqual(bus.getHistory().length, 0);
    });
  });

  describe('Agent Events', () => {
    const { AgentEvents, EVENT_TYPES } = require('../../lib/agents/coordination/agentEvents');

    it('emits and listens', (done) => {
      const events = new AgentEvents();
      events.on('agent.started', (entry) => {
        assert.strictEqual(entry.type, 'agent.started');
        done();
      });
      events.emit('agent.started', { agent: 'test' });
    });

    it('getHistory returns events', () => {
      const events = new AgentEvents();
      events.emit('agent.started', {});
      events.emit('agent.completed', {});
      assert.strictEqual(events.getHistory().length, 2);
    });

    it('getHistory filters by type', () => {
      const events = new AgentEvents();
      events.emit('agent.started', {});
      events.emit('agent.completed', {});
      assert.strictEqual(events.getHistory('agent.started').length, 1);
    });

    it('EVENT_TYPES has all events', () => {
      assert(EVENT_TYPES.includes('agent.started'));
      assert(EVENT_TYPES.includes('workflow.started'));
      assert(EVENT_TYPES.includes('consensus.reached'));
    });

    it('clear removes all', () => {
      const events = new AgentEvents();
      events.emit('agent.started', {});
      events.clear();
      assert.strictEqual(events.getHistory().length, 0);
    });
  });

  describe('Consensus Engine', () => {
    const ConsensusEngine = require('../../lib/agents/coordination/consensusEngine');

    it('resolves single option', () => {
      const e = new ConsensusEngine();
      const result = e.resolve([{ agent: 'architect', value: 'react', confidence: 0.9 }]);
      assert(result.resolved);
      assert.strictEqual(result.decision, 'react');
    });

    it('resolves conflicts by scoring', () => {
      const e = new ConsensusEngine();
      const conflicts = [
        { agent: 'architect', value: 'vue', confidence: 0.8 },
        { agent: 'developer', value: 'react', confidence: 0.9 },
      ];
      const result = e.resolve(conflicts);
      assert(result.resolved);
      assert.strictEqual(result.decision, 'react');
    });

    it('returns empty result for no conflicts', () => {
      const e = new ConsensusEngine();
      const result = e.resolve([]);
      assert(result.resolved);
      assert.strictEqual(result.reason, 'No conflicts');
    });

    it('getDecisionHistory returns previous decisions', () => {
      const e = new ConsensusEngine();
      e.resolve([{ agent: 'a', value: 'x' }]);
      assert(e.getDecisionHistory().length > 0);
    });
  });

  describe('Conflict Resolver', () => {
    const ConflictResolver = require('../../lib/agents/coordination/conflictResolver');

    it('detects technology conflicts', () => {
      const r = new ConflictResolver();
      const agents = [
        { constructor: { name: 'ArchitectAgent' }, output: { technology: 'react' } },
        { constructor: { name: 'DeveloperAgent' }, output: { technology: 'vue' } },
      ];
      const conflicts = r.detect(agents);
      assert(conflicts.length > 0);
      assert.strictEqual(conflicts[0].type, 'technology');
    });

    it('resolveConflicts resolves detected conflicts', () => {
      const r = new ConflictResolver();
      const agents = [
        { constructor: { name: 'ArchitectAgent' }, output: { technology: 'react', confidence: 0.8 } },
        { constructor: { name: 'DeveloperAgent' }, output: { technology: 'vue', confidence: 0.7 } },
      ];
      const conflicts = r.detect(agents);
      const resolved = r.resolveConflicts(conflicts);
      assert(resolved.length > 0);
      assert(resolved[0].resolved.decision);
    });
  });

  describe('Base Agent', () => {
    const BaseAgent = require('../../lib/agents/baseAgent');

    it('initializes', async () => {
      const a = new BaseAgent('test', 'Test Agent');
      const result = await a.initialize();
      assert(result.success);
    });

    it('throws on unimplemented execute', async () => {
      const a = new BaseAgent('test', 'Test');
      try {
        await a.execute({}, {});
        assert.fail('should throw');
      } catch (err) {
        assert(err.message.includes('not implemented'));
      }
    });

    it('summarizes output', () => {
      const a = new BaseAgent('test', 'Test');
      const s = a.summarize({ key: 'value' });
      assert.strictEqual(s.agent, 'test');
    });

    it('health returns ok after init', async () => {
      const a = new BaseAgent('test', 'Test');
      await a.initialize();
      const h = await a.health();
      assert.strictEqual(h.status, 'ok');
    });

    it('metricsReport returns counters', () => {
      const a = new BaseAgent('test', 'Test');
      const m = a.metricsReport();
      assert.strictEqual(m.executions, 0);
    });
  });

  describe('Specialized Agents', () => {
    const ArchitectAgent = require('../../lib/agents/architectAgent');
    const DesignerAgent = require('../../lib/agents/designerAgent');
    const DeveloperAgent = require('../../lib/agents/developerAgent');
    const ContentAgent = require('../../lib/agents/contentAgent');
    const SEOAgent = require('../../lib/agents/seoAgent');
    const AccessibilityAgent = require('../../lib/agents/accessibilityAgent');
    const PerformanceAgent = require('../../lib/agents/performanceAgent');
    const DeploymentAgent = require('../../lib/agents/deploymentAgent');
    const ReviewerAgent = require('../../lib/agents/reviewerAgent');
    const QAAgent = require('../../lib/agents/qaAgent');

    const agents = [
      { name: 'Architect', Class: ArchitectAgent },
      { name: 'Designer', Class: DesignerAgent },
      { name: 'Developer', Class: DeveloperAgent },
      { name: 'Content', Class: ContentAgent },
      { name: 'SEO', Class: SEOAgent },
      { name: 'Accessibility', Class: AccessibilityAgent },
      { name: 'Performance', Class: PerformanceAgent },
      { name: 'Deployment', Class: DeploymentAgent },
      { name: 'Reviewer', Class: ReviewerAgent },
      { name: 'QA', Class: QAAgent },
    ];

    for (const { name, Class: AgentClass } of agents) {
      it(`${name} Agent executes and returns correct shape`, async () => {
        const agent = new AgentClass();
        await agent.initialize();
        const result = await agent.execute({ type: 'website', description: 'Build a landing page' }, { shared: { getArtifact: () => null, listArtifacts: () => [] } });
        assert('success' in result);
        assert('output' in result);
        assert('confidence' in result);
        assert('executionTime' in result);
        assert(typeof result.executionTime === 'number');
      });

      it(`${name} Agent tracks metrics`, async () => {
        const agent = new AgentClass();
        await agent.initialize();
        await agent.execute({ type: 'website' }, { shared: { getArtifact: () => null, listArtifacts: () => [] } });
        const m = agent.metricsReport();
        assert.strictEqual(m.executions, 1);
        assert(m.totalTime >= 0);
      });
    }
  });

  describe('Agent Orchestrator', () => {
    const { AgentOrchestrator } = require('../../lib/agents/agentOrchestrator');

    it('executes full workflow', async () => {
      const orch = new AgentOrchestrator();
      const result = await orch.executeWorkflow(
        { type: 'website', description: 'Test site' },
        { agents: ['architect', 'designer', 'developer'], timeout: 5000 }
      );
      assert('success' in result);
      assert('workflowId' in result);
      assert(result.workflowId.startsWith('wf-'));
      assert(Array.isArray(result.agents));
      assert(result.agents.length > 0);
    });

    it('executes workflow with review and QA', async () => {
      const orch = new AgentOrchestrator();
      const result = await orch.executeWorkflow(
        { type: 'landing-page' },
        { agents: ['architect', 'designer', 'content', 'reviewer', 'qa'], timeout: 5000 }
      );
      assert(result.review);
      assert(result.review.passed !== undefined);
      assert(result.qa);
      assert(result.qa.passed !== undefined);
    });

    it('getWorkflowStatus returns status', async () => {
      const orch = new AgentOrchestrator();
      const result = await orch.executeWorkflow({ type: 'test' }, { agents: ['architect'], timeout: 5000 });
      const status = orch.getWorkflowStatus(result.workflowId);
      assert(status);
      assert(status.status);
      assert.strictEqual(status.workflowId, result.workflowId);
    });

    it('getWorkflowStatus returns null for unknown', () => {
      const orch = new AgentOrchestrator();
      assert.strictEqual(orch.getWorkflowStatus('nonexistent'), null);
    });

    it('listWorkflows returns workflow list', async () => {
      const orch = new AgentOrchestrator();
      await orch.executeWorkflow({ type: 'a' }, { agents: ['architect'], timeout: 5000 });
      const list = orch.listWorkflows();
      assert(Array.isArray(list));
      assert(list.length > 0);
    });

    it('cancelWorkflow marks workflow as cancelled', () => {
      const orch = new AgentOrchestrator();
      const result = orch.cancelWorkflow('test-wf');
      assert(result.success);
    });

    it('getMetrics returns agent and workflow metrics', async () => {
      const orch = new AgentOrchestrator();
      await orch.executeWorkflow({ type: 'test' }, { agents: ['architect'], timeout: 5000 });
      const metrics = orch.getMetrics();
      assert(Array.isArray(metrics.agents));
      assert(typeof metrics.totalWorkflows === 'number');
      assert(metrics.totalWorkflows > 0);
    });

    it('getAgent returns null for unknown', () => {
      const orch = new AgentOrchestrator();
      assert.strictEqual(orch.getAgent('nonexistent'), null);
    });

    it('registers custom agent class', () => {
      const orch = new AgentOrchestrator();
      class CustomAgent extends require('../../lib/agents/baseAgent') {
        constructor() { super('custom', 'Custom'); }
        async execute() { return { success: true, output: {}, confidence: 1, issues: [], suggestions: [], metrics: {}, executionTime: 0 }; }
      }
      orch.registerAgent('custom', CustomAgent);
      const agent = orch.getAgent('custom');
      assert(agent);
      assert.strictEqual(agent.id, 'custom');
    });

    it('shared memory is populated during workflow', async () => {
      const orch = new AgentOrchestrator();
      await orch.executeWorkflow({ type: 'test' }, { agents: ['architect', 'designer'], timeout: 5000 });
      const artifacts = orch.shared.listArtifacts();
      assert(artifacts.length > 0);
    });
  });

  describe('Entry Point', () => {
    it('executeAgentWorkflow is exposed', () => {
      const agents = require('../../lib/agents');
      assert(typeof agents.executeAgentWorkflow === 'function');
    });

    it('all agent classes are exported', () => {
      const agents = require('../../lib/agents');
      assert(agents.ArchitectAgent);
      assert(agents.DesignerAgent);
      assert(agents.DeveloperAgent);
      assert(agents.ContentAgent);
      assert(agents.SEOAgent);
      assert(agents.AccessibilityAgent);
      assert(agents.PerformanceAgent);
      assert(agents.DeploymentAgent);
      assert(agents.ReviewerAgent);
      assert(agents.QAAgent);
      assert(agents.ALL_AGENT_NAMES.length, 10);
    });

    it('executeAgentWorkflow runs workflow', async () => {
      const agents = require('../../lib/agents');
      const result = await agents.executeAgentWorkflow(
        { type: 'test', description: 'Entry point test' },
        { agents: ['architect'], timeout: 5000 }
      );
      assert(result.success === true || result.success === false);
    });
  });
});
