const assert = require('assert');

describe('Global Event Streaming Engine', function() {
  describe('EventSerializer', () => {
    const { EventSerializer } = require('../../lib/events');

    it('normalizes an event with defaults', () => {
      const e = EventSerializer.normalize('test.event', { key: 'val' });
      assert.ok(e.id);
      assert.strictEqual(e.type, 'test.event');
      assert.strictEqual(e.source, 'system');
      assert.strictEqual(e.severity, 'info');
      assert.strictEqual(e.version, 1);
    });

    it('normalizes with custom options', () => {
      const e = EventSerializer.normalize('custom.event', { data: 42 }, {
        source: 'api', correlationId: 'corr-1', severity: 'error', version: 2,
      });
      assert.strictEqual(e.source, 'api');
      assert.strictEqual(e.correlationId, 'corr-1');
      assert.strictEqual(e.severity, 'error');
      assert.strictEqual(e.version, 2);
    });

    it('serializes and deserializes', () => {
      const e = EventSerializer.normalize('test', {});
      const json = EventSerializer.serialize(e);
      const back = EventSerializer.deserialize(json);
      assert.strictEqual(back.id, e.id);
    });

    it('validate returns valid for correct event', () => {
      const e = EventSerializer.normalize('test', {});
      const res = EventSerializer.validate(e);
      assert.strictEqual(res.valid, true);
    });

    it('validate returns errors for missing fields', () => {
      const res = EventSerializer.validate({});
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.length > 0);
    });

    it('clone deep copies', () => {
      const e = EventSerializer.normalize('test', { nested: { a: 1 } });
      const clone = EventSerializer.clone(e);
      clone.payload.nested.a = 2;
      assert.strictEqual(e.payload.nested.a, 1);
    });

    it('throws for missing type', () => {
      assert.throws(() => EventSerializer.normalize(null, {}), /type is required/);
    });
  });

  describe('EventSchemaRegistry', () => {
    const EventSchemaRegistry = require('../../lib/events/eventSchemaRegistry');

    it('registers and retrieves schemas', () => {
      const r = new EventSchemaRegistry();
      r.registerSchema('workflow.started', {
        properties: { workflowId: { type: 'string', required: true } },
      });
      const s = r.getSchema('workflow.started');
      assert.ok(s);
    });

    it('validates payload against schema', () => {
      const r = new EventSchemaRegistry();
      r.registerSchema('workflow.started', {
        properties: { workflowId: { type: 'string', required: true } },
      });
      const res = r.validate('workflow.started', {});
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.includes('workflowId is required'));
    });

    it('passes validation for correct payload', () => {
      const r = new EventSchemaRegistry();
      r.registerSchema('workflow.started', {
        properties: { workflowId: { type: 'string', required: true } },
      });
      const res = r.validate('workflow.started', { workflowId: 'wf-1' });
      assert.strictEqual(res.valid, true);
    });

    it('returns valid for unregistered schema', () => {
      const r = new EventSchemaRegistry();
      const res = r.validate('unknown.type', { foo: 'bar' });
      assert.strictEqual(res.valid, true);
    });

    it('validates enum constraint', () => {
      const r = new EventSchemaRegistry();
      r.registerSchema('workflow.status', {
        properties: { status: { type: 'string', enum: ['completed', 'failed'] } },
      });
      assert.strictEqual(r.validate('workflow.status', { status: 'completed' }).valid, true);
      assert.strictEqual(r.validate('workflow.status', { status: 'invalid' }).valid, false);
    });

    it('listSchemas returns schema metadata', () => {
      const r = new EventSchemaRegistry();
      r.registerSchema('test.event', { properties: { x: { type: 'string' } } });
      const list = r.listSchemas();
      assert.ok(list['test.event']);
    });

    it('hasSchema checks existence', () => {
      const r = new EventSchemaRegistry();
      r.registerSchema('test.event', { properties: {} });
      assert.ok(r.hasSchema('test.event'));
      assert.ok(!r.hasSchema('unknown'));
    });

    it('removeSchema removes', () => {
      const r = new EventSchemaRegistry();
      r.registerSchema('test.event', { properties: {} });
      r.removeSchema('test.event');
      assert.ok(!r.hasSchema('test.event'));
    });
  });

  describe('EventStore', () => {
    const EventStore = require('../../lib/events/eventStore');

    it('appends and retrieves events', async () => {
      const s = new EventStore();
      const e = await s.append({ id: 'e-1', type: 'test', timestamp: Date.now(), source: 'test', payload: {} });
      const found = await s.getById('e-1');
      assert.strictEqual(found.id, 'e-1');
    });

    it('queries by type', async () => {
      const s = new EventStore();
      await s.append({ id: 'e-1', type: 'workflow.started', timestamp: 100, source: 'wf', payload: {} });
      await s.append({ id: 'e-2', type: 'ai.generate', timestamp: 200, source: 'ai', payload: {} });
      const results = await s.query({ type: 'ai.generate' });
      assert.strictEqual(results.length, 1);
    });

    it('queries by correlationId', async () => {
      const s = new EventStore();
      await s.append({ id: 'e-1', type: 'test', timestamp: 100, source: 'test', payload: {}, correlationId: 'corr-1' });
      await s.append({ id: 'e-2', type: 'test', timestamp: 200, source: 'test', payload: {}, correlationId: 'corr-2' });
      const results = await s.query({ correlationId: 'corr-1' });
      assert.strictEqual(results.length, 1);
    });

    it('queries by source', async () => {
      const s = new EventStore();
      await s.append({ id: 'e-1', type: 'test', timestamp: 100, source: 'api', payload: {} });
      const results = await s.query({ source: 'api' });
      assert.strictEqual(results.length, 1);
    });

    it('queries by time range', async () => {
      const s = new EventStore();
      await s.append({ id: 'e-1', type: 'test', timestamp: 100, source: 't', payload: {} });
      await s.append({ id: 'e-2', type: 'test', timestamp: 300, source: 't', payload: {} });
      const results = await s.query({ since: 200 });
      assert.strictEqual(results.length, 1);
    });

    it('supports typePattern wildcard query', async () => {
      const s = new EventStore();
      await s.append({ id: 'e-1', type: 'workflow.started', timestamp: 100, source: 'wf', payload: {} });
      await s.append({ id: 'e-2', type: 'workflow.completed', timestamp: 200, source: 'wf', payload: {} });
      await s.append({ id: 'e-3', type: 'ai.generate', timestamp: 300, source: 'ai', payload: {} });
      const results = await s.query({ typePattern: 'workflow.*' });
      assert.strictEqual(results.length, 2);
    });

    it('count returns correct number', async () => {
      const s = new EventStore();
      await s.append({ id: 'e-1', type: 'test', timestamp: 100, source: 't', payload: {} });
      assert.strictEqual(await s.count(), 1);
    });

    it('getTimeRange returns bounds', async () => {
      const s = new EventStore();
      await s.append({ id: 'e-1', type: 'test', timestamp: 100, source: 't', payload: {} });
      await s.append({ id: 'e-2', type: 'test', timestamp: 200, source: 't', payload: {} });
      const range = await s.getTimeRange();
      assert.strictEqual(range.start, 100);
      assert.strictEqual(range.end, 200);
    });

    it('getTypes returns unique types', async () => {
      const s = new EventStore();
      await s.append({ id: 'e-1', type: 'type-a', timestamp: 100, source: 't', payload: {} });
      await s.append({ id: 'e-2', type: 'type-b', timestamp: 200, source: 't', payload: {} });
      const types = await s.getTypes();
      assert.strictEqual(types.length, 2);
    });

    it('snapshot returns stats', async () => {
      const s = new EventStore();
      await s.append({ id: 'e-1', type: 'test', timestamp: 100, source: 't', payload: {} });
      const snap = await s.snapshot();
      assert.strictEqual(snap.totalEvents, 1);
    });

    it('clear removes all data', async () => {
      const s = new EventStore();
      await s.append({ id: 'e-1', type: 'test', timestamp: 100, source: 't', payload: {} });
      await s.clear();
      assert.strictEqual(await s.count(), 0);
    });
  });

  describe('EventBus', () => {
    const EventBus = require('../../lib/events/eventBus');

    it('emits and listens for events', (done) => {
      const bus = new EventBus();
      bus.on('test.event', (event) => {
        assert.strictEqual(event.type, 'test.event');
        done();
      });
      bus.emit('test.event', { data: 1 });
    });

    it('off removes listener', () => {
      const bus = new EventBus();
      let count = 0;
      const off = bus.on('test', () => count++);
      off();
      bus.emit('test', {});
      assert.strictEqual(count, 0);
    });

    it('wildcard catches all', (done) => {
      const bus = new EventBus();
      bus.on('*', (event) => {
        assert.strictEqual(event.type, 'any.event');
        done();
      });
      bus.emit('any.event', {});
    });

    it('async handlers execute', async () => {
      const bus = new EventBus();
      let called = false;
      bus.onAsync('test', async (event) => { called = true; });
      await bus.emit('test', {});
      assert.strictEqual(called, true);
    });

    it('enable/disable controls emission', async () => {
      const bus = new EventBus();
      let count = 0;
      bus.on('test', () => count++);
      bus.disable();
      await bus.emit('test', {});
      assert.strictEqual(count, 0);
      bus.enable();
      await bus.emit('test', {});
      assert.strictEqual(count, 1);
    });

    it('emit returns the event', async () => {
      const bus = new EventBus();
      const event = await bus.emit('test.event', { foo: 'bar' }, { source: 'test' });
      assert.strictEqual(event.type, 'test.event');
      assert.strictEqual(event.payload.foo, 'bar');
    });

    it('emit returns null when disabled', async () => {
      const bus = new EventBus();
      bus.disable();
      const event = await bus.emit('test', {});
      assert.strictEqual(event, null);
    });

    it('getHistory returns event history', async () => {
      const bus = new EventBus();
      await bus.emit('type-a', {});
      await bus.emit('type-b', {});
      const history = bus.getHistory({ type: 'type-a' });
      assert.strictEqual(history.length, 1);
    });

    it('listenerCount returns count', () => {
      const bus = new EventBus();
      bus.on('test', () => {});
      bus.onAsync('test', async () => {});
      assert.strictEqual(bus.listenerCount('test'), 2);
    });

    it('clear removes all listeners', () => {
      const bus = new EventBus();
      bus.on('test', () => {});
      bus.clear();
      assert.strictEqual(bus.listenerCount('test'), 0);
    });

    it('setDeadLetterQueue stores DLQ reference', () => {
      const bus = new EventBus();
      const dlq = { push: async () => {} };
      bus.setDeadLetterQueue(dlq);
      assert.ok(bus._deadLetterQueue);
    });
  });

  describe('EventStream', () => {
    const EventBus = require('../../lib/events/eventBus');
    const EventStream = require('../../lib/events/eventStream');

    it('subscribes and receives events', (done) => {
      const bus = new EventBus();
      const stream = new EventStream(bus);
      stream.start();
      stream.subscribe({ type: 'test.event' }, (event) => {
        assert.strictEqual(event.type, 'test.event');
        stream.stop();
        done();
      });
      bus.emit('test.event', {});
    });

    it('unsubscribe removes subscriber', () => {
      const bus = new EventBus();
      const stream = new EventStream(bus);
      const id = stream.subscribe({}, () => {});
      stream.unsubscribe(id);
      assert.strictEqual(stream.subscriberCount(), 0);
    });

    it('filters by source', (done) => {
      const bus = new EventBus();
      const stream = new EventStream(bus);
      stream.start();
      stream.subscribe({ source: 'api' }, (event) => {
        assert.strictEqual(event.source, 'api');
        stream.stop();
        done();
      });
      bus.emit('test', {}, { source: 'api' });
    });

    it('filters by typePattern', (done) => {
      const bus = new EventBus();
      const stream = new EventStream(bus);
      stream.start();
      stream.subscribe({ typePattern: 'workflow.*' }, (event) => {
        assert.ok(event.type.startsWith('workflow.'));
        stream.stop();
        done();
      });
      bus.emit('workflow.completed', {});
    });

    it('getBuffer returns recent events', async () => {
      const bus = new EventBus();
      const stream = new EventStream(bus);
      stream.start();
      await bus.emit('test', {});
      assert.ok(stream.getBuffer().length >= 1);
      stream.stop();
    });

    it('start/stop controls streaming', () => {
      const bus = new EventBus();
      const stream = new EventStream(bus);
      stream.start();
      assert.ok(stream.isRunning());
      stream.stop();
      assert.ok(!stream.isRunning());
    });

    it('clearBuffers empties buffers', async () => {
      const bus = new EventBus();
      const stream = new EventStream(bus);
      stream.start();
      await bus.emit('test', {});
      stream.clearBuffers();
      assert.strictEqual(stream.getBuffer().length, 0);
      stream.stop();
    });
  });

  describe('EventReplayEngine', () => {
    const EventStore = require('../../lib/events/eventStore');
    const EventBus = require('../../lib/events/eventBus');
    const EventReplayEngine = require('../../lib/events/eventReplayEngine');

    it('replays events by filter', async () => {
      const store = new EventStore();
      await store.append({ id: 'e-1', type: 'test', timestamp: 100, source: 't', payload: { x: 1 }, correlationId: 'c-1' });
      await store.append({ id: 'e-2', type: 'test', timestamp: 200, source: 't', payload: { x: 2 }, correlationId: 'c-1' });
      const bus = new EventBus();
      const replay = new EventReplayEngine(store, bus);
      const result = await replay.replayByFilter({ correlationId: 'c-1' }, { dryRun: true });
      assert.strictEqual(result.total, 2);
    });

    it('replays by correlationId', async () => {
      const store = new EventStore();
      await store.append({ id: 'e-1', type: 'test', timestamp: 100, source: 't', payload: {}, correlationId: 'c-1' });
      const bus = new EventBus();
      const replay = new EventReplayEngine(store, bus);
      const result = await replay.replayByCorrelationId('c-1', { dryRun: true });
      assert.strictEqual(result.total, 1);
    });

    it('replays by type', async () => {
      const store = new EventStore();
      await store.append({ id: 'e-1', type: 'workflow.started', timestamp: 100, source: 't', payload: {} });
      const bus = new EventBus();
      const replay = new EventReplayEngine(store, bus);
      const result = await replay.replayByType('workflow.started', { dryRun: true });
      assert.strictEqual(result.total, 1);
    });

    it('replays by time range', async () => {
      const store = new EventStore();
      await store.append({ id: 'e-1', type: 'test', timestamp: 100, source: 't', payload: {} });
      await store.append({ id: 'e-2', type: 'test', timestamp: 300, source: 't', payload: {} });
      const bus = new EventBus();
      const replay = new EventReplayEngine(store, bus);
      const result = await replay.replayByTimeRange(50, 200, { dryRun: true });
      assert.strictEqual(result.total, 1);
    });

    it('snapshotState saves and restores', async () => {
      const store = new EventStore();
      await store.append({ id: 'e-1', type: 'workflow.completed', timestamp: 100, source: 't', payload: { workflowId: 'wf-1' } });
      const replay = new EventReplayEngine(store, null);
      const snapId = await replay.snapshotState('snap-1', {});
      const state = await replay.restoreFromSnapshot('snap-1');
      assert.ok(state.workflows['wf-1']);
    });

    it('timeTravel iterates events with state', async () => {
      const store = new EventStore();
      await store.append({ id: 'e-1', type: 'api.request', timestamp: 100, source: 't', payload: { path: '/test' } });
      const replay = new EventReplayEngine(store, null);
      let count = 0;
      const state = await replay.timeTravel(50, 200, (event, st) => { count++; });
      assert.strictEqual(count, 1);
      assert.ok(state.lastCompleted);
    });

    it('getActiveReplays returns in-progress replays', async () => {
      const store = new EventStore();
      const replay = new EventReplayEngine(store, null);
      replay._replaysInProgress.add('test-replay');
      assert.ok(replay.getActiveReplays().includes('test-replay'));
    });

    it('listSnapshots returns snapshot metadata', async () => {
      const store = new EventStore();
      const replay = new EventReplayEngine(store, null);
      await replay.snapshotState('snap-1', {});
      const list = replay.listSnapshots();
      assert.strictEqual(list.length, 1);
      assert.strictEqual(list[0].id, 'snap-1');
    });
  });

  describe('EventRouter', () => {
    const EventBus = require('../../lib/events/eventBus');
    const EventRouter = require('../../lib/events/eventRouter');

    it('adds and triggers route', (done) => {
      const bus = new EventBus();
      const router = new EventRouter(bus);
      router.addRoute('test.event', (event) => {
        assert.strictEqual(event.type, 'test.event');
        done();
      });
      bus.emit('test.event', {});
    });

    it('removes route', () => {
      const bus = new EventBus();
      const router = new EventRouter(bus);
      const id = router.addRoute('test', () => {});
      assert.ok(router.removeRoute(id));
      assert.strictEqual(router.routeCount(), 0);
    });

    it('matches wildcard patterns', (done) => {
      const bus = new EventBus();
      const router = new EventRouter(bus);
      router.addRoute('workflow.*', (event) => {
        assert.strictEqual(event.type, 'workflow.started');
        done();
      });
      bus.emit('workflow.started', {});
    });

    it('addSubsystemRoute routes between event types', (done) => {
      const bus = new EventBus();
      const router = new EventRouter(bus);
      bus.on('target.event', (event) => {
        assert.strictEqual(event.type, 'target.event');
        done();
      });
      router.addSubsystemRoute('source.event', 'target.event');
      bus.emit('source.event', { data: 1 });
    });

    it('listRoutes returns all routes', () => {
      const bus = new EventBus();
      const router = new EventRouter(bus);
      router.addRoute('test', () => {});
      assert.strictEqual(router.listRoutes().length, 1);
    });

    it('clearRoutes removes all', () => {
      const bus = new EventBus();
      const router = new EventRouter(bus);
      router.addRoute('test', () => {});
      router.clearRoutes();
      assert.strictEqual(router.routeCount(), 0);
    });
  });

  describe('EventSubscriptions', () => {
    const EventBus = require('../../lib/events/eventBus');
    const EventSubscriptions = require('../../lib/events/eventSubscriptions');

    it('subscribes and unsubscribes a subscriber', () => {
      const bus = new EventBus();
      const subs = new EventSubscriptions(bus);
      subs.subscribe('user-1', 'test', () => {});
      assert.strictEqual(subs.subscriberCount(), 1);
      subs.unsubscribe('user-1', 'test');
      assert.strictEqual(subs.subscriptionCount(), 0);
    });

    it('unsubscribeAll removes all subscriptions', () => {
      const bus = new EventBus();
      const subs = new EventSubscriptions(bus);
      subs.subscribe('user-1', 'a', () => {});
      subs.subscribe('user-1', 'b', () => {});
      subs.unsubscribeAll('user-1');
      assert.strictEqual(subs.subscriberCount(), 0);
    });

    it('getSubscriptions returns list', () => {
      const bus = new EventBus();
      const subs = new EventSubscriptions(bus);
      subs.subscribe('user-1', 'test', () => {});
      assert.strictEqual(subs.getSubscriptions('user-1').length, 1);
    });

    it('listSubscribers returns all IDs', () => {
      const bus = new EventBus();
      const subs = new EventSubscriptions(bus);
      subs.subscribe('user-1', 'a', () => {});
      subs.subscribe('user-2', 'b', () => {});
      assert.ok(subs.listSubscribers().includes('user-1'));
    });

    it('clear removes all', () => {
      const bus = new EventBus();
      const subs = new EventSubscriptions(bus);
      subs.subscribe('user-1', 'a', () => {});
      subs.subscribe('user-2', 'b', () => {});
      subs.clear();
      assert.strictEqual(subs.subscriberCount(), 0);
    });
  });

  describe('EventFilters', () => {
    const EventFilters = require('../../lib/events/eventFilters');

    it('registers and applies filters', () => {
      const f = new EventFilters();
      f.register('highSeverity', (e) => e.severity === 'error');
      const result = f.apply({ severity: 'error' }, ['highSeverity']);
      assert.strictEqual(result.passed, true);
    });

    it('fails events that dont match filter', () => {
      const f = new EventFilters();
      f.register('highSeverity', (e) => e.severity === 'error');
      const result = f.apply({ severity: 'info' }, ['highSeverity']);
      assert.strictEqual(result.passed, false);
    });

    it('chain returns first failure', () => {
      const f = new EventFilters();
      f.register('isError', (e) => e.severity === 'error');
      f.register('isRecent', (e) => e.timestamp > 100);
      const result = f.chain({ severity: 'info', timestamp: 200 }, ['isError', 'isRecent']);
      assert.strictEqual(result.passed, false);
      assert.strictEqual(result.lastFilter, 'isError');
    });

    it('builtin returns all default filters', () => {
      const f = new EventFilters();
      const b = f.builtin();
      assert.ok(b.highSeverity);
      assert.ok(b.workflowOnly);
      assert.ok(b.agentOnly);
      assert.ok(b.clusterOnly);
      assert.ok(b.apiOnly);
      assert.ok(b.aiOnly);
      assert.ok(b.telemetryOnly);
      assert.ok(b.noReplay);
      assert.ok(b.hasCorrelationId);
      assert.ok(b.recentOnly);
    });

    it('list returns registered filter names', () => {
      const f = new EventFilters();
      f.register('custom', () => true);
      assert.ok(f.list().includes('custom'));
    });

    it('remove deletes filter', () => {
      const f = new EventFilters();
      f.register('test', () => true);
      f.remove('test');
      assert.ok(!f.list().includes('test'));
    });
  });

  describe('EventCorrelator', () => {
    const EventBus = require('../../lib/events/eventBus');
    const EventCorrelator = require('../../lib/events/eventCorrelator');

    it('starts and completes a trace', () => {
      const c = new EventCorrelator(new EventBus());
      c.startTrace('corr-1');
      c.completeTrace('corr-1');
      const trace = c.getTrace('corr-1');
      assert.strictEqual(trace.correlationId, 'corr-1');
      assert.ok(trace.completedAt);
    });

    it('tracks events across systems', async () => {
      const bus = new EventBus();
      const c = new EventCorrelator(bus);
      c.startTrace('corr-1');
      await c.track('corr-1', 'api.request', { path: '/test' }, { source: 'api' });
      await c.track('corr-1', 'workflow.started', { id: 'wf-1' }, { source: 'workflow' });
      const trace = c.getTrace('corr-1');
      assert.strictEqual(trace.eventCount, 2);
    });

    it('startSpan creates child spans', () => {
      const c = new EventCorrelator(new EventBus());
      c.startTrace('corr-1');
      const span = c.startSpan('corr-1', 'ai.generate');
      assert.ok(span.spanId);
      c.endSpan('corr-1', span.spanId);
      const trace = c.getTrace('corr-1');
      assert.strictEqual(trace.spanCount, 1);
    });

    it('getTraceEvents returns event list', async () => {
      const bus = new EventBus();
      const c = new EventCorrelator(bus);
      c.startTrace('corr-1');
      await c.track('corr-1', 'test', {});
      assert.strictEqual(c.getTraceEvents('corr-1').length, 1);
    });

    it('query returns filtered traces', () => {
      const c = new EventCorrelator(new EventBus());
      c.startTrace('corr-1', {});
      c.startTrace('corr-2', {});
      const results = c.query({ limit: 1 });
      assert.strictEqual(results.length, 1);
    });

    it('getActiveTraceCount returns running traces', () => {
      const c = new EventCorrelator(new EventBus());
      c.startTrace('corr-1');
      c.startTrace('corr-2');
      c.completeTrace('corr-1');
      assert.strictEqual(c.getActiveTraceCount(), 1);
    });

    it('clear removes all traces', () => {
      const c = new EventCorrelator(new EventBus());
      c.startTrace('corr-1');
      c.clear();
      assert.strictEqual(c.getTotalTraceCount(), 0);
    });
  });

  describe('EventBackpressure', () => {
    const { EventBackpressure } = require('../../lib/events');

    it('accepts events under limit', async () => {
      const bp = new EventBackpressure({ maxQueueSize: 10, maxRatePerSecond: 10000 });
      const result = await bp.push({ type: 'test' });
      assert.strictEqual(result.accepted, true);
    });

    it('drops events when overloaded with drop strategy', async () => {
      const bp = new EventBackpressure({ maxQueueSize: 100, maxRatePerSecond: 0, strategy: 'buffer' });
      await bp.push({ type: 'test' });
      bp.setStrategy('drop');
      const result = await bp.push({ type: 'test2' });
      assert.strictEqual(result.accepted, false);
      assert.strictEqual(bp.getDroppedCount(), 1);
    });

    it('buffers events when overloaded', async () => {
      const bp = new EventBackpressure({ maxQueueSize: 100, maxRatePerSecond: 0, strategy: 'buffer' });
      await bp.push({ type: 'test' });
      assert.ok(bp.getQueueSize() > 0);
    });

    it('processes buffered events', async () => {
      const bp = new EventBackpressure({ maxQueueSize: 100, maxRatePerSecond: 0, strategy: 'buffer' });
      await bp.push({ type: 'test' });
      bp.setMaxRatePerSecond(10000);
      const results = await bp.process((e) => {});
      assert.ok(results.length > 0);
    });

    it('setStrategy changes strategy', () => {
      const bp = new EventBackpressure({ strategy: 'buffer' });
      bp.setStrategy('drop');
      assert.strictEqual(bp.getStrategy(), 'drop');
    });

    it('getStatus returns state', () => {
      const bp = new EventBackpressure();
      const s = bp.getStatus();
      assert.ok(s.strategy);
      assert.ok(s.queueSize !== undefined);
    });

    it('reset clears state', () => {
      const bp = new EventBackpressure({ maxQueueSize: 1, maxRatePerSecond: 0, strategy: 'drop' });
      bp.push({ type: 'test' });
      bp.reset();
      assert.strictEqual(bp.getDroppedCount(), 0);
    });
  });

  describe('EventMetrics', () => {
    const EventMetrics = require('../../lib/events/eventMetrics');

    it('increments counters', () => {
      const m = new EventMetrics();
      m.incrementCounter('events.emitted');
      assert.strictEqual(m.getCounter('events.emitted'), 1);
    });

    it('records gauges', () => {
      const m = new EventMetrics();
      m.recordGauge('queue.depth', 42);
      assert.strictEqual(m.getGauge('queue.depth'), 42);
    });

    it('records histograms', () => {
      const m = new EventMetrics();
      m.recordHistogram('event.latency', 100);
      m.recordHistogram('event.latency', 200);
      const h = m.getHistogram('event.latency');
      assert.strictEqual(h.count, 2);
    });

    it('records throughput', () => {
      const m = new EventMetrics();
      m.recordThroughput(5);
      assert.ok(m.getThroughput(60000) >= 5);
    });

    it('getAllMetrics returns snapshot', () => {
      const m = new EventMetrics();
      m.incrementCounter('events', 10);
      const all = m.getAllMetrics();
      assert.ok(all.counters);
    });

    it('reset clears all data', () => {
      const m = new EventMetrics();
      m.incrementCounter('test', 5);
      m.reset();
      assert.strictEqual(m.getCounter('test'), 0);
    });
  });

  describe('EventDeadLetterQueue', () => {
    const EventDeadLetterQueue = require('../../lib/events/eventDeadLetterQueue');
    const EventBus = require('../../lib/events/eventBus');

    it('pushes failed events', async () => {
      const dlq = new EventDeadLetterQueue();
      const entry = await dlq.push({ type: 'failed.event', payload: {} }, ['Validation failed']);
      assert.ok(entry.errors.includes('Validation failed'));
    });

    it('retries an event', async () => {
      const bus = new EventBus();
      const dlq = new EventDeadLetterQueue();
      await dlq.push({ type: 'test', payload: {} });
      let emitted = false;
      bus.on('test', () => { emitted = true; });
      await dlq.retry(0, bus);
      assert.strictEqual(emitted, true);
    });

    it('retryAll retries all events', async () => {
      const dlq = new EventDeadLetterQueue();
      await dlq.push({ type: 'test', payload: {} });
      await dlq.push({ type: 'test', payload: {} });
      const results = await dlq.retryAll(null);
      assert.strictEqual(results.length, 2);
    });

    it('remove deletes entry', async () => {
      const dlq = new EventDeadLetterQueue();
      await dlq.push({ type: 'test', payload: {} });
      await dlq.remove(0);
      assert.strictEqual(dlq.count(), 0);
    });

    it('list returns entries with index', async () => {
      const dlq = new EventDeadLetterQueue();
      await dlq.push({ type: 'test', payload: {} });
      const list = dlq.list();
      assert.strictEqual(list.length, 1);
      assert.ok(list[0].index !== undefined);
    });

    it('getStats returns breakdown', async () => {
      const dlq = new EventDeadLetterQueue();
      await dlq.push({ type: 'test', payload: {} });
      const stats = dlq.getStats();
      assert.strictEqual(stats.total, 1);
      assert.ok(stats.byType.test);
    });

    it('clear removes all', async () => {
      const dlq = new EventDeadLetterQueue();
      await dlq.push({ type: 'test', payload: {} });
      await dlq.clear();
      assert.strictEqual(dlq.count(), 0);
    });
  });

  describe('EventVersioning', () => {
    const EventVersioning = require('../../lib/events/eventVersioning');

    it('registers versions', () => {
      const v = new EventVersioning();
      v.registerVersion('test.event', 1, { properties: { name: { type: 'string' } } });
      assert.ok(v.hasVersion('test.event', 1));
    });

    it('getVersion returns schema for specific version', () => {
      const v = new EventVersioning();
      v.registerVersion('test.event', 1, { schema: true });
      const schema = v.getVersion('test.event', 1);
      assert.ok(schema);
    });

    it('getLatestVersion returns highest version', () => {
      const v = new EventVersioning();
      v.registerVersion('test.event', 1, {});
      v.registerVersion('test.event', 2, {});
      const latest = v.getLatestVersion('test.event');
      assert.strictEqual(latest.version, 2);
    });

    it('registerMigration and migrate', async () => {
      const v = new EventVersioning();
      v.registerVersion('test.event', 1, { props: { name: { type: 'string' } } });
      v.registerVersion('test.event', 2, { props: { fullName: { type: 'string' } } });
      v.registerMigration('test.event', 1, 2, async (event) => {
        return { ...event, payload: { fullName: event.payload.name }, version: 2 };
      });
      const migrated = await v.migrate({ type: 'test.event', version: 1, payload: { name: 'John' } }, 2);
      assert.strictEqual(migrated.version, 2);
      assert.strictEqual(migrated.payload.fullName, 'John');
    });

    it('listVersions returns sorted list', () => {
      const v = new EventVersioning();
      v.registerVersion('test.event', 3, {});
      v.registerVersion('test.event', 1, {});
      const versions = v.listVersions('test.event');
      assert.deepStrictEqual(versions, [1, 3]);
    });

    it('listEventTypes returns registered types', () => {
      const v = new EventVersioning();
      v.registerVersion('type-a', 1, {});
      v.registerVersion('type-b', 1, {});
      const types = v.listEventTypes();
      assert.ok(types.includes('type-a'));
    });

    it('throws for no migration path', async () => {
      const v = new EventVersioning();
      v.registerVersion('test.event', 1, {});
      v.registerVersion('test.event', 5, {});
      await assert.rejects(() => v.migrate({ type: 'test.event', version: 1 }, 5), /No migration path/);
    });
  });

  describe('Entry Point (index.js)', () => {
    const events = require('../../lib/events');

    it('exports emit', () => { assert.strictEqual(typeof events.emit, 'function'); });
    it('exports emitSync', () => { assert.strictEqual(typeof events.emitSync, 'function'); });
    it('exports on', () => { assert.strictEqual(typeof events.on, 'function'); });
    it('exports getEventBus', () => { assert.strictEqual(typeof events.getEventBus, 'function'); });
    it('exports getEventStore', () => { assert.strictEqual(typeof events.getEventStore, 'function'); });
    it('exports getEventStream', () => { assert.strictEqual(typeof events.getEventStream, 'function'); });
    it('exports getReplayEngine', () => { assert.strictEqual(typeof events.getReplayEngine, 'function'); });
    it('exports getCorrelator', () => { assert.strictEqual(typeof events.getCorrelator, 'function'); });
    it('exports getRouter', () => { assert.strictEqual(typeof events.getRouter, 'function'); });
    it('exports getSubscriptions', () => { assert.strictEqual(typeof events.getSubscriptions, 'function'); });
    it('exports getFilters', () => { assert.strictEqual(typeof events.getFilters, 'function'); });
    it('exports getMetrics', () => { assert.strictEqual(typeof events.getMetrics, 'function'); });
    it('exports getDeadLetterQueue', () => { assert.strictEqual(typeof events.getDeadLetterQueue, 'function'); });
    it('exports getVersioning', () => { assert.strictEqual(typeof events.getVersioning, 'function'); });
    it('exports getSchemaRegistry', () => { assert.strictEqual(typeof events.getSchemaRegistry, 'function'); });
    it('exports getBackpressure', () => { assert.strictEqual(typeof events.getBackpressure, 'function'); });
    it('exports createEventBus', () => { assert.strictEqual(typeof events.createEventBus, 'function'); });
    it('exports all classes', () => {
      assert.strictEqual(typeof events.EventBus, 'function');
      assert.strictEqual(typeof events.EventStream, 'function');
      assert.strictEqual(typeof events.EventStore, 'function');
      assert.strictEqual(typeof events.EventReplayEngine, 'function');
      assert.strictEqual(typeof events.EventSerializer, 'function');
      assert.strictEqual(typeof events.EventSchemaRegistry, 'function');
      assert.strictEqual(typeof events.EventRouter, 'function');
      assert.strictEqual(typeof events.EventSubscriptions, 'function');
      assert.strictEqual(typeof events.EventFilters, 'function');
      assert.strictEqual(typeof events.EventCorrelator, 'function');
      assert.strictEqual(typeof events.EventBackpressure, 'function');
      assert.strictEqual(typeof events.EventMetrics, 'function');
      assert.strictEqual(typeof events.EventDeadLetterQueue, 'function');
      assert.strictEqual(typeof events.EventVersioning, 'function');
    });
    it('exports constants', () => {
      assert.ok(Array.isArray(events.EVENT_SOURCES));
      assert.ok(Array.isArray(events.STRATEGIES));
    });

    it('emit works via singleton', async () => {
      let received = null;
      events.on('singleton.test', (e) => { received = e; });
      await events.emit('singleton.test', { msg: 'hello' }, { source: 'test' });
      assert.strictEqual(received.type, 'singleton.test');
      assert.strictEqual(received.payload.msg, 'hello');
    });
  });

  describe('Event Hooks', () => {
    const { installEventHooks, isInstalled, resetHooks } = require('../../lib/events/eventHooks');
    const { getEventBus } = require('../../lib/events');

    beforeEach(() => {
      resetHooks();
    });

    it('installEventHooks installs without errors', () => {
      const result = installEventHooks({ workflow: false, telemetry: false, cluster: false, ai: false, agent: false });
      assert.ok(result.bus);
      assert.ok(isInstalled());
    });

    it('isInstalled returns false before install', () => {
      assert.ok(!isInstalled());
    });

    it('emits system.events.installed on setup', (done) => {
      const bus = getEventBus();
      const off = bus.on('system.events.installed', (event) => {
        off();
        assert.strictEqual(event.type, 'system.events.installed');
        done();
      });
      installEventHooks({ workflow: false, telemetry: false, cluster: false, ai: false, agent: false });
    });

    it('is idempotent - second install is noop', () => {
      installEventHooks({ workflow: false, telemetry: false, cluster: false, ai: false, agent: false });
      const firstUnsubs = installEventHooks().unsubs;
      assert.strictEqual(firstUnsubs.length, 0);
    });
  });

  describe('Cross-System Correlation Integration', () => {
    const EventBus = require('../../lib/events/eventBus');
    const EventCorrelator = require('../../lib/events/eventCorrelator');
    const EventStore = require('../../lib/events/eventStore');
    const EventReplayEngine = require('../../lib/events/eventReplayEngine');

    it('full lifecycle: API → Workflow → AI → Completion', async () => {
      const bus = new EventBus();
      const store = new EventStore();
      const correlator = new EventCorrelator(bus);
      const replay = new EventReplayEngine(store, bus);

      bus.getStore = () => store;
      const origEmit = bus.emit.bind(bus);
      bus.emit = async (type, payload, options) => {
        const event = await origEmit(type, payload, options);
        await store.append(event);
        return event;
      };

      const correlationId = 'lifecycle-test-1';
      correlator.startTrace(correlationId);

      await correlator.track(correlationId, 'api.request', { method: 'POST', path: '/api/v1/workflows' }, { source: 'api' });
      await correlator.track(correlationId, 'workflow.started', { workflowId: 'wf-1' }, { source: 'workflow' });
      await correlator.track(correlationId, 'ai.generate.started', { model: 'gpt-4' }, { source: 'ai' });
      await correlator.track(correlationId, 'ai.generate.completed', { model: 'gpt-4', latency: 250 }, { source: 'ai' });
      await correlator.track(correlationId, 'workflow.completed', { workflowId: 'wf-1' }, { source: 'workflow' });
      correlator.completeTrace(correlationId);

      const trace = correlator.getTrace(correlationId);
      assert.strictEqual(trace.eventCount, 5);
      assert.ok(trace.completedAt);

      const storedEvents = await store.query({ correlationId });
      assert.strictEqual(storedEvents.length, 5);

      const replayResult = await replay.replayByCorrelationId(correlationId, { dryRun: true });
      assert.strictEqual(replayResult.total, 5);
    });

    it('distributed span tree across systems', () => {
      const correlator = new EventCorrelator(new EventBus());
      const traceId = 'span-tree-test';

      correlator.startTrace(traceId);
      const rootSpan = correlator.startSpan(traceId, 'api.handler', { metadata: { path: '/deploy' } });
      const wfSpan = correlator.startSpan(traceId, 'workflow.execute', { parentSpanId: rootSpan.spanId });
      const aiSpan = correlator.startSpan(traceId, 'ai.generate', { parentSpanId: wfSpan.spanId });
      correlator.endSpan(traceId, aiSpan.spanId);
      correlator.endSpan(traceId, wfSpan.spanId);
      correlator.endSpan(traceId, rootSpan.spanId);
      correlator.completeTrace(traceId);

      const trace = correlator.getTrace(traceId);
      assert.strictEqual(trace.spanCount, 3);
      assert.ok(trace.duration >= 0);
    });
  });
});
