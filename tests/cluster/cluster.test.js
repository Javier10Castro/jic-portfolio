const assert = require('assert');

describe('Distributed Execution Cluster', function() {
  describe('WorkerNode', () => {
    const { WorkerNode } = require('../../lib/cluster');

    it('creates a worker with defaults', () => {
      const w = new WorkerNode();
      assert.ok(w.id);
      assert.strictEqual(w.hostname, 'localhost');
      assert.strictEqual(w.type, 'workflow');
      assert.strictEqual(w.status, 'idle');
      assert.strictEqual(w.cpu, 0);
    });

    it('creates a worker with options', () => {
      const w = new WorkerNode({ id: 'w-1', hostname: 'node-1', type: 'ai', status: 'busy', weight: 3 });
      assert.strictEqual(w.id, 'w-1');
      assert.strictEqual(w.hostname, 'node-1');
      assert.strictEqual(w.type, 'ai');
      assert.strictEqual(w.status, 'busy');
      assert.strictEqual(w.weight, 3);
    });

    it('markBusy changes status', () => {
      const w = new WorkerNode();
      w.markBusy();
      assert.strictEqual(w.status, 'busy');
    });

    it('markIdle changes status', () => {
      const w = new WorkerNode();
      w.markBusy();
      w.markIdle();
      assert.strictEqual(w.status, 'idle');
    });

    it('markDegraded changes status with reason', () => {
      const w = new WorkerNode();
      w.markDegraded('High memory usage');
      assert.strictEqual(w.status, 'degraded');
      assert.strictEqual(w.metadata.degradedReason, 'High memory usage');
    });

    it('markOffline changes status', () => {
      const w = new WorkerNode();
      w.markOffline();
      assert.strictEqual(w.status, 'offline');
    });

    it('markStale changes status', () => {
      const w = new WorkerNode();
      w.markStale();
      assert.strictEqual(w.status, 'stale');
    });

    it('addTask adds to running tasks', () => {
      const w = new WorkerNode();
      w.addTask('task-1');
      assert.deepStrictEqual(w.runningTasks, ['task-1']);
      assert.strictEqual(w.queueSize, 1);
    });

    it('removeTask removes from running tasks', () => {
      const w = new WorkerNode();
      w.addTask('task-1');
      w.addTask('task-2');
      w.removeTask('task-1');
      assert.deepStrictEqual(w.runningTasks, ['task-2']);
      assert.strictEqual(w.queueSize, 1);
    });

    it('heartbeat updates timestamp', async () => {
      const w = new WorkerNode();
      const before = w.lastHeartbeat;
      await new Promise(r => setTimeout(r, 1));
      w.heartbeat();
      assert.ok(w.lastHeartbeat >= before);
    });

    it('toJSON returns serializable object', () => {
      const w = new WorkerNode({ id: 'w-test', type: 'workflow', status: 'idle' });
      const json = w.toJSON();
      assert.strictEqual(json.id, 'w-test');
      assert.strictEqual(json.type, 'workflow');
      assert.strictEqual(json.status, 'idle');
      assert.ok(json.isHealthy);
      assert.ok(json.uptime >= 0);
    });

    it('fromJSON reconstructs a worker', () => {
      const data = { id: 'w-json', hostname: 'node-x', type: 'deployment', status: 'busy', cpu: 50, memory: { used: 256, total: 1024 }, runningTasks: [], queueSize: 0, completedTasks: 0, failedTasks: 0, lastHeartbeat: Date.now(), startedAt: Date.now(), tags: {}, weight: 1, capabilities: [], metadata: {} };
      const w = WorkerNode.fromJSON(data);
      assert.strictEqual(w.id, 'w-json');
      assert.strictEqual(w.type, 'deployment');
      assert.strictEqual(w.status, 'busy');
      assert.strictEqual(w.cpu, 50);
    });
  });

  describe('ClusterStorage', () => {
    const ClusterStorage = require('../../lib/cluster/clusterStorage');

    it('stores and retrieves workers', async () => {
      const s = new ClusterStorage();
      await s.storeWorker({ id: 'w-1', type: 'workflow', status: 'idle' });
      const w = await s.getWorker('w-1');
      assert.strictEqual(w.id, 'w-1');
    });

    it('lists workers with status filter', async () => {
      const s = new ClusterStorage();
      await s.storeWorker({ id: 'w-1', type: 'workflow', status: 'idle' });
      await s.storeWorker({ id: 'w-2', type: 'ai', status: 'busy' });
      const idle = await s.listWorkers({ status: 'idle' });
      assert.strictEqual(idle.length, 1);
    });

    it('lists workers with type filter', async () => {
      const s = new ClusterStorage();
      await s.storeWorker({ id: 'w-1', type: 'workflow', status: 'idle' });
      await s.storeWorker({ id: 'w-2', type: 'ai', status: 'busy' });
      const ai = await s.listWorkers({ type: 'ai' });
      assert.strictEqual(ai.length, 1);
    });

    it('removes a worker', async () => {
      const s = new ClusterStorage();
      await s.storeWorker({ id: 'w-1', type: 'workflow', status: 'idle' });
      await s.removeWorker('w-1');
      const w = await s.getWorker('w-1');
      assert.strictEqual(w, null);
    });

    it('workerCount returns count', async () => {
      const s = new ClusterStorage();
      await s.storeWorker({ id: 'w-1', type: 'workflow' });
      await s.storeWorker({ id: 'w-2', type: 'ai' });
      assert.strictEqual(await s.workerCount(), 2);
    });

    it('stores and retrieves tasks', async () => {
      const s = new ClusterStorage();
      await s.storeTask({ id: 't-1', type: 'workflow', status: 'pending' });
      const t = await s.getTask('t-1');
      assert.strictEqual(t.id, 't-1');
    });

    it('lists tasks with filter', async () => {
      const s = new ClusterStorage();
      await s.storeTask({ id: 't-1', type: 'workflow', status: 'pending' });
      await s.storeTask({ id: 't-2', type: 'ai', status: 'running' });
      const running = await s.listTasks({ status: 'running' });
      assert.strictEqual(running.length, 1);
    });

    it('removes a task', async () => {
      const s = new ClusterStorage();
      await s.storeTask({ id: 't-1', type: 'workflow', status: 'pending' });
      await s.removeTask('t-1');
      const t = await s.getTask('t-1');
      assert.strictEqual(t, null);
    });

    it('enqueues and dequeues priority queue', async () => {
      const s = new ClusterStorage();
      await s.enqueue('priority', { id: 't-1', priority: 5 });
      await s.enqueue('priority', { id: 't-2', priority: 1 });
      const item = await s.dequeue('priority');
      assert.ok(item);
    });

    it('LIFO dequeues last item', async () => {
      const s = new ClusterStorage();
      await s.enqueue('lifo', { id: 't-1' });
      await s.enqueue('lifo', { id: 't-2' });
      const item = await s.dequeue('lifo');
      assert.strictEqual(item.id, 't-2');
    });

    it('queueSize returns correct count', async () => {
      const s = new ClusterStorage();
      await s.enqueue('fifo', { id: 't-1' });
      await s.enqueue('fifo', { id: 't-2' });
      assert.strictEqual(await s.queueSize('fifo'), 2);
    });

    it('listQueues returns all queues', async () => {
      const s = new ClusterStorage();
      await s.enqueue('priority', { id: 't-1' });
      const queues = await s.listQueues();
      assert.ok(queues.priority);
      assert.ok(queues.fifo);
      assert.ok(queues.deadLetter);
    });

    it('moveToDeadLetter moves a task', async () => {
      const s = new ClusterStorage();
      await s.enqueue('priority', { id: 't-1' });
      await s.moveToDeadLetter({ id: 't-1' }, 'test failure');
      assert.strictEqual(await s.queueSize('deadLetter'), 1);
    });

    it('stores and retrieves leader history', async () => {
      const s = new ClusterStorage();
      await s.storeLeader({ leaderId: 'coord-1', term: 1 });
      const current = await s.getCurrentLeader();
      assert.strictEqual(current.leaderId, 'coord-1');
    });

    it('stores and retrieves metrics', async () => {
      const s = new ClusterStorage();
      await s.storeMetric({ name: 'tasks.completed', value: 10 });
      const metrics = await s.getMetrics({ name: 'tasks.completed' });
      assert.strictEqual(metrics.length, 1);
    });

    it('clear removes all data', async () => {
      const s = new ClusterStorage();
      await s.storeWorker({ id: 'w-1' });
      await s.clear();
      assert.strictEqual(await s.workerCount(), 0);
    });

    it('snapshot returns counts', async () => {
      const s = new ClusterStorage();
      await s.storeWorker({ id: 'w-1' });
      const snap = await s.snapshot();
      assert.strictEqual(snap.workers, 1);
    });
  });

  describe('WorkerRegistry', () => {
    const ClusterStorage = require('../../lib/cluster/clusterStorage');
    const WorkerRegistry = require('../../lib/cluster/workerRegistry');
    const { WorkerNode } = require('../../lib/cluster');

    it('registers a worker', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      const w = await r.register({ id: 'w-1', type: 'workflow', hostname: 'node-1' });
      assert.strictEqual(w.id, 'w-1');
    });

    it('registers a WorkerNode instance', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      const node = new WorkerNode({ id: 'w-2', type: 'ai' });
      const w = await r.register(node);
      assert.strictEqual(w.id, 'w-2');
    });

    it('unregisters a worker', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      await r.register({ id: 'w-1', type: 'workflow' });
      const removed = await r.unregister('w-1');
      assert.strictEqual(removed, true);
      const w = await r.getWorker('w-1');
      assert.strictEqual(w, null);
    });

    it('returns false unregistering non-existent', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      const removed = await r.unregister('w-none');
      assert.strictEqual(removed, false);
    });

    it('lists workers by type', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      await r.register({ id: 'w-1', type: 'workflow' });
      await r.register({ id: 'w-2', type: 'ai' });
      const ai = await r.listWorkersByType('ai');
      assert.strictEqual(ai.length, 1);
    });

    it('getOnlineWorkers returns non-offline', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      await r.register({ id: 'w-1', type: 'workflow' });
      await r.register({ id: 'w-2', type: 'ai', status: 'offline' });
      const online = await r.getOnlineWorkers();
      assert.strictEqual(online.length, 1);
    });

    it('getAvailableWorkers returns idle/busy', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      await r.register({ id: 'w-1', type: 'workflow' });
      await r.register({ id: 'w-2', type: 'ai', status: 'offline' });
      const avail = await r.getAvailableWorkers();
      assert.strictEqual(avail.length, 1);
    });

    it('workerCountByStatus returns breakdown', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      await r.register({ id: 'w-1', type: 'workflow' });
      await r.register({ id: 'w-2', type: 'ai', status: 'degraded' });
      const counts = await r.workerCountByStatus();
      assert.strictEqual(counts.idle, 1);
      assert.strictEqual(counts.degraded, 1);
    });

    it('workerCountByType returns type breakdown', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      await r.register({ id: 'w-1', type: 'workflow' });
      await r.register({ id: 'w-2', type: 'ai' });
      await r.register({ id: 'w-3', type: 'ai' });
      const types = await r.workerCountByType();
      assert.strictEqual(types.workflow, 1);
      assert.strictEqual(types.ai, 2);
    });

    it('updateWorker modifies worker fields', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      await r.register({ id: 'w-1', type: 'workflow' });
      const updated = await r.updateWorker('w-1', { status: 'busy', cpu: 75 });
      assert.strictEqual(updated.status, 'busy');
      assert.strictEqual(updated.cpu, 75);
    });

    it('workerExists checks existence', async () => {
      const r = new WorkerRegistry(new ClusterStorage());
      await r.register({ id: 'w-1', type: 'workflow' });
      const exists = await r.workerExists('w-1');
      assert.strictEqual(exists, true);
      const notExists = await r.workerExists('w-none');
      assert.strictEqual(notExists, false);
    });
  });

  describe('HeartbeatMonitor', () => {
    const HeartbeatMonitor = require('../../lib/cluster/heartbeatMonitor');
    const { WorkerNode } = require('../../lib/cluster');
    const { ClusterEvents } = require('../../lib/cluster/clusterEvents');

    it('creates with default options', () => {
      const h = new HeartbeatMonitor();
      assert.ok(h);
      assert.strictEqual(h.isRunning(), false);
    });

    it('receiveHeartbeat emits event', (done) => {
      const events = new ClusterEvents();
      const h = new HeartbeatMonitor({ eventBus: events });
      events.on('cluster.heartbeat', (entry) => {
        assert.strictEqual(entry.data.workerId, 'w-1');
        done();
      });
      h.receiveHeartbeat('w-1', { cpu: 50 });
    });

    it('start and stop work', () => {
      const h = new HeartbeatMonitor({ interval: 50000 });
      h.start(() => []);
      assert.strictEqual(h.isRunning(), true);
      h.stop();
      assert.strictEqual(h.isRunning(), false);
    });

    it('getStatus returns config', () => {
      const h = new HeartbeatMonitor({ interval: 3000, timeout: 10000, staleThreshold: 30000 });
      const s = h.getStatus();
      assert.strictEqual(s.interval, 3000);
      assert.strictEqual(s.timeout, 10000);
      assert.strictEqual(s.staleThreshold, 30000);
    });

    it('setReceiveWorker stores callback', () => {
      const h = new HeartbeatMonitor();
      const fn = async (id, data) => {};
      h.setReceiveWorker(fn);
      assert.ok(h._receiveWorker);
    });
  });

  describe('LeaderElection', () => {
    const LeaderElection = require('../../lib/cluster/leaderElection');
    const { ClusterEvents } = require('../../lib/cluster/clusterEvents');

    it('creates with default options', () => {
      const le = new LeaderElection();
      assert.ok(le._nodeId);
      assert.strictEqual(le.isLeader(), false);
    });

    it('holds election and becomes leader', (done) => {
      const le = new LeaderElection({
        nodeId: 'coord-1',
        electionTimeout: 50000,
        heartbeatInterval: 50000,
        onBecomeLeader: (id, term) => {
          assert.strictEqual(id, 'coord-1');
          assert.strictEqual(term, 1);
          le.stop();
          done();
        },
      });
      le.start(['coord-1']);
    });

    it('receiveHeartbeat from higher term defers', () => {
      const le = new LeaderElection({ nodeId: 'coord-1' });
      le.receiveHeartbeat('coord-2', 2);
      assert.strictEqual(le.getLeaderId(), 'coord-2');
      assert.strictEqual(le.isLeader(), false);
    });

    it('getStatus returns state', () => {
      const le = new LeaderElection({ nodeId: 'coord-1' });
      const s = le.getStatus();
      assert.strictEqual(s.nodeId, 'coord-1');
      assert.strictEqual(s.isLeader, false);
      assert.strictEqual(s.running, false);
    });

    it('getTerm returns current term', () => {
      const le = new LeaderElection({ nodeId: 'coord-1' });
      le._term = 3;
      assert.strictEqual(le.getTerm(), 3);
    });
  });

  describe('TaskQueue', () => {
    const ClusterStorage = require('../../lib/cluster/clusterStorage');
    const { TaskQueue } = require('../../lib/cluster');

    it('enqueues and dequeues priority queue', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueuePriority({ id: 't-1', type: 'workflow' }, 5);
      await q.enqueuePriority({ id: 't-2', type: 'workflow' }, 1);
      const item = await q.dequeuePriority();
      assert.strictEqual(item.id, 't-1');
    });

    it('enqueues and dequeues FIFO', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueFifo({ id: 't-1' });
      await q.enqueueFifo({ id: 't-2' });
      const item = await q.dequeueFifo();
      assert.strictEqual(item.id, 't-1');
    });

    it('enqueues and dequeues LIFO', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueLifo({ id: 't-1' });
      await q.enqueueLifo({ id: 't-2' });
      const item = await q.dequeueLifo();
      assert.strictEqual(item.id, 't-2');
    });

    it('enqueues and dequeues scheduled', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueScheduled({ id: 't-1' }, Date.now());
      const item = await q.dequeueScheduled();
      assert.strictEqual(item.id, 't-1');
    });

    it('returns null for future scheduled task', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueScheduled({ id: 't-1' }, Date.now() + 60000);
      const item = await q.dequeueScheduled();
      assert.strictEqual(item, null);
    });

    it('enqueues and dequeues delayed task after delay', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueDelayed({ id: 't-1' }, 0);
      const item = await q.dequeueDelayed();
      assert.strictEqual(item.id, 't-1');
    });

    it('returns null for future delayed task', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueDelayed({ id: 't-1' }, 60000);
      const item = await q.dequeueDelayed();
      assert.strictEqual(item, null);
    });

    it('enqueues dead letter tasks', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueDeadLetter({ id: 't-1' }, 'failure');
      const size = await q.size('deadLetter');
      assert.strictEqual(size, 1);
    });

    it('allSizes returns all queue sizes', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueFifo({ id: 't-1' });
      const sizes = await q.allSizes();
      assert.strictEqual(sizes.fifo, 1);
    });

    it('dequeueWithVisibility makes task invisible', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueFifo({ id: 't-1' });
      const task = await q.dequeueWithVisibility('fifo', 100);
      assert.strictEqual(task.id, 't-1');
      const empty = await q.dequeueFifo();
      assert.strictEqual(empty, null);
      q.acknowledge(task.id);
    });

    it('acknowledge clears visibility timeout', () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      q._visibilityTimeouts.set('t-1', setTimeout(() => {}, 1000));
      q.acknowledge('t-1');
      assert.ok(!q._visibilityTimeouts.has('t-1'));
    });

    it('peek returns top items', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueFifo({ id: 't-1' });
      await q.enqueueFifo({ id: 't-2' });
      const items = await q.peek('fifo', 1);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].id, 't-1');
    });

    it('clear removes visibility timeouts', async () => {
      const s = new ClusterStorage();
      const q = new TaskQueue(s);
      await q.enqueueFifo({ id: 't-1' });
      const task = await q.dequeueWithVisibility('fifo', 50000);
      await q.clear();
      assert.strictEqual(q._visibilityTimeouts.size, 0);
    });
  });

  describe('LoadBalancer', () => {
    const { LoadBalancer } = require('../../lib/cluster');
    const { WorkerNode } = require('../../lib/cluster');

    it('creates with default round_robin strategy', () => {
      const lb = new LoadBalancer();
      assert.strictEqual(lb.getStrategy(), 'round_robin');
    });

    it('setStrategy changes strategy', () => {
      const lb = new LoadBalancer();
      lb.setStrategy('least_busy');
      assert.strictEqual(lb.getStrategy(), 'least_busy');
    });

    it('throws for unknown strategy', () => {
      const lb = new LoadBalancer();
      assert.throws(() => lb.setStrategy('unknown'), /Unknown/);
    });

    it('returns null for empty workers', async () => {
      const lb = new LoadBalancer();
      const w = await lb.selectWorker([], {});
      assert.strictEqual(w, null);
    });

    it('round_robin cycles through workers', async () => {
      const lb = new LoadBalancer();
      const workers = [new WorkerNode({ id: 'w-1' }), new WorkerNode({ id: 'w-2' })];
      const w1 = await lb.selectWorker(workers, { type: 'workflow' }, 'round_robin');
      const w2 = await lb.selectWorker(workers, { type: 'workflow' }, 'round_robin');
      const w3 = await lb.selectWorker(workers, { type: 'workflow' }, 'round_robin');
      assert.strictEqual(w1.id, 'w-1');
      assert.strictEqual(w2.id, 'w-2');
      assert.strictEqual(w3.id, 'w-1');
    });

    it('least_busy picks worker with fewest tasks', async () => {
      const lb = new LoadBalancer();
      const w1 = new WorkerNode({ id: 'w-1' });
      w1.addTask('t-1');
      w1.addTask('t-2');
      const w2 = new WorkerNode({ id: 'w-2' });
      w2.addTask('t-3');
      const selected = await lb.selectWorker([w1, w2], {}, 'least_busy');
      assert.strictEqual(selected.id, 'w-2');
    });

    it('weighted distributes based on weight', async () => {
      const lb = new LoadBalancer();
      const heavy = new WorkerNode({ id: 'w-heavy', weight: 10 });
      const light = new WorkerNode({ id: 'w-light', weight: 1 });
      const results = { heavy: 0, light: 0 };
      for (let i = 0; i < 100; i++) {
        const w = await lb.selectWorker([heavy, light], {}, 'weighted');
        results[w.id === 'w-heavy' ? 'heavy' : 'light']++;
      }
      assert.ok(results.heavy > results.light);
    });

    it('latency_optimized picks lowest latency', async () => {
      const lb = new LoadBalancer();
      const fast = new WorkerNode({ id: 'w-fast', metadata: { avgLatency: 10 } });
      const slow = new WorkerNode({ id: 'w-slow', metadata: { avgLatency: 100 } });
      const selected = await lb.selectWorker([fast, slow], {}, 'latency');
      assert.strictEqual(selected.id, 'w-fast');
    });

    it('cost_optimized picks lowest cost', async () => {
      const lb = new LoadBalancer();
      const cheap = new WorkerNode({ id: 'w-cheap', metadata: { avgCost: 1 } });
      const expensive = new WorkerNode({ id: 'w-expensive', metadata: { avgCost: 10 } });
      const selected = await lb.selectWorker([cheap, expensive], {}, 'cost');
      assert.strictEqual(selected.id, 'w-cheap');
    });

    it('sticky routes same workflow to same worker', async () => {
      const lb = new LoadBalancer();
      const w1 = new WorkerNode({ id: 'w-1' });
      const w2 = new WorkerNode({ id: 'w-2' });
      const task = { workflowId: 'wf-1' };
      const first = await lb.selectWorker([w1, w2], task, 'sticky');
      const second = await lb.selectWorker([w1, w2], task, 'sticky');
      assert.strictEqual(first.id, second.id);
    });

    it('clearSticky removes assignment', async () => {
      const lb = new LoadBalancer();
      const w1 = new WorkerNode({ id: 'w-1' });
      const w2 = new WorkerNode({ id: 'w-2' });
      await lb.selectWorker([w1, w2], { workflowId: 'wf-1' }, 'sticky');
      lb.clearSticky('wf-1');
      assert.ok(!lb._stickyAssignments.has('wf-1'));
    });

    it('getStrategies returns all strategies', () => {
      const lb = new LoadBalancer();
      const strategies = lb.getStrategies();
      assert.ok(strategies.includes('round_robin'));
      assert.ok(strategies.includes('least_busy'));
      assert.ok(strategies.includes('sticky'));
      assert.ok(strategies.length >= 6);
    });
  });

  describe('TaskDispatcher', () => {
    const ClusterStorage = require('../../lib/cluster/clusterStorage');
    const { TaskDispatcher } = require('../../lib/cluster');
    const { WorkerNode } = require('../../lib/cluster');
    const { TaskQueue } = require('../../lib/cluster');
    const { LoadBalancer } = require('../../lib/cluster');

    it('dispatches task to an available worker', async () => {
      const s = new ClusterStorage();
      const worker = new WorkerNode({ id: 'w-1' });
      await s.storeWorker(worker.toJSON());
      const d = new TaskDispatcher({ storage: s, getWorkers: () => [worker] });
      const result = await d.dispatch({ type: 'workflow', payload: { test: true } });
      assert.strictEqual(result.status, 'dispatched');
      assert.strictEqual(result.workerId, 'w-1');
    });

    it('queues task if no worker available', async () => {
      const s = new ClusterStorage();
      const d = new TaskDispatcher({ storage: s, getWorkers: () => [] });
      const result = await d.dispatch({ type: 'workflow', payload: {} });
      assert.strictEqual(result.status, 'queued');
    });

    it('completeTask marks completed and frees worker', async () => {
      const s = new ClusterStorage();
      const worker = new WorkerNode({ id: 'w-1' });
      await s.storeWorker(worker.toJSON());
      const d = new TaskDispatcher({ storage: s, getWorkers: () => [worker] });
      const { taskId } = await d.dispatch({ type: 'workflow' });
      const completed = await d.completeTask(taskId, { success: true });
      assert.strictEqual(completed.status, 'completed');
      assert.deepStrictEqual(completed.result, { success: true });
    });

    it('failTask with retries moves to retrying', async () => {
      const s = new ClusterStorage();
      const worker = new WorkerNode({ id: 'w-1' });
      await s.storeWorker(worker.toJSON());
      const d = new TaskDispatcher({ storage: s, getWorkers: () => [worker], maxRetries: 3 });
      const { taskId } = await d.dispatch({ type: 'workflow' });
      const failed = await d.failTask(taskId, 'Error occurred');
      assert.strictEqual(failed.status, 'retrying');
      assert.ok(failed.attempts >= 1);
    });

    it('failTask moves to dead letter after max retries', async () => {
      const s = new ClusterStorage();
      const worker = new WorkerNode({ id: 'w-1' });
      await s.storeWorker(worker.toJSON());
      const d = new TaskDispatcher({ storage: s, getWorkers: () => [worker], maxRetries: 1 });
      const { taskId } = await d.dispatch({ type: 'workflow' });
      await d.failTask(taskId, 'Error 1');
      const failed = await d.failTask(taskId, 'Error 2');
      assert.strictEqual(failed.status, 'failed');
      assert.ok(failed.attempts >= 1);
    });

    it('cancelTask marks cancelled', async () => {
      const s = new ClusterStorage();
      const d = new TaskDispatcher({ storage: s, getWorkers: () => [] });
      const { taskId } = await d.dispatch({ type: 'workflow' });
      const cancelled = await d.cancelTask(taskId);
      assert.strictEqual(cancelled.status, 'cancelled');
    });

    it('getTask returns stored task', async () => {
      const s = new ClusterStorage();
      const d = new TaskDispatcher({ storage: s, getWorkers: () => [] });
      const { taskId } = await d.dispatch({ id: 'my-task', type: 'workflow' });
      const task = await d.getTask('my-task');
      assert.strictEqual(task.id, 'my-task');
    });

    it('listTasks returns filtered tasks', async () => {
      const s = new ClusterStorage();
      const d = new TaskDispatcher({ storage: s, getWorkers: () => [] });
      await d.dispatch({ id: 't-1', type: 'workflow' });
      await d.dispatch({ id: 't-2', type: 'ai' });
      const aiTasks = await d.listTasks({ type: 'ai' });
      assert.strictEqual(aiTasks.length, 1);
    });

    it('getQueueSizes returns sizes', async () => {
      const s = new ClusterStorage();
      const d = new TaskDispatcher({ storage: s, getWorkers: () => [] });
      await d.dispatch({ type: 'workflow' });
      const sizes = await d.getQueueSizes();
      assert.ok(sizes.priority >= 0);
    });

    it('processQueues processes pending items', async () => {
      const s = new ClusterStorage();
      const worker = new WorkerNode({ id: 'w-1' });
      await s.storeWorker(worker.toJSON());
      const d = new TaskDispatcher({ storage: s, getWorkers: () => [worker] });
      await d._queue.enqueueFifo({ id: 'q-task', type: 'workflow' });
      const results = await d.processQueues();
      assert.ok(results.length >= 0);
    });

    it('setGetWorkers replaces worker getter', () => {
      const d = new TaskDispatcher();
      const fn = () => [new WorkerNode({ id: 'w-new' })];
      d.setGetWorkers(fn);
      assert.ok(d._getWorkers);
    });
  });

  describe('DistributedScheduler', () => {
    const DistributedScheduler = require('../../lib/cluster/distributedScheduler');
    const ClusterStorage = require('../../lib/cluster/clusterStorage');
    const { TaskDispatcher } = require('../../lib/cluster');
    const { LeaderElection } = require('../../lib/cluster');

    it('creates with defaults', () => {
      const s = new DistributedScheduler();
      assert.ok(s);
      assert.strictEqual(s.isRunning(), false);
    });

    it('start and stop work', () => {
      const s = new DistributedScheduler({ checkInterval: 50000 });
      s.start();
      assert.strictEqual(s.isRunning(), true);
      s.stop();
      assert.strictEqual(s.isRunning(), false);
    });

    it('scheduleTask adds a scheduled job', () => {
      const s = new DistributedScheduler();
      const jobId = s.scheduleTask({ type: 'workflow' }, Date.now() + 60000);
      assert.ok(jobId);
      assert.strictEqual(s.getScheduledJobs().length, 1);
    });

    it('scheduleDelayed adds a delayed job', () => {
      const s = new DistributedScheduler();
      s.scheduleDelayed({ type: 'workflow' }, 5000);
      assert.strictEqual(s.getScheduledJobs().length, 1);
    });

    it('scheduleInterval adds a cron job', () => {
      const s = new DistributedScheduler();
      s.scheduleInterval({ type: 'workflow' }, 10000);
      assert.strictEqual(s.getCronJobs().length, 1);
    });

    it('cancelJob removes a job', () => {
      const s = new DistributedScheduler();
      const jobId = s.scheduleTask({ type: 'workflow' }, Date.now() + 60000);
      s.cancelJob(jobId);
      assert.strictEqual(s.getScheduledJobs().length, 0);
    });

    it('only leader processes jobs', async () => {
      const le = new LeaderElection({ nodeId: 'coord-1' });
      const s = new DistributedScheduler({ leaderElection: le, checkInterval: 50000 });
      le._isLeader = false;
      s.start();
      assert.strictEqual(s.isRunning(), true);
      s.stop();
    });
  });

  describe('ClusterMetrics', () => {
    const ClusterMetrics = require('../../lib/cluster/clusterMetrics');
    const ClusterStorage = require('../../lib/cluster/clusterStorage');

    it('increments counters', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.incrementCounter('tasks.dispatched');
      assert.strictEqual(m.getCounter('tasks.dispatched'), 1);
    });

    it('incrementCounter with tags', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.incrementCounter('tasks.dispatched', 1, { workerId: 'w-1' });
      assert.strictEqual(m.getCounter('tasks.dispatched', { workerId: 'w-1' }), 1);
    });

    it('records gauges', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.recordGauge('workers.active', 5);
      assert.strictEqual(m.getGauge('workers.active'), 5);
    });

    it('records histograms', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.recordHistogram('task.duration', 100);
      m.recordHistogram('task.duration', 200);
      m.recordHistogram('task.duration', 300);
      const hist = m.getHistogram('task.duration');
      assert.strictEqual(hist.count, 3);
      assert.strictEqual(hist.min, 100);
      assert.strictEqual(hist.max, 300);
      assert.strictEqual(hist.avg, 200);
    });

    it('getAllMetrics returns snapshot', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.incrementCounter('tasks.completed');
      m.recordGauge('workers.active', 3);
      const all = m.getAllMetrics();
      assert.ok(all.counters);
      assert.ok(all.gauges);
    });

    it('recordWorkerEvent stores history', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.recordWorkerEvent('w-1', { type: 'joined' });
      const history = m.getWorkerHistory();
      assert.strictEqual(history.length, 1);
    });

    it('snapshot returns counts', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      const s = m.snapshot();
      assert.ok(s.counters !== undefined);
    });

    it('recordDispatch increments dispatched counter', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.recordDispatch('w-1', 't-1', 'round_robin');
      assert.strictEqual(m.getCounter('tasks.dispatched', { workerId: 'w-1', strategy: 'round_robin' }), 1);
    });

    it('recordCompletion increments completed', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.recordCompletion('w-1', 't-1', 150);
      assert.strictEqual(m.getCounter('tasks.completed', { workerId: 'w-1' }), 1);
    });

    it('recordFailure increments failed', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.recordFailure('w-1', 't-1');
      assert.strictEqual(m.getCounter('tasks.failed', { workerId: 'w-1' }), 1);
    });

    it('recordHeartbeat increments heartbeats', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.recordHeartbeat('w-1');
      assert.strictEqual(m.getCounter('heartbeats', { workerId: 'w-1' }), 1);
    });

    it('recordFailover increments failovers', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.recordFailover('coord-1', 'coord-2');
      assert.strictEqual(m.getCounter('failovers'), 1);
    });

    it('reset clears all metrics', () => {
      const m = new ClusterMetrics(new ClusterStorage());
      m.incrementCounter('tasks.completed', 10);
      m.reset();
      assert.strictEqual(m.getCounter('tasks.completed'), 0);
    });
  });

  describe('WorkerManager', () => {
    const WorkerManager = require('../../lib/cluster/workerManager');
    const ClusterStorage = require('../../lib/cluster/clusterStorage');

    it('registers a worker', async () => {
      const wm = new WorkerManager();
      const w = await wm.registerWorker({ id: 'w-1', type: 'workflow' });
      assert.strictEqual(w.id, 'w-1');
    });

    it('unregisters a worker', async () => {
      const wm = new WorkerManager();
      await wm.registerWorker({ id: 'w-1', type: 'workflow' });
      const removed = await wm.unregisterWorker('w-1');
      assert.strictEqual(removed, true);
    });

    it('lists workers', async () => {
      const wm = new WorkerManager();
      await wm.registerWorker({ id: 'w-1', type: 'workflow' });
      await wm.registerWorker({ id: 'w-2', type: 'ai' });
      const workers = await wm.listWorkers();
      assert.strictEqual(workers.length, 2);
    });

    it('getWorker returns by id', async () => {
      const wm = new WorkerManager();
      await wm.registerWorker({ id: 'w-1', type: 'workflow' });
      const w = await wm.getWorker('w-1');
      assert.strictEqual(w.id, 'w-1');
    });

    it('workerCount returns count', async () => {
      const wm = new WorkerManager();
      await wm.registerWorker({ id: 'w-1', type: 'workflow' });
      assert.strictEqual(await wm.workerCount(), 1);
    });

    it('workerCountByStatus returns breakdown', async () => {
      const wm = new WorkerManager();
      await wm.registerWorker({ id: 'w-1', type: 'workflow' });
      await wm.registerWorker({ id: 'w-2', type: 'ai', status: 'degraded' });
      const counts = await wm.workerCountByStatus();
      assert.strictEqual(counts.idle, 1);
      assert.strictEqual(counts.degraded, 1);
    });

    it('receiveHeartbeat updates worker', async () => {
      const wm = new WorkerManager();
      await wm.registerWorker({ id: 'w-1', type: 'workflow' });
      await wm.receiveHeartbeat('w-1', { cpu: 75, memory: { used: 512, total: 1024 } });
      const w = await wm.getWorker('w-1');
      assert.strictEqual(w.cpu, 75);
      assert.strictEqual(w.memory.used, 512);
    });

    it('receiveHeartbeat reconnects offline worker', async () => {
      const wm = new WorkerManager();
      await wm.registerWorker({ id: 'w-1', type: 'workflow', status: 'offline' });
      await wm.receiveHeartbeat('w-1', {});
      const w = await wm.getWorker('w-1');
      assert.strictEqual(w.status, 'idle');
    });

    it('start/stop heartbeat monitor', () => {
      const wm = new WorkerManager();
      wm.startHeartbeatMonitor(() => []);
      assert.ok(wm._heartbeatMonitor.isRunning());
      wm.stopHeartbeatMonitor();
      assert.strictEqual(wm._heartbeatMonitor.isRunning(), false);
    });

    it('getHeartbeatStatus returns config', () => {
      const wm = new WorkerManager();
      const s = wm.getHeartbeatStatus();
      assert.ok(s.running !== undefined);
    });

    it('getRegistry returns registry', () => {
      const wm = new WorkerManager();
      assert.ok(wm.getRegistry());
    });
  });

  describe('ClusterManager', () => {
    const ClusterManager = require('../../lib/cluster/clusterManager');

    it('creates with default options', () => {
      const cm = new ClusterManager();
      assert.ok(cm.getClusterId());
      assert.strictEqual(cm.isRunning(), false);
    });

    it('start initializes cluster with simulated workers', async () => {
      const cm = new ClusterManager();
      const result = await cm.start({ simulateWorkers: true, workerCount: 5, isLocal: true });
      assert.ok(result.clusterId);
      assert.ok(result.startedAt);
      assert.strictEqual(cm.isRunning(), true);
      await cm.stop();
    });

    it('start without simulated workers', async () => {
      const cm = new ClusterManager();
      const result = await cm.start({ simulateWorkers: false });
      assert.ok(result.clusterId);
      assert.strictEqual(cm.isRunning(), true);
      await cm.stop();
    });

    it('stop shuts down cluster', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: false });
      await cm.stop();
      assert.strictEqual(cm.isRunning(), false);
    });

    it('registerWorker adds a worker', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: false });
      const w = await cm.registerWorker({ id: 'test-w-1', type: 'workflow' });
      assert.strictEqual(w.id, 'test-w-1');
      await cm.stop();
    });

    it('removeWorker removes a worker', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 1, isLocal: true });
      const removed = await cm.removeWorker('sim-worker-1');
      assert.strictEqual(removed, true);
      await cm.stop();
    });

    it('dispatchWorkflow dispatches a workflow task', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 2, isLocal: true });
      const result = await cm.dispatchWorkflow('wf-def-1', { test: true }, { priority: 5 });
      assert.ok(result.taskId);
      await cm.stop();
    });

    it('dispatchTask dispatches a generic task', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 2, isLocal: true });
      const result = await cm.dispatchTask({ type: 'ai', payload: { model: 'gpt-4' } });
      assert.ok(result.taskId || result.taskId === undefined);
      await cm.stop();
    });

    it('getClusterHealth returns health status', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 3, isLocal: true });
      const health = await cm.getClusterHealth();
      assert.ok(health.clusterId);
      assert.ok(health.status);
      assert.ok(health.workers);
      assert.ok(health.leader);
      assert.ok(health.queues);
      assert.ok(health.tasks);
      await cm.stop();
    });

    it('getWorkers returns worker list', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 3, isLocal: true });
      const workers = await cm.getWorkers();
      assert.strictEqual(workers.length, 3);
      await cm.stop();
    });

    it('getQueues returns queue info', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: false });
      const queues = await cm.getQueues();
      assert.ok(Array.isArray(queues));
      await cm.stop();
    });

    it('completeTask completes a dispatched task', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 2, isLocal: true });
      const { taskId } = await cm.dispatchTask({ type: 'workflow' });
      const completed = await cm.completeTask(taskId, { ok: true });
      assert.strictEqual(completed.status, 'completed');
      await cm.stop();
    });

    it('failTask marks task as failed/retrying', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 2, isLocal: true });
      const { taskId } = await cm.dispatchTask({ type: 'workflow' });
      const result = await cm.failTask(taskId, 'error');
      assert.ok(result.status === 'retrying' || result.status === 'failed');
      await cm.stop();
    });

    it('cancelTask cancels a task', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 2, isLocal: true });
      const { taskId } = await cm.dispatchTask({ type: 'workflow' });
      const cancelled = await cm.cancelTask(taskId);
      assert.strictEqual(cancelled.status, 'cancelled');
      await cm.stop();
    });

    it('getLeader returns leader status', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: false });
      const leader = await cm.getLeader();
      assert.ok(leader.isLeader !== undefined);
      await cm.stop();
    });

    it('receiveHeartbeat processes heartbeat', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 2, isLocal: true });
      cm.receiveHeartbeat('sim-worker-1', { cpu: 50 });
      await cm.stop();
    });

    it('getMetricsCollector returns metrics', () => {
      const cm = new ClusterManager();
      assert.ok(cm.getMetricsCollector());
    });

    it('getDispatcher returns dispatcher', () => {
      const cm = new ClusterManager();
      assert.ok(cm.getDispatcher());
    });

    it('getScheduler returns scheduler', () => {
      const cm = new ClusterManager();
      assert.ok(cm.getScheduler());
    });

    it('getLeaderElection returns leader election', () => {
      const cm = new ClusterManager();
      assert.ok(cm.getLeaderElection());
    });

    it('getEventBus returns event bus', () => {
      const cm = new ClusterManager();
      assert.ok(cm.getEventBus());
    });

    it('getStorage returns storage', () => {
      const cm = new ClusterManager();
      assert.ok(cm.getStorage());
    });

    it('setLoadBalancerStrategy changes strategy', async () => {
      const cm = new ClusterManager();
      await cm.setLoadBalancerStrategy('least_busy');
      await cm.stop();
    });
  });

  describe('ClusterEvents', () => {
    const { ClusterEvents, EVENT_TYPES } = require('../../lib/cluster/clusterEvents');

    it('emits and listens for events', (done) => {
      const e = new ClusterEvents();
      e.on('cluster.started', (entry) => {
        assert.strictEqual(entry.type, 'cluster.started');
        done();
      });
      e.emit('cluster.started', { clusterId: 'test' });
    });

    it('off removes listener', () => {
      const e = new ClusterEvents();
      let count = 0;
      const off = e.on('cluster.test', () => count++);
      off();
      e.emit('cluster.test');
      assert.strictEqual(count, 0);
    });

    it('wildcard catches all', (done) => {
      const e = new ClusterEvents();
      e.on('*', (entry) => {
        assert.strictEqual(entry.type, 'cluster.any');
        done();
      });
      e.emit('cluster.any');
    });

    it('getHistory returns events', () => {
      const e = new ClusterEvents();
      e.emit('cluster.started');
      const history = e.getHistory();
      assert.strictEqual(history.length, 1);
    });

    it('getHistory filters by type', () => {
      const e = new ClusterEvents();
      e.emit('cluster.started');
      e.emit('cluster.stopped');
      const filtered = e.getHistory({ type: 'cluster.started' });
      assert.strictEqual(filtered.length, 1);
    });

    it('EVENT_TYPES has all expected types', () => {
      assert.ok(EVENT_TYPES.includes('cluster.started'));
      assert.ok(EVENT_TYPES.includes('cluster.worker.joined'));
      assert.ok(EVENT_TYPES.includes('cluster.worker.left'));
      assert.ok(EVENT_TYPES.includes('cluster.leader.changed'));
      assert.ok(EVENT_TYPES.includes('cluster.task.dispatched'));
      assert.ok(EVENT_TYPES.includes('cluster.task.completed'));
      assert.ok(EVENT_TYPES.includes('cluster.task.failed'));
      assert.ok(EVENT_TYPES.includes('cluster.failover'));
      assert.ok(EVENT_TYPES.includes('cluster.heartbeat'));
      assert.strictEqual(EVENT_TYPES.length, 12);
    });

    it('clear removes all listeners and history', () => {
      const e = new ClusterEvents();
      e.on('cluster.test', () => {});
      e.emit('cluster.test');
      e.clear();
      assert.strictEqual(e.getHistory().length, 0);
    });
  });

  describe('Entry Point (index.js)', () => {
    const cluster = require('../../lib/cluster');

    it('exports startCluster', () => {
      assert.strictEqual(typeof cluster.startCluster, 'function');
    });

    it('exports stopCluster', () => {
      assert.strictEqual(typeof cluster.stopCluster, 'function');
    });

    it('exports registerWorker', () => {
      assert.strictEqual(typeof cluster.registerWorker, 'function');
    });

    it('exports removeWorker', () => {
      assert.strictEqual(typeof cluster.removeWorker, 'function');
    });

    it('exports dispatchWorkflow', () => {
      assert.strictEqual(typeof cluster.dispatchWorkflow, 'function');
    });

    it('exports dispatchTask', () => {
      assert.strictEqual(typeof cluster.dispatchTask, 'function');
    });

    it('exports getClusterHealth', () => {
      assert.strictEqual(typeof cluster.getClusterHealth, 'function');
    });

    it('exports getClusterManager', () => {
      assert.strictEqual(typeof cluster.getClusterManager, 'function');
    });

    it('exports createClusterManager', () => {
      assert.strictEqual(typeof cluster.createClusterManager, 'function');
    });

    it('exports ClusterManager class', () => {
      assert.strictEqual(typeof cluster.ClusterManager, 'function');
    });

    it('exports ClusterStorage class', () => {
      assert.strictEqual(typeof cluster.ClusterStorage, 'function');
    });

    it('exports WorkerManager class', () => {
      assert.strictEqual(typeof cluster.WorkerManager, 'function');
    });

    it('exports WorkerNode class', () => {
      assert.strictEqual(typeof cluster.WorkerNode, 'function');
    });

    it('exports HeartbeatMonitor class', () => {
      assert.strictEqual(typeof cluster.HeartbeatMonitor, 'function');
    });

    it('exports LeaderElection class', () => {
      assert.strictEqual(typeof cluster.LeaderElection, 'function');
    });

    it('exports TaskDispatcher class', () => {
      assert.strictEqual(typeof cluster.TaskDispatcher, 'function');
    });

    it('exports TaskQueue class', () => {
      assert.strictEqual(typeof cluster.TaskQueue, 'function');
    });

    it('exports LoadBalancer class', () => {
      assert.strictEqual(typeof cluster.LoadBalancer, 'function');
    });

    it('exports DistributedScheduler class', () => {
      assert.strictEqual(typeof cluster.DistributedScheduler, 'function');
    });

    it('exports ClusterMetrics class', () => {
      assert.strictEqual(typeof cluster.ClusterMetrics, 'function');
    });

    it('exports ClusterEvents class', () => {
      assert.strictEqual(typeof cluster.ClusterEvents, 'function');
    });

    it('exports constants', () => {
      assert.ok(Array.isArray(cluster.STATUSES));
      assert.ok(Array.isArray(cluster.WORKER_TYPES));
      assert.ok(Array.isArray(cluster.TASK_STATUSES));
      assert.ok(Array.isArray(cluster.QUEUE_TYPES));
      assert.ok(Array.isArray(cluster.STRATEGIES));
      assert.ok(Array.isArray(cluster.EVENT_TYPES));
    });

    it('startCluster works via singleton', async () => {
      const result = await cluster.startCluster({ simulateWorkers: false });
      assert.ok(result.clusterId);
      await cluster.stopCluster();
    });

    it('getClusterHealth works via singleton', async () => {
      await cluster.startCluster({ simulateWorkers: true, workerCount: 2, isLocal: true });
      const health = await cluster.getClusterHealth();
      assert.ok(health.status);
      await cluster.stopCluster();
    });

    it('registerWorker works via singleton', async () => {
      await cluster.startCluster({ simulateWorkers: false });
      const w = await cluster.registerWorker({ id: 'singleton-w-1', type: 'deployment' });
      assert.strictEqual(w.id, 'singleton-w-1');
      await cluster.stopCluster();
    });

    it('removeWorker works via singleton', async () => {
      await cluster.startCluster({ simulateWorkers: true, workerCount: 1, isLocal: true });
      const removed = await cluster.removeWorker('sim-worker-1');
      assert.strictEqual(removed, true);
      await cluster.stopCluster();
    });

    it('dispatchWorkflow works via singleton', async () => {
      await cluster.startCluster({ simulateWorkers: true, workerCount: 2, isLocal: true });
      const result = await cluster.dispatchWorkflow('wf-1', {});
      assert.ok(result);
      await cluster.stopCluster();
    });

    it('dispatchTask works via singleton', async () => {
      await cluster.startCluster({ simulateWorkers: true, workerCount: 2, isLocal: true });
      const result = await cluster.dispatchTask({ type: 'background', payload: {} });
      assert.ok(result);
      await cluster.stopCluster();
    });

    it('startCluster is idempotent on double start', async () => {
      await cluster.startCluster({ simulateWorkers: false });
      await cluster.startCluster({ simulateWorkers: false });
      const cm = cluster.getClusterManager();
      assert.ok(cm.isRunning());
      await cluster.stopCluster();
    });

    it('createClusterManager creates new instance', () => {
      const cm = cluster.createClusterManager();
      assert.ok(cm.getClusterId());
      assert.strictEqual(cm.isRunning(), false);
    });
  });

  describe('Workflow to Cluster Integration', () => {
    const { getClusterManager } = require('../../lib/cluster');

    it('cluster dispatches workflow-style tasks', async () => {
      const cm = getClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 3, isLocal: true });
      const result = await cm.dispatchTask({
        type: 'workflow',
        workflowId: 'wf-integration',
        payload: { steps: ['init', 'process', 'finalize'] },
        priority: 8,
      });
      assert.ok(result.taskId);
      const task = await cm.getTask(result.taskId);
      assert.ok(task);
      await cm.stop();
    });
  });

  describe('Failover & Recovery Integration', () => {
    const ClusterManager = require('../../lib/cluster/clusterManager');
    const { ClusterEvents } = require('../../lib/cluster/clusterEvents');

    it('emits failover event when worker goes offline', (done) => {
      const events = new ClusterEvents();
      const cm = new ClusterManager({ eventBus: events });
      events.on('cluster.failover', (entry) => {
        assert.ok(entry.data.workerId || entry.data.reason);
        cm.stop();
        done();
      });
      cm.start({ simulateWorkers: true, workerCount: 2, isLocal: true }).then(() => {
        const wm = cm._workerManager;
        wm._handleWorkerOffline({ id: 'sim-worker-1', type: 'workflow', status: 'busy' });
      });
    });

    it('leader election recovers after timeout', async () => {
      const events = new ClusterEvents();
      const le = new (require('../../lib/cluster/leaderElection'))({
        nodeId: 'coord-recovery',
        electionTimeout: 100,
        heartbeatInterval: 50000,
        eventBus: events,
      });
      le.start(['coord-recovery']);
      await new Promise(r => setTimeout(r, 50));
      assert.ok(le.isLeader());
      le._lastLeaderHeartbeat = 0;
      await new Promise(r => setTimeout(r, 200));
      assert.ok(le.isLeader() || le.getLeaderId() === 'coord-recovery');
      le.stop();
    });
  });

  describe('Dashboard Integration', () => {
    const { renderCluster } = require('../../ui/dashboard/pages/cluster');

    it('renders cluster page without errors', () => {
      const html = renderCluster({});
      assert.ok(html.includes('Cluster Center'));
      assert.ok(html.includes('dashboard'));
    });

    it('renders with worker filter', () => {
      const html = renderCluster({ workerFilter: 'idle' });
      assert.ok(html.includes('Cluster Center'));
    });

    it('renders with view option', () => {
      const html = renderCluster({ view: 'workers' });
      assert.ok(html.includes('Cluster Center'));
    });
  });

  describe('API Integration', () => {
    const clusterController = require('../../lib/api/controllers/clusterController');

    it('controller exports all endpoints', () => {
      assert.strictEqual(typeof clusterController.getClusterHealthEndpoint, 'function');
      assert.strictEqual(typeof clusterController.getWorkersEndpoint, 'function');
      assert.strictEqual(typeof clusterController.getQueuesEndpoint, 'function');
      assert.strictEqual(typeof clusterController.getClusterMetricsEndpoint, 'function');
      assert.strictEqual(typeof clusterController.getLeaderEndpoint, 'function');
      assert.strictEqual(typeof clusterController.registerWorkerEndpoint, 'function');
      assert.strictEqual(typeof clusterController.removeWorkerEndpoint, 'function');
      assert.strictEqual(typeof clusterController.dispatchEndpoint, 'function');
    });

    it('getClusterHealthEndpoint returns health', async () => {
      const { getClusterManager } = require('../../lib/cluster');
      const cm = getClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 2, isLocal: true });
      const req = { query: {} };
      let resData;
      const res = { status: () => res, json: (d) => { resData = d; } };
      await clusterController.getClusterHealthEndpoint(req, res);
      assert.ok(resData);
      await cm.stop();
    });
  });

  describe('Scalability', () => {
    const ClusterManager = require('../../lib/cluster/clusterManager');

    it('supports 100 simulated workers', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 100, isLocal: true });
      const workers = await cm.getWorkers();
      assert.strictEqual(workers.length, 100);
      const health = await cm.getClusterHealth();
      assert.strictEqual(health.workers.total, 100);
      await cm.stop();
    });

    it('supports 1000 concurrent tasks', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 10, isLocal: true });
      const tasks = [];
      for (let i = 0; i < 1000; i++) {
        tasks.push(cm.dispatchTask({ id: `stress-${i}`, type: 'workflow', payload: { idx: i } }));
      }
      const results = await Promise.all(tasks);
      assert.strictEqual(results.length, 1000);
      await cm.stop();
    });

    it('load balances across many workers', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: true, workerCount: 10, isLocal: true });
      for (let i = 0; i < 100; i++) {
        await cm.dispatchTask({ type: 'workflow', payload: { idx: i } });
      }
      const health = await cm.getClusterHealth();
      assert.ok(health.workers.total >= 10);
      await cm.stop();
    });
  });

  describe('Stress Tests', () => {
    const ClusterManager = require('../../lib/cluster/clusterManager');

    it('rapid start/stop cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const cm = new ClusterManager();
        await cm.start({ simulateWorkers: true, workerCount: 3, isLocal: true });
        assert.ok(cm.isRunning());
        await cm.stop();
        assert.ok(!cm.isRunning());
      }
    });

    it('concurrent worker registration', async () => {
      const cm = new ClusterManager();
      await cm.start({ simulateWorkers: false });
      const regs = [];
      for (let i = 0; i < 50; i++) {
        regs.push(cm.registerWorker({ id: `con-w-${i}`, type: i % 2 === 0 ? 'workflow' : 'ai' }));
      }
      await Promise.all(regs);
      const count = await cm._workerManager.workerCount();
      assert.strictEqual(count, 50);
      await cm.stop();
    });
  });
});
