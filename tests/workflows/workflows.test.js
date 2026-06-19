const assert = require('assert');

describe('Workflow Execution Engine', function() {
  describe('State Machine', () => {
    const { WorkflowStateMachine, STATES, TERMINAL } = require('../../lib/workflows/workflowStateMachine');

    it('starts in CREATED state', () => {
      const sm = new WorkflowStateMachine();
      assert.strictEqual(sm.state, STATES.CREATED);
    });

    it('transitions through valid states', () => {
      const sm = new WorkflowStateMachine();
      sm.transition(STATES.QUEUED);
      assert.strictEqual(sm.state, STATES.QUEUED);
      sm.transition(STATES.RUNNING);
      assert.strictEqual(sm.state, STATES.RUNNING);
      sm.transition(STATES.COMPLETED);
      assert.strictEqual(sm.state, STATES.COMPLETED);
    });

    it('throws on invalid transition', () => {
      const sm = new WorkflowStateMachine(STATES.COMPLETED);
      assert.throws(() => sm.transition(STATES.RUNNING));
    });

    it('records transition history', () => {
      const sm = new WorkflowStateMachine();
      sm.transition(STATES.QUEUED);
      sm.transition(STATES.RUNNING);
      const history = sm.getHistory();
      assert.strictEqual(history.length, 3);
    });

    it('isTerminal returns true for terminal states', () => {
      for (const s of TERMINAL) {
        const sm = new WorkflowStateMachine(s);
        assert(sm.isTerminal());
      }
    });

    it('isRunning returns true for RUNNING', () => {
      const sm = new WorkflowStateMachine(STATES.RUNNING);
      assert(sm.isRunning());
    });

    it('canResume returns true for PAUSED/WAITING', () => {
      const sm = new WorkflowStateMachine(STATES.PAUSED);
      assert(sm.canResume());
    });

    it('canTransition checks validity', () => {
      const sm = new WorkflowStateMachine(STATES.CREATED);
      assert(sm.canTransition(STATES.QUEUED));
      assert(!sm.canTransition(STATES.COMPLETED));
    });

    it('elapsed returns time delta', () => {
      const sm = new WorkflowStateMachine();
      assert(typeof sm.elapsed === 'number');
    });

    it('states enum has all 10 states', () => {
      assert.strictEqual(Object.keys(STATES).length, 10);
    });
  });

  describe('Events', () => {
    const { WorkflowEvents, EVENT_TYPES } = require('../../lib/workflows/workflowEvents');

    it('emits and listens', (done) => {
      const e = new WorkflowEvents();
      e.on('workflow.started', (entry) => {
        assert.strictEqual(entry.type, 'workflow.started');
        assert(entry.data.workflowId);
        done();
      });
      e.emit('workflow.started', { workflowId: 'test-1' });
    });

    it('off removes listener', () => {
      const e = new WorkflowEvents();
      let count = 0;
      const fn = () => { count++; };
      e.on('test', fn);
      e.off('test', fn);
      e.emit('test', {});
      assert.strictEqual(count, 0);
    });

    it('wildcard listener catches all', (done) => {
      const e = new WorkflowEvents();
      e.on('*', (entry) => {
        assert.strictEqual(entry.type, 'custom.event');
        done();
      });
      e.emit('custom.event', {});
    });

    it('getHistory returns events', () => {
      const e = new WorkflowEvents();
      e.emit('workflow.created', {});
      e.emit('workflow.started', {});
      assert.strictEqual(e.getHistory().length, 2);
    });

    it('getHistory filters by type', () => {
      const e = new WorkflowEvents();
      e.emit('workflow.created', {});
      e.emit('workflow.started', {});
      e.emit('workflow.created', {});
      assert.strictEqual(e.getHistory('workflow.created').length, 2);
    });

    it('clear removes all events', () => {
      const e = new WorkflowEvents();
      e.emit('test', {});
      e.clear();
      assert.strictEqual(e.getHistory().length, 0);
    });

    it('EVENT_TYPES has all 11 types', () => {
      assert.strictEqual(EVENT_TYPES.length, 11);
      assert(EVENT_TYPES.includes('workflow.created'));
      assert(EVENT_TYPES.includes('workflow.rollback'));
    });
  });

  describe('Storage', () => {
    const WorkflowStorage = require('../../lib/workflows/workflowStorage');

    it('saves and retrieves workflows', async () => {
      const s = new WorkflowStorage();
      await s.save({ id: 'wf-1', status: 'CREATED', name: 'test' });
      const wf = await s.get('wf-1');
      assert.strictEqual(wf.id, 'wf-1');
      assert.strictEqual(wf.status, 'CREATED');
    });

    it('returns null for missing workflow', async () => {
      const s = new WorkflowStorage();
      const wf = await s.get('nonexistent');
      assert.strictEqual(wf, null);
    });

    it('deletes workflows', async () => {
      const s = new WorkflowStorage();
      await s.save({ id: 'wf-1' });
      await s.delete('wf-1');
      assert.strictEqual(await s.get('wf-1'), null);
    });

    it('lists workflows with filter', async () => {
      const s = new WorkflowStorage();
      await s.save({ id: 'wf-1', status: 'COMPLETED', createdAt: 100 });
      await s.save({ id: 'wf-2', status: 'FAILED', createdAt: 200 });
      await s.save({ id: 'wf-3', status: 'COMPLETED', createdAt: 300 });
      const completed = await s.list({ status: 'COMPLETED' });
      assert.strictEqual(completed.length, 2);
    });

    it('count returns correct number', async () => {
      const s = new WorkflowStorage();
      await s.save({ id: 'a', status: 'RUNNING' });
      await s.save({ id: 'b', status: 'RUNNING' });
      assert.strictEqual(await s.count({ status: 'RUNNING' }), 2);
    });

    it('manages events', async () => {
      const s = new WorkflowStorage();
      await s.saveEvents('wf-1', [{ type: 'started' }]);
      await s.saveEvents('wf-1', [{ type: 'completed' }]);
      const events = await s.getEvents('wf-1');
      assert.strictEqual(events.length, 2);
    });

    it('manages checkpoints', async () => {
      const s = new WorkflowStorage();
      await s.saveCheckpoint('wf-1', { id: 'cp-1' });
      await s.saveCheckpoint('wf-1', { id: 'cp-2' });
      const cps = await s.getCheckpoints('wf-1');
      assert.strictEqual(cps.length, 2);
      await s.deleteCheckpoints('wf-1');
      assert.strictEqual((await s.getCheckpoints('wf-1')).length, 0);
    });
  });

  describe('Workflow Definition', () => {
    const { WorkflowDefinition, STEP_TYPES } = require('../../lib/workflows/workflowDefinition');

    it('creates valid definition', () => {
      const def = new WorkflowDefinition({
        id: 'test-def',
        name: 'Test',
        steps: [{ id: 'step1', type: 'noop' }],
      });
      assert.strictEqual(def.id, 'test-def');
      assert.strictEqual(def.steps.length, 1);
    });

    it('throws without id', () => {
      assert.throws(() => new WorkflowDefinition({}));
    });

    it('throws with invalid step type', () => {
      assert.throws(() => new WorkflowDefinition({
        id: 'test', steps: [{ id: 's1', type: 'invalid' }],
      }));
    });

    it('validates conditional step branches', () => {
      assert.throws(() => new WorkflowDefinition({
        id: 'test', steps: [{ id: 's1', type: 'conditional', condition: { operator: 'invalid', field: 'x' } }],
      }));
    });

    it('requires agent name for agent steps', () => {
      assert.throws(() => new WorkflowDefinition({
        id: 'test', steps: [{ id: 's1', type: 'agent' }],
      }));
    });

    it('requires collection for foreach steps', () => {
      assert.throws(() => new WorkflowDefinition({
        id: 'test', steps: [{ id: 's1', type: 'foreach' }],
      }));
    });

    it('requires workflowId for subworkflow steps', () => {
      assert.throws(() => new WorkflowDefinition({
        id: 'test', steps: [{ id: 's1', type: 'subworkflow' }],
      }));
    });

    it('toJSON returns plain object', () => {
      const def = new WorkflowDefinition({ id: 't', steps: [{ id: 's1', type: 'noop' }] });
      const json = def.toJSON();
      assert.strictEqual(json.id, 't');
      assert(Array.isArray(json.steps));
    });

    it('fromJSON reconstructs definition', () => {
      const def = WorkflowDefinition.fromJSON({ id: 't', steps: [{ id: 's', type: 'noop' }] });
      assert(def instanceof WorkflowDefinition);
    });

    it('STEP_TYPES has all types', () => {
      assert(STEP_TYPES.includes('task'));
      assert(STEP_TYPES.includes('parallel'));
      assert(STEP_TYPES.includes('conditional'));
      assert(STEP_TYPES.includes('agent'));
    });

    it('accepts valid conditional step', () => {
      const def = new WorkflowDefinition({
        id: 'cond-test',
        steps: [{ id: 'check', type: 'conditional', condition: { operator: 'equals', field: 'x', value: 'y' }, branches: { true: [{ id: 't', type: 'noop' }], false: [{ id: 'f', type: 'noop' }] } }],
      });
      assert.strictEqual(def.steps.length, 1);
    });

    it('accepts valid parallel step', () => {
      const def = new WorkflowDefinition({
        id: 'par-test',
        steps: [{ id: 'p1', type: 'parallel', branches: { a: [{ id: 'a1', type: 'noop' }], b: [{ id: 'b1', type: 'noop' }] } }],
      });
      assert.strictEqual(def.steps.length, 1);
    });
  });

  describe('Checkpoint Manager', () => {
    const CheckpointManager = require('../../lib/workflows/checkpointManager');
    const WorkflowStorage = require('../../lib/workflows/workflowStorage');

    it('saves and loads checkpoints', async () => {
      const cm = new CheckpointManager();
      const cp = await cm.saveCheckpoint('wf-1', { completedNodes: ['a'], currentNode: 'b', errors: [], outputs: {}, elapsed: 100, totalNodes: 5 });
      assert(cp.id.startsWith('cp-'));
      assert.strictEqual(cp.workflowId, 'wf-1');

      const loaded = await cm.loadCheckpoint(cp.id);
      assert(loaded);
      assert.strictEqual(loaded.completedNodes.length, 1);
    });

    it('loadLatestCheckpoint returns most recent', async () => {
      const cm = new CheckpointManager();
      await cm.saveCheckpoint('wf-2', { completedNodes: ['a'] });
      await cm.saveCheckpoint('wf-2', { completedNodes: ['a', 'b'] });
      const latest = await cm.loadLatestCheckpoint('wf-2');
      assert.strictEqual(latest.completedNodes.length, 2);
    });

    it('loadLatestCheckpoint returns null for unknown', async () => {
      const cm = new CheckpointManager();
      const cp = await cm.loadLatestCheckpoint('unknown');
      assert.strictEqual(cp, null);
    });

    it('loadCheckpoint returns null for unknown', async () => {
      const cm = new CheckpointManager();
      assert.strictEqual(await cm.loadCheckpoint('nonexistent'), null);
    });

    it('deletes checkpoints', async () => {
      const cm = new CheckpointManager();
      const cp = await cm.saveCheckpoint('wf-3', {});
      await cm.deleteCheckpoint(cp.id);
      assert.strictEqual(await cm.loadCheckpoint(cp.id), null);
    });

    it('deleteWorkflowCheckpoints removes all for workflow', async () => {
      const cm = new CheckpointManager();
      await cm.saveCheckpoint('wf-4', {});
      await cm.saveCheckpoint('wf-4', {});
      await cm.deleteWorkflowCheckpoints('wf-4');
      const list = await cm.listCheckpoints('wf-4');
      assert.strictEqual(list.length, 0);
    });

    it('listCheckpoints returns checkpoint list', async () => {
      const cm = new CheckpointManager();
      await cm.saveCheckpoint('wf-5', {});
      await cm.saveCheckpoint('wf-5', {});
      const list = await cm.listCheckpoints('wf-5');
      assert.strictEqual(list.length, 2);
    });

    it('integrates with storage', async () => {
      const storage = new WorkflowStorage();
      const cm = new CheckpointManager(storage);
      await cm.saveCheckpoint('wf-6', { completedNodes: ['x'] });
      const stored = await storage.getCheckpoints('wf-6');
      assert(stored.length > 0);
    });
  });

  describe('Retry Engine', () => {
    const RetryEngine = require('../../lib/workflows/retryEngine');

    it('executes successfully on first attempt', async () => {
      const re = new RetryEngine();
      const result = await re.executeWithRetry(async () => 'ok', 'step1');
      assert(result.success);
      assert.strictEqual(result.result, 'ok');
      assert.strictEqual(result.attempts, 1);
    });

    it('retries on failure', async () => {
      const re = new RetryEngine({ maxRetries: 2, baseDelay: 10 });
      let attempts = 0;
      const fn = async () => { attempts++; if (attempts < 3) throw new Error('fail'); return 'ok'; };
      const result = await re.executeWithRetry(fn, 'step1');
      assert(result.success);
      assert.strictEqual(result.attempts, 3);
    });

    it('exhausts retries and returns failure', async () => {
      const re = new RetryEngine({ maxRetries: 2, baseDelay: 10 });
      const result = await re.executeWithRetry(async () => { throw new Error('always fail'); }, 'step1');
      assert(!result.success);
      assert.strictEqual(result.attempts, 3);
    });

    it('supports linear backoff', () => {
      const re = new RetryEngine({ jitter: false });
      const d1 = re._calculateDelay(1, 'linear', 1000);
      const d2 = re._calculateDelay(2, 'linear', 1000);
      const d3 = re._calculateDelay(3, 'linear', 1000);
      assert.strictEqual(d1, 1000);
      assert.strictEqual(d2, 2000);
      assert.strictEqual(d3, 3000);
    });

    it('supports fixed backoff', () => {
      const re = new RetryEngine();
      const d1 = re._calculateDelay(1, 'fixed', 500);
      const d2 = re._calculateDelay(5, 'fixed', 500);
      assert(d1 <= 500 * 1.5);
      assert(d2 <= 500 * 1.5);
    });

    it('exponential backoff increases delay', () => {
      const re = new RetryEngine({ jitter: false });
      const d1 = re._calculateDelay(1, 'exponential', 100);
      const d2 = re._calculateDelay(2, 'exponential', 100);
      assert(d2 > d1);
    });
  });

  describe('Compensation Engine', () => {
    const CompensationEngine = require('../../lib/workflows/compensationEngine');

    it('compensates steps in reverse order', async () => {
      const ce = new CompensationEngine();
      ce.register('task', async (step) => ({ undone: true }));
      const result = await ce.compensate('wf-1', [{ id: 'a', type: 'task' }, { id: 'b', type: 'task' }], []);
      assert.strictEqual(result.stepCount, 2);
      assert.strictEqual(result.successes, 2);
    });

    it('registers custom compensators', () => {
      const ce = new CompensationEngine();
      ce.register('deploy', async () => ({}));
      assert.doesNotThrow(() => ce.register('test', async () => ({})));
    });

    it('throws for non-function compensator', () => {
      const ce = new CompensationEngine();
      assert.throws(() => ce.register('x', 'not a function'));
    });

    it('undoDeployment returns deployment result', async () => {
      const ce = new CompensationEngine();
      const result = await ce.undoDeployment({ id: 'dep-1' });
      assert(result.deployed === false);
    });

    it('undoPersistence returns persistence result', async () => {
      const ce = new CompensationEngine();
      const result = await ce.undoPersistence({});
      assert(result.removed === true);
    });

    it('undoGeneratedArtifacts returns cleanup result', async () => {
      const ce = new CompensationEngine();
      const result = await ce.undoGeneratedArtifacts({ files: ['a.html'] });
      assert(result.removed === true);
    });

    it('getHistory returns compensation records', async () => {
      const ce = new CompensationEngine();
      await ce.compensate('wf-1', [{ id: 'a', type: 'task' }], []);
      const history = ce.getHistory();
      assert(history.length > 0);
      assert.strictEqual(history[0].workflowId, 'wf-1');
    });
  });

  describe('Versioning', () => {
    const WorkflowVersioning = require('../../lib/workflows/workflowVersioning');

    it('creates versions', () => {
      const v = new WorkflowVersioning();
      const ver = v.createVersion({ id: 'def-1', definition: { steps: [] } });
      assert.strictEqual(ver.number, 1);
      assert(ver.createdAt);
      assert(ver.checksum);
    });

    it('increments version number', () => {
      const v = new WorkflowVersioning();
      v.createVersion({ id: 'd1', definition: { steps: [] } });
      const ver2 = v.createVersion({ id: 'd1', definition: { steps: [{ id: 'a', type: 'noop' }] } });
      assert.strictEqual(ver2.number, 2);
    });

    it('getVersion returns specific version', () => {
      const v = new WorkflowVersioning();
      v.createVersion({ id: 'd2', definition: {} });
      const ver = v.getVersion('d2', 1);
      assert(ver);
      assert.strictEqual(ver.number, 1);
    });

    it('getVersion returns null for unknown', () => {
      const v = new WorkflowVersioning();
      assert.strictEqual(v.getVersion('nonexistent', 1), null);
    });

    it('getLatestVersion returns newest', () => {
      const v = new WorkflowVersioning();
      v.createVersion({ id: 'd3', definition: {} });
      v.createVersion({ id: 'd3', definition: { steps: [] } });
      const latest = v.getLatestVersion('d3');
      assert.strictEqual(latest.number, 2);
    });

    it('listVersions returns all versions', () => {
      const v = new WorkflowVersioning();
      v.createVersion({ id: 'd4', definition: {} });
      v.createVersion({ id: 'd4', definition: {} });
      assert.strictEqual(v.listVersions('d4').length, 2);
    });

    it('migrate updates version', () => {
      const v = new WorkflowVersioning();
      const wf = { id: 'wf', version: 1, steps: [] };
      const migrated = v.migrate(wf, 3);
      assert.strictEqual(migrated.version, 3);
      assert.strictEqual(migrated.migratedFrom, 1);
    });

    it('diff detects changes', () => {
      const v = new WorkflowVersioning();
      v.createVersion({ id: 'd', definition: { steps: [{ id: 'a', type: 'noop' }] } });
      v.createVersion({ id: 'd', definition: { steps: [{ id: 'a', type: 'noop' }, { id: 'b', type: 'noop' }] } });
      const diff = v.diff('d', 1, 2);
      assert(diff.changed);
      assert(diff.changes.length > 0);
    });
  });

  describe('Metrics', () => {
    const WorkflowMetrics = require('../../lib/workflows/workflowMetrics');

    it('records executions', () => {
      const m = new WorkflowMetrics();
      m.recordExecution('wf-1', { status: 'COMPLETED', duration: 1000 });
      const agg = m.getAggregates();
      assert.strictEqual(agg.totalExecutions, 1);
    });

    it('getAggregates returns averages', () => {
      const m = new WorkflowMetrics();
      m.recordExecution('wf-1', { duration: 1000, status: 'COMPLETED' });
      m.recordExecution('wf-2', { duration: 2000, status: 'FAILED' });
      const agg = m.getAggregates();
      assert.strictEqual(agg.totalExecutions, 2);
      assert.strictEqual(agg.avgDuration, 1500);
      assert.strictEqual(agg.totalFailures, 1);
    });

    it('getWorkflowMetrics returns per-workflow', () => {
      const m = new WorkflowMetrics();
      m.recordExecution('wf-1', { duration: 500 });
      const wm = m.getWorkflowMetrics('wf-1');
      assert.strictEqual(wm.executions, 1);
    });

    it('getWorkflowMetrics returns empty for unknown', () => {
      const m = new WorkflowMetrics();
      const wm = m.getWorkflowMetrics('unknown');
      assert.strictEqual(wm.executions, 0);
    });

    it('getStepMetrics returns step detail', () => {
      const m = new WorkflowMetrics();
      m.recordExecution('wf-1', { stepId: 'step-a', duration: 100 });
      const sm = m.getStepMetrics('step-a');
      assert.strictEqual(sm.executions, 1);
    });

    it('reset clears all metrics', () => {
      const m = new WorkflowMetrics();
      m.recordExecution('wf-1', {});
      m.reset();
      assert.strictEqual(m.getAggregates().totalExecutions, 0);
    });

    it('returns zero aggregate for empty', () => {
      const m = new WorkflowMetrics();
      const agg = m.getAggregates();
      assert.strictEqual(agg.avgDuration, 0);
      assert.strictEqual(agg.failureRate, 0);
    });
  });

  describe('Execution Graph', () => {
    const ExecutionGraph = require('../../lib/workflows/executionGraph');

    it('adds and retrieves nodes', () => {
      const g = new ExecutionGraph();
      g.addNode('a', { type: 'task' });
      const node = g.getNode('a');
      assert.strictEqual(node.id, 'a');
      assert.strictEqual(node.status, 'pending');
    });

    it('adds edges between nodes', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.addNode('b');
      g.addEdge('a', 'b');
      assert.deepStrictEqual(g.getDependencies('b'), ['a']);
      assert.deepStrictEqual(g.getDependents('a'), ['b']);
    });

    it('throws for duplicate nodes', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      assert.throws(() => g.addNode('a'));
    });

    it('getReadyNodes returns nodes with met dependencies', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.addNode('b');
      g.addEdge('a', 'b');
      const ready = g.getReadyNodes();
      assert.strictEqual(ready.length, 1);
      assert.strictEqual(ready[0].id, 'a');
    });

    it('marks started / completed / failed', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.markStarted('a');
      assert.strictEqual(g.getNode('a').status, 'running');
      g.markCompleted('a', { result: 'ok' });
      assert.strictEqual(g.getNode('a').status, 'completed');
      g.addNode('b');
      g.markFailed('b', 'error message');
      assert.strictEqual(g.getNode('b').status, 'failed');
    });

    it('incrementRetry resets node', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.markFailed('a', 'err');
      g.incrementRetry('a');
      const node = g.getNode('a');
      assert.strictEqual(node.status, 'pending');
      assert.strictEqual(node.retries, 1);
    });

    it('isComplete checks all nodes', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.addNode('b');
      g.markCompleted('a', {});
      g.markCompleted('b', {});
      assert(g.isComplete());
    });

    it('hasFailed checks for failures', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.markFailed('a', 'err');
      assert(g.hasFailed());
    });

    it('getExecutionOrder returns topological order', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.addNode('b');
      g.addNode('c');
      g.addEdge('a', 'b');
      g.addEdge('b', 'c');
      assert.deepStrictEqual(g.getExecutionOrder(), ['a', 'b', 'c']);
    });

    it('toJSON serializes graph', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.addNode('b');
      g.addEdge('a', 'b');
      const json = g.toJSON();
      assert.strictEqual(json.nodes.length, 2);
      assert.strictEqual(json.edges.length, 1);
    });

    it('getVisualGraph returns display data', () => {
      const g = new ExecutionGraph();
      g.addNode('a', { type: 'task' });
      const vg = g.getVisualGraph();
      assert.strictEqual(vg.nodes[0].label, 'a');
      assert(vg.nodes[0].status);
    });

    it('reset clears running/failed nodes', () => {
      const g = new ExecutionGraph();
      g.addNode('a');
      g.markCompleted('a', {});
      g.addNode('b');
      g.markFailed('b', 'e');
      g.reset();
      assert.strictEqual(g.getNode('a').status, 'completed');
      assert.strictEqual(g.getNode('b').status, 'pending');
    });
  });

  describe('Execution Engine', () => {
    const ExecutionEngine = require('../../lib/workflows/executionEngine');

    it('executes a simple workflow', async () => {
      const engine = new ExecutionEngine();
      const result = await engine.execute(
        { id: 'simple-test', status: 'CREATED' },
        { id: 'def-simple', steps: [{ id: 'step1', type: 'noop' }, { id: 'step2', type: 'noop', dependsOn: 'step1' }] }
      );
      assert.strictEqual(result.status, 'COMPLETED');
      assert(result.duration >= 0);
      assert(result.nodes);
    });

    it('executes task step with handler', async () => {
      const engine = new ExecutionEngine();
      const result = await engine.execute(
        { id: 'task-test', status: 'CREATED' },
        { id: 'def-task', steps: [{ id: 't1', type: 'task', handler: async () => ({ processed: true, value: 42 }) }] }
      );
      assert.strictEqual(result.status, 'COMPLETED');
      assert.strictEqual(result.output.t1.value, 42);
    });

    it('executes conditional steps', async () => {
      const engine = new ExecutionEngine();
      const result = await engine.execute(
        { id: 'cond-test', status: 'CREATED' },
        {
          id: 'def-cond',
          steps: [{
            id: 'check', type: 'conditional',
            condition: { operator: 'equals', field: 'context.mode', value: 'test' },
            branches: { true: [{ id: 'on-true', type: 'noop' }], false: [{ id: 'on-false', type: 'noop' }] },
          }],
        },
        { mode: 'test' }
      );
      assert.strictEqual(result.status, 'COMPLETED');
      assert(result.output.check);
      assert.strictEqual(result.output.check.branch, 'true');
    });

    it('executes parallel branches', async () => {
      const engine = new ExecutionEngine();
      const result = await engine.execute(
        { id: 'par-test', status: 'CREATED' },
        {
          id: 'def-par',
          steps: [{
            id: 'parallel-1', type: 'parallel',
            branches: { a: [{ id: 'a1', type: 'noop' }], b: [{ id: 'b1', type: 'noop' }] },
          }],
        }
      );
      assert.strictEqual(result.status, 'COMPLETED');
      assert(result.output['parallel-1']);
    });

    it('executes foreach step', async () => {
      const engine = new ExecutionEngine();
      const result = await engine.execute(
        { id: 'foreach-test', status: 'CREATED' },
        {
          id: 'def-fe',
          steps: [{
            id: 'fe1', type: 'foreach',
            collection: 'context.items',
            steps: [{ id: 'item-step', type: 'noop' }],
          }],
        },
        { items: ['a', 'b', 'c'] }
      );
      assert.strictEqual(result.status, 'COMPLETED');
    });

    it('executes wait step', async () => {
      const engine = new ExecutionEngine();
      const start = Date.now();
      const result = await engine.execute(
        { id: 'wait-test', status: 'CREATED' },
        { id: 'def-wait', steps: [{ id: 'w1', type: 'wait', duration: 50 }] }
      );
      assert.strictEqual(result.status, 'COMPLETED');
    });

    it('executes agent step', async () => {
      const engine = new ExecutionEngine();
      const result = await engine.execute(
        { id: 'agent-test', status: 'CREATED' },
        { id: 'def-agent', steps: [{ id: 'agent1', type: 'agent', agent: 'architect' }] }
      );
      assert.strictEqual(result.status, 'COMPLETED');
    });

    it('pauses and resumes execution', async () => {
      const engine = new ExecutionEngine();
      const execPromise = engine.execute(
        { id: 'pause-test', status: 'CREATED' },
        { id: 'def-pause', steps: [{ id: 's1', type: 'noop' }] }
      );
      const paused = engine.pause('pause-test');
      assert(paused);
      const resumed = engine.resume('pause-test');
      assert(resumed);
      await execPromise;
    });

    it('cancels running workflow', () => {
      const engine = new ExecutionEngine();
      const result = engine.cancel('cancel-test');
      assert.strictEqual(result.status, 'CANCELLED');
      assert(engine.isRunning('cancel-test') === false);
    });

    it('getResult returns execution result', async () => {
      const engine = new ExecutionEngine();
      await engine.execute(
        { id: 'result-test', status: 'CREATED' },
        { id: 'def-result', steps: [{ id: 'r1', type: 'noop' }] }
      );
      const result = engine.getResult('result-test');
      assert(result);
      assert.strictEqual(result.workflowId, 'result-test');
    });

    it('getRunningCount returns count', async () => {
      const engine = new ExecutionEngine();
      assert(typeof engine.getRunningCount() === 'number');
    });

    it('query filters by status', async () => {
      const engine = new ExecutionEngine();
      const results = engine.query({ status: 'COMPLETED' });
      assert(Array.isArray(results));
    });

    it('throws when executing duplicate workflow', async () => {
      const engine = new ExecutionEngine();
      const promise1 = engine.execute(
        { id: 'dup-test', status: 'CREATED' },
        { id: 'def', steps: [{ id: 's', type: 'wait', duration: 200 }] }
      );
      await assert.rejects(
        engine.execute({ id: 'dup-test', status: 'CREATED' }, { id: 'def', steps: [{ id: 's', type: 'wait', duration: 200 }] })
      );
      await promise1.catch(() => {});
    });
  });

  describe('Queue Manager', () => {
    const QueueManager = require('../../lib/workflows/scheduler/queueManager');

    it('enqueues and dequeues items', () => {
      const q = new QueueManager();
      q.enqueue('wf-1', 'normal');
      q.enqueue('wf-2', 'high');
      const first = q.dequeue();
      assert.strictEqual(first.workflowId, 'wf-2');
    });

    it('respects priority order', () => {
      const q = new QueueManager();
      q.enqueue('a', 'low');
      q.enqueue('b', 'critical');
      q.enqueue('c', 'high');
      assert.strictEqual(q.dequeue().workflowId, 'b');
      assert.strictEqual(q.dequeue().workflowId, 'c');
      assert.strictEqual(q.dequeue().workflowId, 'a');
    });

    it('peek shows next item without removing', () => {
      const q = new QueueManager();
      q.enqueue('wf-1', 'high');
      const peeked = q.peek();
      assert.strictEqual(peeked.workflowId, 'wf-1');
      assert.strictEqual(q.dequeue().workflowId, 'wf-1');
    });

    it('remove deletes specific item', () => {
      const q = new QueueManager();
      q.enqueue('wf-1', 'normal');
      assert(q.remove('wf-1'));
      assert(!q.remove('wf-1'));
    });

    it('getSize returns queue sizes', () => {
      const q = new QueueManager();
      q.enqueue('a', 'critical');
      q.enqueue('b', 'normal');
      q.enqueue('c', 'normal');
      const sizes = q.getSize();
      assert.strictEqual(sizes.critical, 1);
      assert.strictEqual(sizes.normal, 2);
    });

    it('getAll returns all items', () => {
      const q = new QueueManager();
      q.enqueue('a', 'normal');
      q.enqueue('b', 'high');
      assert.strictEqual(q.getAll().length, 2);
    });

    it('clear removes all items', () => {
      const q = new QueueManager();
      q.enqueue('a', 'normal');
      q.clear();
      assert.strictEqual(q.getSize().normal, 0);
    });
  });

  describe('Cron Scheduler', () => {
    const CronScheduler = require('../../lib/workflows/scheduler/cronScheduler');

    it('schedules and lists jobs', () => {
      const cs = new CronScheduler();
      const job = cs.schedule('* * * * *', 'def-1');
      assert(job.id.startsWith('cron-'));
      assert.strictEqual(job.definitionId, 'def-1');
      const list = cs.list();
      assert.strictEqual(list.length, 1);
    });

    it('cancels a job', () => {
      const cs = new CronScheduler();
      const job = cs.schedule('* * * * *', 'def-1');
      assert(cs.cancel(job.id));
      assert.strictEqual(cs.list().length, 0);
    });

    it('clear removes all jobs', () => {
      const cs = new CronScheduler();
      cs.schedule('* * * * *', 'd1');
      cs.schedule('*/5 * * * *', 'd2');
      cs.clear();
      assert.strictEqual(cs.list().length, 0);
    });
  });

  describe('Scheduler', () => {
    const Scheduler = require('../../lib/workflows/scheduler/scheduler');

    it('delays execution', async () => {
      const s = new Scheduler();
      const result = await s.scheduleDelayed('def-1', 100, {});
      assert(result.id.startsWith('delayed-'));
      assert(result.delayMs === 100);
    });

    it('cancels delayed execution', async () => {
      const s = new Scheduler();
      const result = await s.scheduleDelayed('def-1', 50000, {});
      assert(s.cancelDelayed(result.id));
    });

    it('listDelayed returns pending items', () => {
      const s = new Scheduler();
      s.scheduleDelayed('def-1', 60000, {});
      s.scheduleDelayed('def-2', 30000, {});
      assert.strictEqual(s.listDelayed().length, 2);
    });

    it('clear removes all', () => {
      const s = new Scheduler();
      s.scheduleDelayed('d1', 60000, {});
      s.clear();
      assert.strictEqual(s.listDelayed().length, 0);
    });
  });

  describe('Workflow Manager', () => {
    const { WorkflowManager, WorkflowDefinition } = require('../../lib/workflows');

    it('registers and retrieves definitions', () => {
      const wm = new WorkflowManager();
      const def = wm.registerDefinition({ id: 'def-1', steps: [{ id: 's1', type: 'noop' }] });
      assert(def instanceof WorkflowDefinition);
      assert.strictEqual(wm.getDefinition('def-1').id, 'def-1');
    });

    it('listDefinitions returns all', () => {
      const wm = new WorkflowManager();
      wm.registerDefinition({ id: 'd1', steps: [{ id: 's', type: 'noop' }] });
      wm.registerDefinition({ id: 'd2', steps: [{ id: 's', type: 'noop' }] });
      assert.strictEqual(wm.listDefinitions().length, 2);
    });

    it('starts and completes a workflow', async () => {
      const wm = new WorkflowManager();
      wm.registerDefinition({ id: 'wf-test', steps: [{ id: 'step1', type: 'noop' }] });
      const result = await wm.startWorkflow('wf-test', {});
      assert(result.workflowId);
      assert.strictEqual(result.status, 'COMPLETED');
    });

    it('pause and resume workflow', async () => {
      const wm = new WorkflowManager();
      wm.registerDefinition({ id: 'pause-def', steps: [{ id: 's1', type: 'noop' }] });
      const promise = wm.startWorkflow('pause-def', {});
      wm.pauseWorkflow(wm.listWorkflows()[0]?.id || 'none').catch(() => {});
      const result = await promise;
      assert(result.status);
    });

    it('cancel workflow', async () => {
      const wm = new WorkflowManager();
      wm.registerDefinition({ id: 'cancel-def', steps: [{ id: 's1', type: 'noop' }] });
      const promise = wm.startWorkflow('cancel-def', {});
      const workflows = await wm.listWorkflows();
      const wfId = workflows[0]?.id;
      if (wfId) {
        const result = await wm.cancelWorkflow(wfId);
        assert.strictEqual(result.status, 'CANCELLED');
      }
      await promise.catch(() => {});
    });

    it('getWorkflow returns null for unknown', async () => {
      const wm = new WorkflowManager();
      const wf = await wm.getWorkflow('nonexistent');
      assert.strictEqual(wf, null);
    });

    it('listWorkflows returns workflow list', async () => {
      const wm = new WorkflowManager();
      wm.registerDefinition({ id: 'list-def', steps: [{ id: 's1', type: 'noop' }] });
      await wm.startWorkflow('list-def', {});
      const list = await wm.listWorkflows();
      assert(Array.isArray(list));
    });

    it('getWorkflowGraph returns graph', async () => {
      const wm = new WorkflowManager();
      wm.registerDefinition({ id: 'graph-def', steps: [{ id: 's1', type: 'noop' }] });
      const result = await wm.startWorkflow('graph-def', {});
      const graph = wm.getWorkflowGraph(result.workflowId);
      assert(graph.nodes);
      assert(graph.edges);
    });

    it('getWorkflowEvents returns events', async () => {
      const wm = new WorkflowManager();
      wm.registerDefinition({ id: 'evt-def', steps: [{ id: 's1', type: 'noop' }] });
      const result = await wm.startWorkflow('evt-def', {});
      const events = wm.getWorkflowEvents(result.workflowId);
      assert(Array.isArray(events));
    });

    it('getWorkflowCheckpoints returns checkpoints', async () => {
      const wm = new WorkflowManager();
      wm.registerDefinition({ id: 'cp-def', steps: [{ id: 's1', type: 'noop' }] });
      const result = await wm.startWorkflow('cp-def', {});
      const cps = await wm.getWorkflowCheckpoints(result.workflowId);
      assert(Array.isArray(cps));
    });

    it('retry creates new workflow', async () => {
      const wm = new WorkflowManager();
      wm.registerDefinition({ id: 'retry-def', steps: [{ id: 's1', type: 'noop' }] });
      const orig = await wm.startWorkflow('retry-def', {});
      const retryResult = await wm.retryWorkflow(orig.workflowId);
      assert(retryResult.workflowId);
      assert(retryResult.status);
    });
  });

  describe('Entry Point', () => {
    const workflows = require('../../lib/workflows');

    it('exports startWorkflow', () => {
      assert(typeof workflows.startWorkflow === 'function');
    });

    it('exports resumeWorkflow', () => {
      assert(typeof workflows.resumeWorkflow === 'function');
    });

    it('exports pauseWorkflow', () => {
      assert(typeof workflows.pauseWorkflow === 'function');
    });

    it('exports cancelWorkflow', () => {
      assert(typeof workflows.cancelWorkflow === 'function');
    });

    it('exports retryWorkflow', () => {
      assert(typeof workflows.retryWorkflow === 'function');
    });

    it('exports getWorkflow', () => {
      assert(typeof workflows.getWorkflow === 'function');
    });

    it('exports listWorkflows', () => {
      assert(typeof workflows.listWorkflows === 'function');
    });

    it('exports getWorkflowManager', () => {
      assert(typeof workflows.getWorkflowManager === 'function');
    });

    it('exports createDefinition', () => {
      assert(typeof workflows.createDefinition === 'function');
    });

    it('exports all classes', () => {
      assert(workflows.WorkflowManager);
      assert(workflows.WorkflowDefinition);
      assert(workflows.WorkflowStateMachine);
      assert(workflows.WorkflowEvents);
      assert(workflows.ExecutionEngine);
      assert(workflows.ExecutionGraph);
      assert(workflows.CheckpointManager);
      assert(workflows.RetryEngine);
      assert(workflows.CompensationEngine);
      assert(workflows.WorkflowVersioning);
      assert(workflows.WorkflowMetrics);
      assert(workflows.WorkflowStorage);
      assert(workflows.Scheduler);
      assert(workflows.QueueManager);
      assert(workflows.CronScheduler);
      assert(workflows.STATES);
      assert(workflows.EVENT_TYPES);
    });

    it('createDefinition registers and returns definition', () => {
      const def = workflows.createDefinition({ id: 'entry-test', steps: [{ id: 's', type: 'noop' }] });
      assert(def.id, 'entry-test');
    });

    it('startWorkflow runs full cycle', async () => {
      const def = workflows.createDefinition({ id: 'e2e-test', steps: [{ id: 's1', type: 'noop' }] });
      const result = await workflows.startWorkflow('e2e-test', {});
      assert(result.status === 'COMPLETED' || result.status === 'FAILED');
    });
  });

  describe('Agent Integration', () => {
    const { AgentOrchestrator } = require('../../lib/agents');

    it('workflow can execute agent steps with AgentOrchestrator', async () => {
      const { ExecutionEngine } = require('../../lib/workflows');
      const engine = new ExecutionEngine();
      const orchestrator = new AgentOrchestrator();
      const context = { agentOrchestrator: orchestrator };
      const result = await engine.execute(
        { id: 'agent-int-test', status: 'CREATED' },
        { id: 'def-agent-int', steps: [{ id: 'agent-step', type: 'agent', agent: 'architect', params: { description: 'Test architecture' } }] },
        context
      );
      assert(result.status);
      assert(result.output['agent-step']);
    });

    it('workflow orchestration with multi-agent steps', async () => {
      const wm = require('../../lib/workflows').WorkflowManager;
      const manager = new wm();
      const { AgentOrchestrator } = require('../../lib/agents');
      const orch = new AgentOrchestrator();
      manager.registerDefinition({
        id: 'multi-agent-def',
        steps: [
          { id: 'architect', type: 'agent', agent: 'architect', params: { description: 'Design system' } },
          { id: 'designer', type: 'agent', agent: 'designer', params: { description: 'Visual design' }, dependsOn: 'architect' },
          { id: 'developer', type: 'agent', agent: 'developer', params: { description: 'Build' }, dependsOn: 'designer' },
        ],
      });
      const result = await manager.startWorkflow('multi-agent-def', {}, { agentOrchestrator: orch });
      assert(result.status);
    });
  });
});
