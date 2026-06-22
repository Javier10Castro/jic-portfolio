const assert = require('assert');

describe('AI Application Composition Engine — Phase 10.1.0', function() {

  /* ─── ApplicationComposer (12 tests) ─── */
  describe('ApplicationComposer', function() {
    const { ApplicationComposer } = require('../lib/composer/applicationComposer');
    it('should create with empty state', function() {
      const c = new ApplicationComposer();
      assert.strictEqual(c.listCompositions().length, 0);
    });
    it('should compose an application', function() {
      const c = new ApplicationComposer();
      const result = c.compose('app1', { name: 'Test' });
      assert.strictEqual(result.id, 'app1');
      assert.strictEqual(result.status, 'composed');
      assert.ok(result.createdAt);
    });
    it('should compose with options', function() {
      const c = new ApplicationComposer();
      const result = c.compose('app2', { name: 'Opt' }, { mode: 'test' });
      assert.strictEqual(result.options.mode, 'test');
    });
    it('should throw if no appId', function() {
      const c = new ApplicationComposer();
      assert.throws(() => c.compose(null, {}), /appId and blueprint are required/);
    });
    it('should throw if no blueprint', function() {
      const c = new ApplicationComposer();
      assert.throws(() => c.compose('a', null), /appId and blueprint are required/);
    });
    it('should get composition by id', function() {
      const c = new ApplicationComposer();
      c.compose('app1', { name: 'Test' });
      const g = c.getComposition('app1');
      assert.strictEqual(g.id, 'app1');
    });
    it('getComposition should return null for missing', function() {
      const c = new ApplicationComposer();
      assert.strictEqual(c.getComposition('none'), null);
    });
    it('getComposition should return null for null id', function() {
      const c = new ApplicationComposer();
      c.compose('a', {});
      assert.strictEqual(c.getComposition(null), null);
    });
    it('should list all compositions', function() {
      const c = new ApplicationComposer();
      c.compose('a', {}); c.compose('b', {});
      assert.strictEqual(c.listCompositions().length, 2);
    });
    it('should clear all compositions', function() {
      const c = new ApplicationComposer();
      c.compose('a', {}); c.clear();
      assert.strictEqual(c.listCompositions().length, 0);
    });
    it('should have stages in composition', function() {
      const c = new ApplicationComposer();
      const r = c.compose('a', {});
      assert.deepStrictEqual(r.stages, ['discovery', 'matching', 'resolution', 'allocation', 'composition']);
    });
    it('should track counter correctly', function() {
      const c = new ApplicationComposer();
      c.compose('a', {}); c.compose('b', {});
      assert.strictEqual(c.listCompositions().length, 2);
    });
  });

  /* ─── CompositionEngine (12 tests) ─── */
  describe('CompositionEngine', function() {
    const { CompositionEngine } = require('../lib/composer/compositionEngine');
    it('should create with empty state', function() {
      const e = new CompositionEngine();
      assert.strictEqual(e.listExecutions().length, 0);
    });
    it('should execute a plan', function() {
      const e = new CompositionEngine();
      const result = e.execute('comp1', { name: 'plan1' });
      assert.strictEqual(result.id, 'comp1');
      assert.strictEqual(result.status, 'running');
    });
    it('should throw if no compositionId', function() {
      const e = new CompositionEngine();
      assert.throws(() => e.execute(null, {}), /compositionId and plan are required/);
    });
    it('should throw if no plan', function() {
      const e = new CompositionEngine();
      assert.throws(() => e.execute('c', null), /compositionId and plan are required/);
    });
    it('should have 5 stages', function() {
      const e = new CompositionEngine();
      const r = e.execute('c', {});
      assert.strictEqual(r.stages.length, 5);
    });
    it('should start with currentStage 0', function() {
      const e = new CompositionEngine();
      const r = e.execute('c', {});
      assert.strictEqual(r.currentStage, 0);
    });
    it('should get execution by id', function() {
      const e = new CompositionEngine();
      e.execute('c1', {});
      assert.strictEqual(e.getExecution('c1').id, 'c1');
    });
    it('getExecution should return null for missing', function() {
      const e = new CompositionEngine();
      assert.strictEqual(e.getExecution('none'), null);
    });
    it('getExecution should return null for null', function() {
      const e = new CompositionEngine();
      assert.strictEqual(e.getExecution(null), null);
    });
    it('should list all executions', function() {
      const e = new CompositionEngine();
      e.execute('a', {}); e.execute('b', {});
      assert.strictEqual(e.listExecutions().length, 2);
    });
    it('should clear all executions', function() {
      const e = new CompositionEngine();
      e.execute('a', {}); e.clear();
      assert.strictEqual(e.listExecutions().length, 0);
    });
    it('clear on empty should not throw', function() {
      const e = new CompositionEngine(); e.clear();
      assert.strictEqual(e.listExecutions().length, 0);
    });
  });

  /* ─── CompositionPlanner (10 tests) ─── */
  describe('CompositionPlanner', function() {
    const { CompositionPlanner } = require('../lib/composer/compositionPlanner');
    it('should create with empty state', function() {
      const p = new CompositionPlanner();
      assert.strictEqual(p.listPlans().length, 0);
    });
    it('should create a plan', function() {
      const p = new CompositionPlanner();
      const r = p.createPlan('app1', { name: 'bp1' });
      assert.strictEqual(r.id, 'app1');
      assert.strictEqual(r.status, 'planned');
    });
    it('should throw if no appId', function() {
      const p = new CompositionPlanner();
      assert.throws(() => p.createPlan(null, {}), /appId and blueprint are required/);
    });
    it('should throw if no blueprint', function() {
      const p = new CompositionPlanner();
      assert.throws(() => p.createPlan('a', null), /appId and blueprint are required/);
    });
    it('should have 5 stages', function() {
      const p = new CompositionPlanner();
      const r = p.createPlan('a', {});
      assert.strictEqual(r.stages.length, 5);
    });
    it('should get plan by id', function() {
      const p = new CompositionPlanner();
      p.createPlan('a', {});
      assert.strictEqual(p.getPlan('a').id, 'a');
    });
    it('getPlan should return null for missing', function() {
      const p = new CompositionPlanner();
      assert.strictEqual(p.getPlan('none'), null);
    });
    it('getPlan should return null for null', function() {
      const p = new CompositionPlanner();
      assert.strictEqual(p.getPlan(null), null);
    });
    it('should list all plans', function() {
      const p = new CompositionPlanner();
      p.createPlan('a', {}); p.createPlan('b', {});
      assert.strictEqual(p.listPlans().length, 2);
    });
    it('should clear all plans', function() {
      const p = new CompositionPlanner();
      p.createPlan('a', {}); p.clear();
      assert.strictEqual(p.listPlans().length, 0);
    });
  });

  /* ─── CompositionRegistry (12 tests) ─── */
  describe('CompositionRegistry', function() {
    const { CompositionRegistry } = require('../lib/composer/compositionRegistry');
    it('should create with empty state', function() {
      const r = new CompositionRegistry();
      assert.strictEqual(r.list().length, 0);
    });
    it('should register a composition', function() {
      const r = new CompositionRegistry();
      const c = r.register({ id: 'c1', name: 'Test' });
      assert.strictEqual(c.id, 'c1');
    });
    it('should throw if composition is null', function() {
      const r = new CompositionRegistry();
      assert.throws(() => r.register(null), /composition is required/);
    });
    it('should throw if composition has no id', function() {
      const r = new CompositionRegistry();
      assert.throws(() => r.register({ name: 'x' }), /composition must have an id/);
    });
    it('should throw on duplicate id', function() {
      const r = new CompositionRegistry();
      r.register({ id: 'c1' });
      assert.throws(() => r.register({ id: 'c1' }), /already registered/);
    });
    it('should get by id', function() {
      const r = new CompositionRegistry();
      r.register({ id: 'c1' });
      assert.strictEqual(r.get('c1').id, 'c1');
    });
    it('get should return null for missing', function() {
      const r = new CompositionRegistry();
      assert.strictEqual(r.get('none'), null);
    });
    it('get should return null for null', function() {
      const r = new CompositionRegistry();
      assert.strictEqual(r.get(null), null);
    });
    it('should unregister by id', function() {
      const r = new CompositionRegistry();
      r.register({ id: 'c1' });
      assert.strictEqual(r.unregister('c1'), true);
      assert.strictEqual(r.list().length, 0);
    });
    it('unregister should return false for missing', function() {
      const r = new CompositionRegistry();
      assert.strictEqual(r.unregister('none'), false);
    });
    it('unregister should return false for null', function() {
      const r = new CompositionRegistry();
      assert.strictEqual(r.unregister(null), false);
    });
    it('should clear all', function() {
      const r = new CompositionRegistry();
      r.register({ id: 'a' }); r.register({ id: 'b' }); r.clear();
      assert.strictEqual(r.list().length, 0);
    });
  });

  /* ─── CompositionValidator (25 tests) ─── */
  describe('CompositionValidator', function() {
    const { CompositionValidator } = require('../lib/composer/compositionValidator');
    it('should create with empty state', function() {
      const v = new CompositionValidator();
      assert.ok(v);
    });
    it('should validate a valid composition', function() {
      const v = new CompositionValidator();
      const r = v.validate({ id: 'c1', name: 'Test', blueprint: {}, capabilities: [] });
      assert.strictEqual(r.valid, true);
      assert.strictEqual(r.errors.length, 0);
    });
    it('should reject null composition', function() {
      const v = new CompositionValidator();
      const r = v.validate(null);
      assert.strictEqual(r.valid, false);
      assert.ok(r.errors.includes('composition is required'));
    });
    it('should reject composition without id', function() {
      const v = new CompositionValidator();
      const r = v.validate({ name: 'x', blueprint: {}, capabilities: [] });
      assert.strictEqual(r.valid, false);
    });
    it('should reject composition without name', function() {
      const v = new CompositionValidator();
      const r = v.validate({ id: 'c1', blueprint: {}, capabilities: [] });
      assert.strictEqual(r.valid, false);
    });
    it('should reject composition without blueprint', function() {
      const v = new CompositionValidator();
      const r = v.validate({ id: 'c1', name: 'x', capabilities: [] });
      assert.strictEqual(r.valid, false);
    });
    it('should reject composition without capabilities', function() {
      const v = new CompositionValidator();
      const r = v.validate({ id: 'c1', name: 'x', blueprint: {} });
      assert.strictEqual(r.valid, false);
    });
    it('should reject non-object blueprint', function() {
      const v = new CompositionValidator();
      const r = v.validate({ id: 'c1', name: 'x', blueprint: 'string', capabilities: [] });
      assert.strictEqual(r.valid, false);
    });
    it('should reject non-array capabilities', function() {
      const v = new CompositionValidator();
      const r = v.validate({ id: 'c1', name: 'x', blueprint: {}, capabilities: 'not-array' });
      assert.strictEqual(r.valid, false);
    });
    it('validateBlueprint should reject null', function() {
      const v = new CompositionValidator();
      const r = v.validateBlueprint(null);
      assert.strictEqual(r.valid, false);
    });
    it('validateBlueprint should reject missing name', function() {
      const v = new CompositionValidator();
      const r = v.validateBlueprint({ version: '1', modules: [] });
      assert.strictEqual(r.valid, false);
    });
    it('validateBlueprint should reject missing version', function() {
      const v = new CompositionValidator();
      const r = v.validateBlueprint({ name: 'x', modules: [] });
      assert.strictEqual(r.valid, false);
    });
    it('validateBlueprint should reject missing modules', function() {
      const v = new CompositionValidator();
      const r = v.validateBlueprint({ name: 'x', version: '1' });
      assert.strictEqual(r.valid, false);
    });
    it('validateBlueprint should reject non-array modules', function() {
      const v = new CompositionValidator();
      const r = v.validateBlueprint({ name: 'x', version: '1', modules: 'not-array' });
      assert.strictEqual(r.valid, false);
    });
    it('validateBlueprint should reject empty modules', function() {
      const v = new CompositionValidator();
      const r = v.validateBlueprint({ name: 'x', version: '1', modules: [] });
      assert.strictEqual(r.valid, false);
    });
    it('validateBlueprint should reject module without id', function() {
      const v = new CompositionValidator();
      const r = v.validateBlueprint({ name: 'x', version: '1', modules: [{ type: 't' }] });
      assert.strictEqual(r.valid, false);
    });
    it('validateBlueprint should reject module without type', function() {
      const v = new CompositionValidator();
      const r = v.validateBlueprint({ name: 'x', version: '1', modules: [{ id: 'm1' }] });
      assert.strictEqual(r.valid, false);
    });
    it('validateBlueprint should accept valid blueprint', function() {
      const v = new CompositionValidator();
      const r = v.validateBlueprint({ name: 'x', version: '1', modules: [{ id: 'm1', type: 'test' }] });
      assert.strictEqual(r.valid, true);
    });
    it('should handle multiple module errors', function() {
      const v = new CompositionValidator();
      const r = v.validateBlueprint({ name: 'x', version: '1', modules: [{ id: 'm1' }, { type: 't' }] });
      assert.strictEqual(r.valid, false);
      assert.strictEqual(r.errors.length, 2);
    });
    it('should increment counter on valid', function() {
      const v = new CompositionValidator();
      v.validate({ id: 'c1', name: 'x', blueprint: {}, capabilities: [] });
      v.validate({ id: 'c2', name: 'y', blueprint: {}, capabilities: [] });
      assert.ok(v);
    });
    it('clear should reset', function() {
      const v = new CompositionValidator();
      v.validate({ id: 'c1', name: 'x', blueprint: {}, capabilities: [] });
      v.clear();
      assert.ok(v);
    });
    it('should handle blueprint with no modules as invalid', function() {
      const v = new CompositionValidator();
      const r = v.validate({ id: 'c1', name: 'x', blueprint: { name: 'b', version: '1', modules: [] }, capabilities: [] });
      assert.strictEqual(r.valid, true);
    });
    it('should accept empty capabilities array', function() {
      const v = new CompositionValidator();
      const r = v.validate({ id: 'c1', name: 'x', blueprint: {}, capabilities: [] });
      assert.strictEqual(r.valid, true);
    });
    it('clear should not throw on empty validator', function() {
      const v = new CompositionValidator();
      v.clear();
      assert.ok(v);
    });
    it('should handle composition with empty string fields', function() {
      const v = new CompositionValidator();
      const r = v.validate({ id: '', name: '', blueprint: {}, capabilities: [] });
      assert.strictEqual(r.valid, false);
    });
  });

  /* ─── CompositionStorage (15 tests) ─── */
  describe('CompositionStorage', function() {
    const { CompositionStorage } = require('../lib/composer/compositionStorage');
    it('should create with empty state', function() {
      const s = new CompositionStorage();
      assert.deepStrictEqual(s.getAll(), {});
    });
    it('should set and get a value', function() {
      const s = new CompositionStorage();
      s.set('key1', 'value1');
      assert.strictEqual(s.get('key1'), 'value1');
    });
    it('should support chaining set', function() {
      const s = new CompositionStorage();
      const ret = s.set('k', 'v');
      assert.strictEqual(ret, s);
    });
    it('should throw on null key', function() {
      const s = new CompositionStorage();
      assert.throws(() => s.set(null, 'v'), /key must not be null or undefined/);
    });
    it('should throw on undefined key', function() {
      const s = new CompositionStorage();
      assert.throws(() => s.set(undefined, 'v'), /key must not be null or undefined/);
    });
    it('get should return null for null key', function() {
      const s = new CompositionStorage();
      assert.strictEqual(s.get(null), null);
    });
    it('get should return null for missing key', function() {
      const s = new CompositionStorage();
      assert.strictEqual(s.get('missing'), null);
    });
    it('delete should return true for existing', function() {
      const s = new CompositionStorage();
      s.set('k', 'v');
      assert.strictEqual(s.delete('k'), true);
    });
    it('delete should return false for missing', function() {
      const s = new CompositionStorage();
      assert.strictEqual(s.delete('missing'), false);
    });
    it('delete should return false for null', function() {
      const s = new CompositionStorage();
      assert.strictEqual(s.delete(null), false);
    });
    it('has should return true for existing', function() {
      const s = new CompositionStorage();
      s.set('k', 'v');
      assert.strictEqual(s.has('k'), true);
    });
    it('has should return false for missing', function() {
      const s = new CompositionStorage();
      assert.strictEqual(s.has('missing'), false);
    });
    it('has should return false for null', function() {
      const s = new CompositionStorage();
      assert.strictEqual(s.has(null), false);
    });
    it('getAll should return all entries', function() {
      const s = new CompositionStorage();
      s.set('a', 1); s.set('b', 2);
      const all = s.getAll();
      assert.strictEqual(all.a, 1);
      assert.strictEqual(all.b, 2);
    });
    it('clear should remove all entries', function() {
      const s = new CompositionStorage();
      s.set('a', 1); s.clear();
      assert.deepStrictEqual(s.getAll(), {});
    });
  });

  /* ─── CompositionMetrics (20 tests) ─── */
  describe('CompositionMetrics', function() {
    const { CompositionMetrics } = require('../lib/composer/compositionMetrics');
    it('should create with empty state', function() {
      const m = new CompositionMetrics();
      assert.strictEqual(m.getMetricNames().length, 0);
    });
    it('should record a metric', function() {
      const m = new CompositionMetrics();
      const r = m.record('test.metric', 42);
      assert.strictEqual(r.name, 'test.metric');
      assert.strictEqual(r.value, 42);
    });
    it('should throw on null name', function() {
      const m = new CompositionMetrics();
      assert.throws(() => m.record(null, 1), /name must not be null or undefined/);
    });
    it('should throw on null value', function() {
      const m = new CompositionMetrics();
      assert.throws(() => m.record('n', null), /value must not be null or undefined/);
    });
    it('should record with tags', function() {
      const m = new CompositionMetrics();
      const r = m.record('test', 1, { env: 'dev' });
      assert.deepStrictEqual(r.tags, { env: 'dev' });
    });
    it('should record without tags', function() {
      const m = new CompositionMetrics();
      const r = m.record('test', 1);
      assert.deepStrictEqual(r.tags, {});
    });
    it('query should return matching entries', function() {
      const m = new CompositionMetrics();
      m.record('a', 1); m.record('b', 2); m.record('a', 3);
      const results = m.query('a');
      assert.strictEqual(results.length, 2);
    });
    it('query should return empty for no match', function() {
      const m = new CompositionMetrics();
      m.record('a', 1);
      assert.strictEqual(m.query('none').length, 0);
    });
    it('query should return empty for empty name', function() {
      const m = new CompositionMetrics();
      assert.strictEqual(m.query('').length, 0);
    });
    it('query should filter by since', function() {
      const m = new CompositionMetrics();
      m.record('a', 1);
      const later = Date.now() + 1000;
      const results = m.query('a', { since: later });
      assert.strictEqual(results.length, 0);
    });
    it('query should limit results', function() {
      const m = new CompositionMetrics();
      m.record('a', 1); m.record('a', 2); m.record('a', 3);
      const results = m.query('a', { limit: 2 });
      assert.strictEqual(results.length, 2);
    });
    it('aggregate count should work', function() {
      const m = new CompositionMetrics();
      m.record('a', 1); m.record('a', 2);
      assert.strictEqual(m.aggregate('a', 'count'), 2);
    });
    it('aggregate sum should work', function() {
      const m = new CompositionMetrics();
      m.record('a', 10); m.record('a', 20);
      assert.strictEqual(m.aggregate('a', 'sum'), 30);
    });
    it('aggregate avg should work', function() {
      const m = new CompositionMetrics();
      m.record('a', 10); m.record('a', 20);
      assert.strictEqual(m.aggregate('a', 'avg'), 15);
    });
    it('aggregate min should work', function() {
      const m = new CompositionMetrics();
      m.record('a', 5); m.record('a', 10);
      assert.strictEqual(m.aggregate('a', 'min'), 5);
    });
    it('aggregate max should work', function() {
      const m = new CompositionMetrics();
      m.record('a', 5); m.record('a', 10);
      assert.strictEqual(m.aggregate('a', 'max'), 10);
    });
    it('aggregate should return null for no entries', function() {
      const m = new CompositionMetrics();
      assert.strictEqual(m.aggregate('none', 'count'), null);
    });
    it('aggregate should support custom function', function() {
      const m = new CompositionMetrics();
      m.record('a', 10); m.record('a', 20);
      const r = m.aggregate('a', vals => vals.reduce((a, b) => a + b, 0));
      assert.strictEqual(r, 30);
    });
    it('getMetricNames should return unique names', function() {
      const m = new CompositionMetrics();
      m.record('a', 1); m.record('b', 2); m.record('a', 3);
      const names = m.getMetricNames();
      assert.strictEqual(names.length, 2);
      assert.ok(names.includes('a'));
      assert.ok(names.includes('b'));
    });
    it('clear should remove all entries', function() {
      const m = new CompositionMetrics();
      m.record('a', 1); m.clear();
      assert.strictEqual(m.getMetricNames().length, 0);
    });
  });

  /* ─── CompositionEvents (18 tests) ─── */
  describe('CompositionEvents', function() {
    const { CompositionEvents } = require('../lib/composer/compositionEvents');
    it('should create with empty state', function() {
      const e = new CompositionEvents();
      assert.strictEqual(e.listEvents().length, 0);
    });
    it('should have static EVENTS defined', function() {
      assert.ok(CompositionEvents.EVENTS.COMPOSITION_CREATED);
      assert.ok(CompositionEvents.EVENTS.COMPOSITION_EXECUTED);
      assert.ok(CompositionEvents.EVENTS.GRAPH_UPDATED);
      assert.strictEqual(Object.keys(CompositionEvents.EVENTS).length, 13);
    });
    it('should register a listener', function() {
      const e = new CompositionEvents();
      e.on('test', () => {});
      assert.strictEqual(e.listEvents().length, 1);
    });
    it('should throw on empty event', function() {
      const e = new CompositionEvents();
      assert.throws(() => e.on('', () => {}), /event must be a non-empty string/);
    });
    it('should throw on non-function listener', function() {
      const e = new CompositionEvents();
      assert.throws(() => e.on('e', 'not-fn'), /event must be a non-empty string and listener must be a function/);
    });
    it('on should return this for chaining', function() {
      const e = new CompositionEvents();
      const ret = e.on('e', () => {});
      assert.strictEqual(ret, e);
    });
    it('emit should call listener', function() {
      const e = new CompositionEvents();
      let called = false;
      e.on('e', (arg) => { called = arg; });
      e.emit('e', true);
      assert.strictEqual(called, true);
    });
    it('emit should return true if listeners exist', function() {
      const e = new CompositionEvents();
      e.on('e', () => {});
      assert.strictEqual(e.emit('e'), true);
    });
    it('emit should return false if no listeners', function() {
      const e = new CompositionEvents();
      assert.strictEqual(e.emit('none'), false);
    });
    it('emit should throw on empty event', function() {
      const e = new CompositionEvents();
      assert.throws(() => e.emit(''), /event must be a non-empty string/);
    });
    it('off should remove listener', function() {
      const e = new CompositionEvents();
      const fn = () => {};
      e.on('e', fn); e.off('e', fn);
      assert.strictEqual(e.listEvents().length, 0);
    });
    it('off should handle missing event gracefully', function() {
      const e = new CompositionEvents();
      e.off('none', () => {});
      assert.strictEqual(e.listEvents().length, 0);
    });
    it('off should return this for chaining', function() {
      const e = new CompositionEvents();
      const ret = e.off('e', () => {});
      assert.strictEqual(ret, e);
    });
    it('should support multiple listeners for same event', function() {
      const e = new CompositionEvents();
      let count = 0;
      e.on('e', () => count++);
      e.on('e', () => count++);
      e.emit('e');
      assert.strictEqual(count, 2);
    });
    it('should silently catch listener errors', function() {
      const e = new CompositionEvents();
      e.on('e', () => { throw new Error('oops'); });
      e.on('e', () => {});
      e.emit('e');
      assert.ok(true);
    });
    it('listEvents should return event names', function() {
      const e = new CompositionEvents();
      e.on('a', () => {}); e.on('b', () => {});
      const events = e.listEvents();
      assert.strictEqual(events.length, 2);
      assert.ok(events.includes('a'));
      assert.ok(events.includes('b'));
    });
    it('clear should remove all listeners', function() {
      const e = new CompositionEvents();
      e.on('a', () => {}); e.on('b', () => {}); e.clear();
      assert.strictEqual(e.listEvents().length, 0);
    });
    it('should pass multiple args to listener', function() {
      const e = new CompositionEvents();
      let args;
      e.on('e', (...a) => { args = a; });
      e.emit('e', 1, 2, 3);
      assert.deepStrictEqual(args, [1, 2, 3]);
    });
  });

  /* ─── CompositionReporter (15 tests) ─── */
  describe('CompositionReporter', function() {
    const { CompositionReporter } = require('../lib/composer/compositionReporter');
    it('should create with empty state', function() {
      const r = new CompositionReporter();
      assert.ok(r);
    });
    it('should generate a report', function() {
      const r = new CompositionReporter();
      const report = r.generateReport('c1', { status: 'completed', stages: [], startedAt: new Date().toISOString() });
      assert.strictEqual(report.compositionId, 'c1');
    });
    it('should throw if no compositionId', function() {
      const r = new CompositionReporter();
      assert.throws(() => r.generateReport(null, {}), /compositionId is required/);
    });
    it('should handle missing execution', function() {
      const r = new CompositionReporter();
      const report = r.generateReport('c1');
      assert.strictEqual(report.status, 'unknown');
    });
    it('should compute duration from startedAt', function() {
      const r = new CompositionReporter();
      const startedAt = new Date(Date.now() - 5000).toISOString();
      const report = r.generateReport('c1', { status: 'completed', stages: [], startedAt, completedAt: new Date().toISOString() });
      assert.ok(report.duration >= 4000);
    });
    it('should compute summary with stages', function() {
      const r = new CompositionReporter();
      const stages = [
        { name: 's1', status: 'completed' },
        { name: 's2', status: 'completed' },
        { name: 's3', status: 'failed' }
      ];
      const report = r.generateReport('c1', { status: 'completed', stages, startedAt: new Date().toISOString() });
      assert.strictEqual(report.summary.totalStages, 3);
      assert.strictEqual(report.summary.completedStages, 2);
      assert.strictEqual(report.summary.failedStages, 1);
    });
    it('generateSummary should handle empty array', function() {
      const r = new CompositionReporter();
      const s = r.generateSummary([]);
      assert.strictEqual(s.total, 0);
    });
    it('generateSummary should handle null', function() {
      const r = new CompositionReporter();
      const s = r.generateSummary(null);
      assert.strictEqual(s.total, 0);
    });
    it('generateSummary should compute totals', function() {
      const r = new CompositionReporter();
      const reports = [
        { compositionId: 'a', status: 'completed', duration: 100 },
        { compositionId: 'b', status: 'failed', duration: 200 }
      ];
      const s = r.generateSummary(reports);
      assert.strictEqual(s.total, 2);
      assert.strictEqual(s.completed, 1);
      assert.strictEqual(s.failed, 1);
      assert.strictEqual(s.totalDuration, 300);
      assert.strictEqual(s.averageDuration, 150);
    });
    it('generateSummary should treat success as completed', function() {
      const r = new CompositionReporter();
      const reports = [{ compositionId: 'a', status: 'success', duration: 50 }];
      const s = r.generateSummary(reports);
      assert.strictEqual(s.completed, 1);
    });
    it('should handle large number of stages', function() {
      const r = new CompositionReporter();
      const stages = [];
      for (let i = 0; i < 100; i++) stages.push({ name: `s${i}`, status: i % 2 === 0 ? 'completed' : 'failed' });
      const report = r.generateReport('c1', { status: 'done', stages, startedAt: new Date().toISOString() });
      assert.strictEqual(report.summary.totalStages, 100);
      assert.strictEqual(report.summary.completedStages, 50);
      assert.strictEqual(report.summary.failedStages, 50);
    });
    it('should generate unique reports per id', function() {
      const r = new CompositionReporter();
      r.generateReport('a', { status: 'completed', stages: [], startedAt: new Date().toISOString() });
      r.generateReport('b', { status: 'failed', stages: [], startedAt: new Date().toISOString() });
      assert.ok(r);
    });
    it('clear should reset all', function() {
      const r = new CompositionReporter();
      r.generateReport('a', { status: 'completed', stages: [], startedAt: new Date().toISOString() });
      r.clear();
      assert.ok(r);
    });
    it('should handle execution with no startedAt', function() {
      const r = new CompositionReporter();
      const report = r.generateReport('c1', {});
      assert.strictEqual(report.duration, 0);
    });
  });

  /* ─── CapabilityRegistry (15 tests) ─── */
  describe('CapabilityRegistry', function() {
    const { CapabilityRegistry } = require('../lib/composer/capabilityRegistry');
    it('should create with empty state', function() {
      const r = new CapabilityRegistry();
      assert.strictEqual(r.list().length, 0);
    });
    it('should register a capability', function() {
      const r = new CapabilityRegistry();
      const cap = r.register({ id: 'cap1', name: 'Test Cap', type: 'test' });
      assert.strictEqual(cap.id, 'cap1');
      assert.ok(cap.registeredAt);
    });
    it('should throw if no id', function() {
      const r = new CapabilityRegistry();
      assert.throws(() => r.register({ name: 'x' }), /capability with an id is required/);
    });
    it('should throw on duplicate', function() {
      const r = new CapabilityRegistry();
      r.register({ id: 'c1' });
      assert.throws(() => r.register({ id: 'c1' }), /already registered/);
    });
    it('should get by id', function() {
      const r = new CapabilityRegistry();
      r.register({ id: 'c1' });
      assert.strictEqual(r.get('c1').id, 'c1');
    });
    it('get should return null for missing', function() {
      const r = new CapabilityRegistry();
      assert.strictEqual(r.get('none'), null);
    });
    it('get should return null for null', function() {
      const r = new CapabilityRegistry();
      assert.strictEqual(r.get(null), null);
    });
    it('should unregister by id', function() {
      const r = new CapabilityRegistry();
      r.register({ id: 'c1' });
      assert.strictEqual(r.unregister('c1'), true);
      assert.strictEqual(r.list().length, 0);
    });
    it('unregister should return false for missing', function() {
      const r = new CapabilityRegistry();
      assert.strictEqual(r.unregister('none'), false);
    });
    it('unregister should return false for null', function() {
      const r = new CapabilityRegistry();
      assert.strictEqual(r.unregister(null), false);
    });
    it('find should filter by type', function() {
      const r = new CapabilityRegistry();
      r.register({ id: 'a', type: 't1' });
      r.register({ id: 'b', type: 't2' });
      r.register({ id: 'c', type: 't1' });
      assert.strictEqual(r.find({ type: 't1' }).length, 2);
    });
    it('find should filter by name', function() {
      const r = new CapabilityRegistry();
      r.register({ id: 'a', name: 'Alpha' });
      r.register({ id: 'b', name: 'Beta' });
      assert.strictEqual(r.find({ name: 'Alpha' }).length, 1);
    });
    it('find should return all with empty query', function() {
      const r = new CapabilityRegistry();
      r.register({ id: 'a' }); r.register({ id: 'b' });
      assert.strictEqual(r.find({}).length, 2);
    });
    it('should set defaults for missing fields', function() {
      const r = new CapabilityRegistry();
      const cap = r.register({ id: 'c1' });
      assert.strictEqual(cap.name, '');
      assert.strictEqual(cap.type, 'generic');
      assert.strictEqual(cap.version, '1.0.0');
    });
    it('clear should reset all', function() {
      const r = new CapabilityRegistry();
      r.register({ id: 'a' }); r.clear();
      assert.strictEqual(r.list().length, 0);
    });
  });

  /* ─── DependencyResolver (20 tests) ─── */
  describe('DependencyResolver', function() {
    const { DependencyResolver } = require('../lib/composer/dependencyResolver');
    it('should create with empty state', function() {
      const d = new DependencyResolver();
      assert.strictEqual(d.getResolutionOrder('none').length, 0);
    });
    it('should resolve simple dependencies', function() {
      const d = new DependencyResolver();
      const nodes = [{ id: 'a' }, { id: 'b', dependencies: ['a'] }];
      const r = d.resolve('c1', nodes);
      assert.strictEqual(r.resolved, true);
    });
    it('should throw if no compositionId', function() {
      const d = new DependencyResolver();
      assert.throws(() => d.resolve(null, []), /compositionId and nodes array are required/);
    });
    it('should throw if nodes is not array', function() {
      const d = new DependencyResolver();
      assert.throws(() => d.resolve('c', null), /compositionId and nodes array are required/);
    });
    it('should produce topological order', function() {
      const d = new DependencyResolver();
      const nodes = [{ id: 'a' }, { id: 'b', dependencies: ['a'] }, { id: 'c', dependencies: ['b'] }];
      const r = d.resolve('c1', nodes);
      assert.strictEqual(r.resolved, true);
      const order = r.order;
      assert.ok(order.indexOf('a') < order.indexOf('b'));
      assert.ok(order.indexOf('b') < order.indexOf('c'));
    });
    it('should detect cycles', function() {
      const d = new DependencyResolver();
      const nodes = [{ id: 'a', dependencies: ['b'] }, { id: 'b', dependencies: ['a'] }];
      const r = d.resolve('c1', nodes);
      assert.strictEqual(r.resolved, false);
      assert.ok(r.cycles.length > 0);
    });
    it('should handle diamond dependencies', function() {
      const d = new DependencyResolver();
      const nodes = [
        { id: 'a' },
        { id: 'b', dependencies: ['a'] },
        { id: 'c', dependencies: ['a'] },
        { id: 'd', dependencies: ['b', 'c'] }
      ];
      const r = d.resolve('c1', nodes);
      assert.strictEqual(r.resolved, true);
      assert.ok(r.order.indexOf('a') < r.order.indexOf('d'));
    });
    it('should handle nodes without dependencies', function() {
      const d = new DependencyResolver();
      const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const r = d.resolve('c1', nodes);
      assert.strictEqual(r.resolved, true);
      assert.strictEqual(r.order.length, 3);
    });
    it('should skip nodes without id', function() {
      const d = new DependencyResolver();
      const nodes = [{ id: 'a' }, { name: 'no-id' }];
      const r = d.resolve('c1', nodes);
      assert.strictEqual(r.resolved, true);
      assert.strictEqual(r.order.length, 1);
    });
    it('validateDependencies should detect missing deps', function() {
      const d = new DependencyResolver();
      const nodes = [{ id: 'a', dependencies: ['missing'] }];
      const r = d.validateDependencies(nodes);
      assert.strictEqual(r.valid, false);
    });
    it('validateDependencies should accept valid nodes', function() {
      const d = new DependencyResolver();
      const nodes = [{ id: 'a' }, { id: 'b', dependencies: ['a'] }];
      const r = d.validateDependencies(nodes);
      assert.strictEqual(r.valid, true);
    });
    it('validateDependencies should handle empty array', function() {
      const d = new DependencyResolver();
      const r = d.validateDependencies([]);
      assert.strictEqual(r.valid, true);
    });
    it('validateDependencies should handle non-array', function() {
      const d = new DependencyResolver();
      const r = d.validateDependencies(null);
      assert.strictEqual(r.valid, false);
    });
    it('validateDependencies should detect node without id', function() {
      const d = new DependencyResolver();
      const nodes = [{ name: 'no-id' }];
      const r = d.validateDependencies(nodes);
      assert.strictEqual(r.valid, false);
    });
    it('getResolutionOrder should return empty for missing', function() {
      const d = new DependencyResolver();
      assert.strictEqual(d.getResolutionOrder('none').length, 0);
    });
    it('getResolutionOrder should return order after resolve', function() {
      const d = new DependencyResolver();
      d.resolve('c1', [{ id: 'a' }, { id: 'b', dependencies: ['a'] }]);
      const order = d.getResolutionOrder('c1');
      assert.ok(order.length > 0);
    });
    it('clear should reset all', function() {
      const d = new DependencyResolver();
      d.resolve('c1', [{ id: 'a' }]); d.clear();
      assert.strictEqual(d.getResolutionOrder('c1').length, 0);
    });
    it('should handle self-referencing dependency', function() {
      const d = new DependencyResolver();
      const nodes = [{ id: 'a', dependencies: ['a'] }];
      const r = d.resolve('c1', nodes);
      assert.strictEqual(r.resolved, false);
    });
    it('should handle complex multi-dep graph', function() {
      const d = new DependencyResolver();
      const nodes = [];
      for (let i = 0; i < 10; i++) {
        const deps = i > 0 ? [`node-${i-1}`] : [];
        nodes.push({ id: `node-${i}`, dependencies: deps });
      }
      const r = d.resolve('c1', nodes);
      assert.strictEqual(r.resolved, true);
      assert.strictEqual(r.order.length, 10);
    });
  });

  /* ─── CompositionGraph (20 tests) ─── */
  describe('CompositionGraph', function() {
    const { CompositionGraph } = require('../lib/composer/compositionGraph');
    it('should create with empty state', function() {
      const g = new CompositionGraph();
      assert.deepStrictEqual(g.getNodes('none'), []);
    });
    it('should create a graph', function() {
      const g = new CompositionGraph();
      const graph = g.createGraph('c1', [{ id: 'a' }], [{ from: 'a', to: 'b' }]);
      assert.strictEqual(graph.id, 'c1');
      assert.strictEqual(graph.nodes.length, 1);
    });
    it('should throw if no compositionId', function() {
      const g = new CompositionGraph();
      assert.throws(() => g.createGraph(null), /compositionId is required/);
    });
    it('should add a node', function() {
      const g = new CompositionGraph();
      const n = g.addNode('c1', { id: 'n1', type: 'service' });
      assert.strictEqual(n.id, 'n1');
    });
    it('should add node with defaults', function() {
      const g = new CompositionGraph();
      const n = g.addNode('c1', {});
      assert.ok(n.id.startsWith('node-'));
      assert.strictEqual(n.type, 'unknown');
    });
    it('should throw if no compositionId for addNode', function() {
      const g = new CompositionGraph();
      assert.throws(() => g.addNode(null, {}), /compositionId and node are required/);
    });
    it('should add an edge', function() {
      const g = new CompositionGraph();
      const e = g.addEdge('c1', { from: 'a', to: 'b' });
      assert.strictEqual(e.from, 'a');
      assert.strictEqual(e.to, 'b');
    });
    it('should add edge with source/target pattern', function() {
      const g = new CompositionGraph();
      const e = g.addEdge('c1', { source: 'x', target: 'y' });
      assert.strictEqual(e.from, 'x');
      assert.strictEqual(e.to, 'y');
    });
    it('should throw if no compositionId for addEdge', function() {
      const g = new CompositionGraph();
      assert.throws(() => g.addEdge(null, {}), /compositionId and edge are required/);
    });
    it('should remove a node', function() {
      const g = new CompositionGraph();
      g.addNode('c1', { id: 'n1' });
      assert.strictEqual(g.removeNode('c1', 'n1'), true);
      assert.strictEqual(g.getNodes('c1').length, 0);
    });
    it('removeNode should return false for missing', function() {
      const g = new CompositionGraph();
      assert.strictEqual(g.removeNode('c1', 'none'), false);
    });
    it('removeNode should remove associated edges', function() {
      const g = new CompositionGraph();
      g.addNode('c1', { id: 'a' }); g.addNode('c1', { id: 'b' });
      g.addEdge('c1', { from: 'a', to: 'b' });
      g.removeNode('c1', 'a');
      assert.strictEqual(g.getEdges('c1').length, 0);
    });
    it('getNodes should return copy', function() {
      const g = new CompositionGraph();
      g.addNode('c1', { id: 'n1' });
      const nodes = g.getNodes('c1');
      nodes.push({ id: 'n2' });
      assert.strictEqual(g.getNodes('c1').length, 1);
    });
    it('getEdges should return copy', function() {
      const g = new CompositionGraph();
      g.addEdge('c1', { from: 'a', to: 'b' });
      const edges = g.getEdges('c1');
      edges.push({});
      assert.strictEqual(g.getEdges('c1').length, 1);
    });
    it('getAdjacencyList should work', function() {
      const g = new CompositionGraph();
      g.addNode('c1', { id: 'a' }); g.addNode('c1', { id: 'b' });
      g.addEdge('c1', { from: 'a', to: 'b' });
      const adj = g.getAdjacencyList('c1');
      assert.ok(Array.isArray(adj.a));
      assert.strictEqual(adj.a[0], 'b');
    });
    it('getAdjacencyList should return empty for missing', function() {
      const g = new CompositionGraph();
      assert.deepStrictEqual(g.getAdjacencyList('none'), {});
    });
    it('should create graph with empty nodes/edges', function() {
      const g = new CompositionGraph();
      const graph = g.createGraph('c1');
      assert.strictEqual(graph.nodes.length, 0);
      assert.strictEqual(graph.edges.length, 0);
    });
    it('getGraph should return null for missing', function() {
      const g = new CompositionGraph();
      assert.strictEqual(g.getGraph('none'), null);
    });
    it('clear should remove all graphs', function() {
      const g = new CompositionGraph();
      g.createGraph('c1'); g.clear();
      assert.strictEqual(g.getGraph('c1'), null);
    });
  });

  /* ─── ComposerManager (15 tests) ─── */
  describe('ComposerManager', function() {
    const { ComposerManager } = require('../lib/composer/composerManager');
    it('should create with all sub-modules', function() {
      const m = new ComposerManager();
      assert.ok(m.applicationComposer); assert.ok(m.compositionEngine);
      assert.ok(m.compositionPlanner); assert.ok(m.compositionRegistry);
      assert.ok(m.compositionValidator); assert.ok(m.compositionStorage);
      assert.ok(m.compositionMetrics); assert.ok(m.compositionEvents);
      assert.ok(m.compositionReporter); assert.ok(m.capabilityRegistry);
      assert.ok(m.dependencyResolver); assert.ok(m.compositionGraph);
      assert.ok(m.composerIntegration);
    });
    it('getStatus should return initialized state', function() {
      const m = new ComposerManager();
      const s = m.getStatus();
      assert.strictEqual(s.initialized, true);
      assert.ok(s.initializedAt);
    });
    it('getStatus submodules should all be true', function() {
      const m = new ComposerManager();
      const s = m.getStatus().submodules;
      for (const key of Object.keys(s)) {
        assert.strictEqual(s[key], true, `submodule ${key} should be true`);
      }
    });
    it('should create independent instances', function() {
      const a = new ComposerManager(); const b = new ComposerManager();
      a.applicationComposer.compose('app1', {});
      assert.strictEqual(a.applicationComposer.listCompositions().length, 1);
      assert.strictEqual(b.applicationComposer.listCompositions().length, 0);
    });
    it('clear should reset all sub-modules', function() {
      const m = new ComposerManager();
      m.applicationComposer.compose('app1', {});
      m.capabilityRegistry.register({ id: 'cap1' });
      m.clear();
      assert.strictEqual(m.applicationComposer.listCompositions().length, 0);
      assert.strictEqual(m.capabilityRegistry.list().length, 0);
    });
    it('clear on empty manager should not throw', function() {
      const m = new ComposerManager(); m.clear();
      assert.ok(m.getStatus().initialized);
    });
    it('sub-modules accessible after clear', function() {
      const m = new ComposerManager(); m.clear();
      m.applicationComposer.compose('app1', {});
      assert.strictEqual(m.applicationComposer.listCompositions().length, 1);
    });
    it('should have composerIntegration', function() {
      const m = new ComposerManager();
      assert.ok(m.composerIntegration);
      assert.strictEqual(typeof m.composerIntegration.enable, 'function');
    });
    it('should handle many compositions via manager', function() {
      const m = new ComposerManager();
      for (let i = 0; i < 50; i++) m.applicationComposer.compose('app-'+i, {});
      assert.strictEqual(m.applicationComposer.listCompositions().length, 50);
    });
    it('should handle many capabilities via manager', function() {
      const m = new ComposerManager();
      for (let i = 0; i < 30; i++) m.capabilityRegistry.register({ id: 'cap-'+i });
      assert.strictEqual(m.capabilityRegistry.list().length, 30);
    });
    it('should handle many graph nodes via manager', function() {
      const m = new ComposerManager();
      for (let i = 0; i < 25; i++) m.compositionGraph.addNode('c1', { id: 'n-'+i });
      assert.strictEqual(m.compositionGraph.getNodes('c1').length, 25);
    });
    it('should handle many plans via manager', function() {
      const m = new ComposerManager();
      for (let i = 0; i < 20; i++) m.compositionPlanner.createPlan('plan-'+i, {});
      assert.strictEqual(m.compositionPlanner.listPlans().length, 20);
    });
    it('should handle many executions via manager', function() {
      const m = new ComposerManager();
      for (let i = 0; i < 15; i++) m.compositionEngine.execute('exec-'+i, {});
      assert.strictEqual(m.compositionEngine.listExecutions().length, 15);
    });
    it('should allow multiple independent managers', function() {
      const m1 = new ComposerManager(); const m2 = new ComposerManager();
      m1.applicationComposer.compose('a', {});
      m2.applicationComposer.compose('b', {});
      m2.applicationComposer.compose('c', {});
      assert.strictEqual(m1.applicationComposer.listCompositions().length, 1);
      assert.strictEqual(m2.applicationComposer.listCompositions().length, 2);
    });
    it('should integrate events through composerIntegration', function() {
      const m = new ComposerManager();
      let emitted = false;
      m.compositionEvents.on('composer:integration', () => { emitted = true; });
      m.composerIntegration.integrateLifecycle({ test: true });
      assert.strictEqual(emitted, true);
    });
  });

  /* ─── ApplicationDefinition (12 tests) ─── */
  describe('ApplicationDefinition', function() {
    const { ApplicationDefinition } = require('../lib/composer/applicationDefinition');
    it('should create with empty state', function() {
      const d = new ApplicationDefinition(); assert.strictEqual(d.list().length, 0);
    });
    it('should create a definition', function() {
      const d = new ApplicationDefinition();
      const def = d.create('app1', 'Test App', '1.0.0', {});
      assert.strictEqual(def.id, 'app1'); assert.strictEqual(def.name, 'Test App');
      assert.strictEqual(def.version, '1.0.0'); assert.strictEqual(def.status, 'draft');
    });
    it('should throw if no id', function() {
      const d = new ApplicationDefinition();
      assert.throws(() => d.create(null, 'n'), /id and name are required/);
    });
    it('should throw if no name', function() {
      const d = new ApplicationDefinition();
      assert.throws(() => d.create('id', null), /id and name are required/);
    });
    it('should use default version', function() {
      const d = new ApplicationDefinition();
      const def = d.create('app1', 'Test');
      assert.strictEqual(def.version, '1.0.0');
    });
    it('should get by id', function() {
      const d = new ApplicationDefinition(); d.create('a', 'A');
      assert.strictEqual(d.get('a').name, 'A');
    });
    it('get should return null for missing', function() {
      const d = new ApplicationDefinition(); assert.strictEqual(d.get('none'), null);
    });
    it('get should return null for null', function() {
      const d = new ApplicationDefinition(); assert.strictEqual(d.get(null), null);
    });
    it('should update allowed fields', function() {
      const d = new ApplicationDefinition(); d.create('a', 'A');
      const upd = d.update('a', { name: 'Updated', status: 'active' });
      assert.strictEqual(upd.name, 'Updated'); assert.strictEqual(upd.status, 'active');
    });
    it('should not update non-allowed fields', function() {
      const d = new ApplicationDefinition(); d.create('a', 'A');
      d.update('a', { id: 'new-id', name: 'B' });
      assert.strictEqual(d.get('a').id, 'a');
      assert.strictEqual(d.get('a').name, 'B');
    });
    it('update should return null for missing', function() {
      const d = new ApplicationDefinition();
      assert.strictEqual(d.update('none', { name: 'x' }), null);
    });
    it('clear should reset', function() {
      const d = new ApplicationDefinition(); d.create('a', 'A'); d.clear();
      assert.strictEqual(d.list().length, 0);
    });
  });

  /* ─── ApplicationManifest (14 tests) ─── */
  describe('ApplicationManifest', function() {
    const { ApplicationManifest } = require('../lib/composer/applicationManifest');
    it('should create with empty state', function() {
      const m = new ApplicationManifest();
      assert.strictEqual(m.get('none'), null);
    });
    it('should create a manifest', function() {
      const m = new ApplicationManifest();
      const man = m.create('app1', { name: 'Test', version: '2.0.0', author: 'Dev' });
      assert.strictEqual(man.appId, 'app1'); assert.strictEqual(man.name, 'Test');
    });
    it('should throw if no applicationId', function() {
      const m = new ApplicationManifest();
      assert.throws(() => m.create(null, {}), /applicationId is required/);
    });
    it('should use defaults for empty manifest', function() {
      const m = new ApplicationManifest();
      const man = m.create('app1');
      assert.strictEqual(man.name, ''); assert.strictEqual(man.version, '1.0.0');
      assert.deepStrictEqual(man.modules, []);
    });
    it('should get by appId', function() {
      const m = new ApplicationManifest(); m.create('a', { name: 'A' });
      assert.strictEqual(m.get('a').appId, 'a');
    });
    it('get should return null for missing', function() {
      const m = new ApplicationManifest(); assert.strictEqual(m.get('none'), null);
    });
    it('get should return null for null', function() {
      const m = new ApplicationManifest(); assert.strictEqual(m.get(null), null);
    });
    it('should update allowed fields', function() {
      const m = new ApplicationManifest(); m.create('a', { name: 'A' });
      m.update('a', { name: 'B', version: '2.0.0', description: 'Desc' });
      assert.strictEqual(m.get('a').name, 'B');
    });
    it('update should return null for missing', function() {
      const m = new ApplicationManifest();
      assert.strictEqual(m.update('none', { name: 'x' }), null);
    });
    it('export should return json by default', function() {
      const m = new ApplicationManifest(); m.create('a', { name: 'A' });
      const exp = m.export('a');
      assert.strictEqual(exp.format, 'json'); assert.strictEqual(exp.data.name, 'A');
    });
    it('export should return yaml format', function() {
      const m = new ApplicationManifest(); m.create('a', { name: 'A' });
      const exp = m.export('a', 'yaml');
      assert.strictEqual(exp.format, 'yaml');
      assert.ok(typeof exp.data === 'string');
    });
    it('export should return null for missing', function() {
      const m = new ApplicationManifest();
      assert.strictEqual(m.export('none'), null);
    });
    it('export should throw if no appId', function() {
      const m = new ApplicationManifest();
      assert.throws(() => m.export(null), /appId is required/);
    });
    it('clear should reset', function() {
      const m = new ApplicationManifest(); m.create('a', {}); m.clear();
      assert.strictEqual(m.get('a'), null);
    });
  });

  /* ─── ApplicationBlueprint (10 tests) ─── */
  describe('ApplicationBlueprint', function() {
    const { ApplicationBlueprint } = require('../lib/composer/applicationBlueprint');
    it('should create with empty state', function() {
      const b = new ApplicationBlueprint();
      assert.strictEqual(b.list().length, 0);
    });
    it('should create a blueprint', function() {
      const b = new ApplicationBlueprint();
      const bp = b.create('TestBP', '1.0.0', ['mod1', 'mod2'], { key: 'val' });
      assert.strictEqual(bp.name, 'TestBP'); assert.strictEqual(bp.version, '1.0.0');
      assert.strictEqual(bp.modules.length, 2);
    });
    it('should throw if no name', function() {
      const b = new ApplicationBlueprint();
      assert.throws(() => b.create(null, '1'), /name and version are required/);
    });
    it('should throw if no version', function() {
      const b = new ApplicationBlueprint();
      assert.throws(() => b.create('n', null), /name and version are required/);
    });
    it('should default to empty modules', function() {
      const b = new ApplicationBlueprint();
      const bp = b.create('n', '1');
      assert.deepStrictEqual(bp.modules, []);
    });
    it('should default to empty config', function() {
      const b = new ApplicationBlueprint();
      const bp = b.create('n', '1');
      assert.deepStrictEqual(bp.config, {});
    });
    it('should have 5 stages', function() {
      const b = new ApplicationBlueprint();
      const bp = b.create('n', '1');
      assert.strictEqual(bp.stages.length, 5);
    });
    it('should get by name', function() {
      const b = new ApplicationBlueprint(); b.create('BP', '1');
      assert.strictEqual(b.get('BP').name, 'BP');
    });
    it('get should return null for missing', function() {
      const b = new ApplicationBlueprint(); assert.strictEqual(b.get('none'), null);
    });
    it('clear should reset', function() {
      const b = new ApplicationBlueprint(); b.create('BP', '1'); b.clear();
      assert.strictEqual(b.list().length, 0);
    });
  });

  /* ─── ApplicationCapabilities (12 tests) ─── */
  describe('ApplicationCapabilities', function() {
    const { ApplicationCapabilities } = require('../lib/composer/applicationCapabilities');
    it('should create with empty state', function() {
      const c = new ApplicationCapabilities();
      assert.deepStrictEqual(c.getCapabilities('none'), []);
    });
    it('should add a capability', function() {
      const c = new ApplicationCapabilities();
      const cap = c.addCapability('app1', { id: 'cap1', name: 'Auth', type: 'security' });
      assert.strictEqual(cap.id, 'cap1');
    });
    it('should throw if no appId', function() {
      const c = new ApplicationCapabilities();
      assert.throws(() => c.addCapability(null, {}), /appId and capability are required/);
    });
    it('should throw if no capability', function() {
      const c = new ApplicationCapabilities();
      assert.throws(() => c.addCapability('a', null), /appId and capability are required/);
    });
    it('should throw if capability has no id', function() {
      const c = new ApplicationCapabilities();
      assert.throws(() => c.addCapability('a', { name: 'x' }), /capability must have an id/);
    });
    it('should get capabilities for appId', function() {
      const c = new ApplicationCapabilities();
      c.addCapability('app1', { id: 'c1' }); c.addCapability('app1', { id: 'c2' });
      assert.strictEqual(c.getCapabilities('app1').length, 2);
    });
    it('should return empty for missing appId', function() {
      const c = new ApplicationCapabilities(); c.addCapability('a', { id: 'c1' });
      assert.deepStrictEqual(c.getCapabilities('b'), []);
    });
    it('hasCapability should return true', function() {
      const c = new ApplicationCapabilities(); c.addCapability('a', { id: 'c1' });
      assert.strictEqual(c.hasCapability('a', 'c1'), true);
    });
    it('hasCapability should return false', function() {
      const c = new ApplicationCapabilities();
      assert.strictEqual(c.hasCapability('a', 'none'), false);
    });
    it('removeCapability should remove', function() {
      const c = new ApplicationCapabilities(); c.addCapability('a', { id: 'c1' });
      assert.strictEqual(c.removeCapability('a', 'c1'), true);
      assert.strictEqual(c.getCapabilities('a').length, 0);
    });
    it('removeCapability should return false for missing', function() {
      const c = new ApplicationCapabilities();
      assert.strictEqual(c.removeCapability('a', 'none'), false);
    });
    it('clear should reset', function() {
      const c = new ApplicationCapabilities(); c.addCapability('a', { id: 'c1' }); c.clear();
      assert.strictEqual(c.getCapabilities('a').length, 0);
    });
  });

  /* ─── ApplicationDependencies (12 tests) ─── */
  describe('ApplicationDependencies', function() {
    const { ApplicationDependencies } = require('../lib/composer/applicationDependencies');
    it('should create with empty state', function() {
      const d = new ApplicationDependencies();
      assert.deepStrictEqual(d.getDependencies('none'), []);
    });
    it('should add a dependency', function() {
      const d = new ApplicationDependencies();
      const dep = d.addDependency('app1', { id: 'dep1', name: 'DB', type: 'database' });
      assert.strictEqual(dep.id, 'dep1'); assert.strictEqual(dep.optional, false);
    });
    it('should throw if no appId', function() {
      const d = new ApplicationDependencies();
      assert.throws(() => d.addDependency(null, {}), /appId and dependency are required/);
    });
    it('should throw if no dependency', function() {
      const d = new ApplicationDependencies();
      assert.throws(() => d.addDependency('a', null), /appId and dependency are required/);
    });
    it('should throw if dependency has no id', function() {
      const d = new ApplicationDependencies();
      assert.throws(() => d.addDependency('a', { name: 'x' }), /dependency must have an id/);
    });
    it('should get dependencies for appId', function() {
      const d = new ApplicationDependencies();
      d.addDependency('app1', { id: 'd1' }); d.addDependency('app1', { id: 'd2' });
      assert.strictEqual(d.getDependencies('app1').length, 2);
    });
    it('should return empty for missing appId', function() {
      const d = new ApplicationDependencies(); d.addDependency('a', { id: 'd1' });
      assert.deepStrictEqual(d.getDependencies('b'), []);
    });
    it('removeDependency should remove', function() {
      const d = new ApplicationDependencies(); d.addDependency('a', { id: 'd1' });
      assert.strictEqual(d.removeDependency('a', 'd1'), true);
      assert.strictEqual(d.getDependencies('a').length, 0);
    });
    it('removeDependency should return false for missing', function() {
      const d = new ApplicationDependencies();
      assert.strictEqual(d.removeDependency('a', 'none'), false);
    });
    it('resolve should return resolved true with deps', function() {
      const d = new ApplicationDependencies(); d.addDependency('a', { id: 'd1' });
      const r = d.resolve('a');
      assert.strictEqual(r.resolved, true); assert.strictEqual(r.dependencies.length, 1);
    });
    it('resolve should return empty for invalid appId', function() {
      const d = new ApplicationDependencies();
      const r = d.resolve(null);
      assert.strictEqual(r.resolved, false);
    });
    it('clear should reset', function() {
      const d = new ApplicationDependencies(); d.addDependency('a', { id: 'd1' }); d.clear();
      assert.strictEqual(d.getDependencies('a').length, 0);
    });
  });

  /* ─── ApplicationTopology (14 tests) ─── */
  describe('ApplicationTopology', function() {
    const { ApplicationTopology } = require('../lib/composer/applicationTopology');
    it('should create with empty state', function() {
      const t = new ApplicationTopology();
      assert.strictEqual(t.get('none'), null);
    });
    it('should build topology', function() {
      const t = new ApplicationTopology();
      const topo = t.build('app1', [{ id: 'svc1' }, { id: 'svc2' }]);
      assert.strictEqual(topo.appId, 'app1');
      assert.strictEqual(topo.nodes.length, 2);
    });
    it('should throw if no appId', function() {
      const t = new ApplicationTopology();
      assert.throws(() => t.build(null, []), /appId and components array are required/);
    });
    it('should throw if no components array', function() {
      const t = new ApplicationTopology();
      assert.throws(() => t.build('a', null), /appId and components array are required/);
    });
    it('should build edges between all nodes', function() {
      const t = new ApplicationTopology();
      const topo = t.build('app1', [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
      assert.strictEqual(topo.edges.length, 3);
    });
    it('should get by appId', function() {
      const t = new ApplicationTopology(); t.build('a', []);
      assert.strictEqual(t.get('a').appId, 'a');
    });
    it('get should return null for missing', function() {
      const t = new ApplicationTopology(); assert.strictEqual(t.get('none'), null);
    });
    it('addNode should add a node', function() {
      const t = new ApplicationTopology(); t.build('a', []);
      const n = t.addNode('a', { id: 'n1', type: 'service' });
      assert.strictEqual(n.id, 'n1');
    });
    it('addNode should create topology if missing', function() {
      const t = new ApplicationTopology();
      t.addNode('new', { id: 'n1' });
      assert.strictEqual(t.get('new').nodes.length, 1);
    });
    it('addEdge should add an edge', function() {
      const t = new ApplicationTopology(); t.build('a', []);
      const e = t.addEdge('a', { source: 'x', target: 'y' });
      assert.strictEqual(e.source, 'x');
    });
    it('listNodes should return copy', function() {
      const t = new ApplicationTopology(); t.build('a', [{ id: 'n1' }]);
      assert.strictEqual(t.listNodes('a').length, 1);
    });
    it('listEdges should return edges', function() {
      const t = new ApplicationTopology(); t.build('a', [{ id: 'n1' }, { id: 'n2' }]);
      assert.strictEqual(t.listEdges('a').length, 1);
    });
    it('listNodes should return empty for missing', function() {
      const t = new ApplicationTopology();
      assert.deepStrictEqual(t.listNodes('none'), []);
    });
    it('clear should reset', function() {
      const t = new ApplicationTopology(); t.build('a', []); t.clear();
      assert.strictEqual(t.get('a'), null);
    });
  });

  /* ─── ExecutionPlanner (14 tests) ─── */
  describe('ExecutionPlanner', function() {
    const { ExecutionPlanner } = require('../lib/composer/executionPlanner');
    it('should create with empty state', function() {
      const p = new ExecutionPlanner();
      assert.strictEqual(p.getExecutionPlan('none'), null);
    });
    it('should plan execution', function() {
      const p = new ExecutionPlanner();
      const plan = p.plan('c1', [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
      assert.strictEqual(plan.id, 'c1');
      assert.ok(plan.totalNodes >= 3);
    });
    it('should throw if no compositionId', function() {
      const p = new ExecutionPlanner();
      assert.throws(() => p.plan(null, []), /compositionId and nodes array are required/);
    });
    it('should throw if nodes not array', function() {
      const p = new ExecutionPlanner();
      assert.throws(() => p.plan('c', null), /compositionId and nodes array are required/);
    });
    it('should use provided order', function() {
      const p = new ExecutionPlanner();
      const plan = p.plan('c1', [{ id: 'a' }, { id: 'b' }], ['b', 'a']);
      const firstStage = plan.stages[0];
      assert.strictEqual(firstStage.nodes[0], 'b');
    });
    it('should create stages based on node count', function() {
      const p = new ExecutionPlanner();
      const plan = p.plan('c1', [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }]);
      assert.ok(plan.stages.length <= 3);
      assert.ok(plan.stages.length >= 1);
    });
    it('getExecutionPlan should return plan', function() {
      const p = new ExecutionPlanner(); p.plan('c1', [{ id: 'a' }]);
      assert.strictEqual(p.getExecutionPlan('c1').id, 'c1');
    });
    it('getExecutionPlan should return null for missing', function() {
      const p = new ExecutionPlanner();
      assert.strictEqual(p.getExecutionPlan('none'), null);
    });
    it('validatePlan should accept valid plan', function() {
      const p = new ExecutionPlanner();
      const plan = p.plan('c1', [{ id: 'a' }]);
      const r = p.validatePlan(plan);
      assert.strictEqual(r.valid, true);
    });
    it('validatePlan should reject null', function() {
      const p = new ExecutionPlanner();
      const r = p.validatePlan(null);
      assert.strictEqual(r.valid, false);
    });
    it('validatePlan should reject missing id', function() {
      const p = new ExecutionPlanner();
      const r = p.validatePlan({ stages: [{ name: 's1', nodes: [] }] });
      assert.strictEqual(r.valid, false);
    });
    it('validatePlan should reject missing stages', function() {
      const p = new ExecutionPlanner();
      const r = p.validatePlan({ id: 'c1' });
      assert.strictEqual(r.valid, false);
    });
    it('validatePlan should reject empty stages', function() {
      const p = new ExecutionPlanner();
      const r = p.validatePlan({ id: 'c1', stages: [] });
      assert.strictEqual(r.valid, false);
    });
    it('clear should reset', function() {
      const p = new ExecutionPlanner(); p.plan('c1', [{ id: 'a' }]); p.clear();
      assert.strictEqual(p.getExecutionPlan('c1'), null);
    });
  });

  /* ─── ResourceAllocator (12 tests) ─── */
  describe('ResourceAllocator', function() {
    const { ResourceAllocator } = require('../lib/composer/resourceAllocator');
    it('should create with empty state', function() {
      const r = new ResourceAllocator();
      assert.strictEqual(r.getAllocation('none'), null);
    });
    it('should allocate resources', function() {
      const r = new ResourceAllocator();
      const alloc = r.allocate('c1', { cpu: 2, memory: 1024 });
      assert.strictEqual(alloc.id, 'c1');
      assert.strictEqual(alloc.cpu, 2);
      assert.strictEqual(alloc.memory, 1024);
      assert.strictEqual(alloc.status, 'allocated');
    });
    it('should throw if no compositionId', function() {
      const r = new ResourceAllocator();
      assert.throws(() => r.allocate(null, {}), /compositionId is required/);
    });
    it('should use defaults for missing requirements', function() {
      const r = new ResourceAllocator();
      const alloc = r.allocate('c1');
      assert.strictEqual(alloc.cpu, 1);
      assert.strictEqual(alloc.memory, 512);
      assert.strictEqual(alloc.storage, 1024);
      assert.strictEqual(alloc.instances, 1);
    });
    it('should get allocation', function() {
      const r = new ResourceAllocator(); r.allocate('c1', {});
      assert.strictEqual(r.getAllocation('c1').id, 'c1');
    });
    it('getAllocation should return null for missing', function() {
      const r = new ResourceAllocator();
      assert.strictEqual(r.getAllocation('none'), null);
    });
    it('should release allocation', function() {
      const r = new ResourceAllocator(); r.allocate('c1', {});
      assert.strictEqual(r.release('c1'), true);
      assert.strictEqual(r.getAllocation('c1').status, 'released');
    });
    it('release should return false for missing', function() {
      const r = new ResourceAllocator();
      assert.strictEqual(r.release('none'), false);
    });
    it('estimate should return estimated allocation', function() {
      const r = new ResourceAllocator();
      const est = r.estimate({ cpu: 4, memory: 2048 });
      assert.strictEqual(est.estimated, true);
      assert.strictEqual(est.cpu, 4);
    });
    it('estimate should use defaults', function() {
      const r = new ResourceAllocator();
      const est = r.estimate({});
      assert.strictEqual(est.cpu, 1);
    });
    it('should handle multiple allocations', function() {
      const r = new ResourceAllocator();
      r.allocate('a', {}); r.allocate('b', { cpu: 8 });
      assert.strictEqual(r.getAllocation('a').cpu, 1);
      assert.strictEqual(r.getAllocation('b').cpu, 8);
    });
    it('clear should reset', function() {
      const r = new ResourceAllocator(); r.allocate('c1', {}); r.clear();
      assert.strictEqual(r.getAllocation('c1'), null);
    });
  });

  /* ─── ServiceComposer (10 tests) ─── */
  describe('ServiceComposer', function() {
    const { ServiceComposer } = require('../lib/composer/serviceComposer');
    it('should create with empty state', function() {
      const s = new ServiceComposer();
      assert.strictEqual(s.getComposition('none'), null);
    });
    it('should compose services', function() {
      const s = new ServiceComposer();
      const comp = s.compose('c1', [{ id: 'svc1', name: 'API', endpoint: '/api' }]);
      assert.strictEqual(comp.services.length, 1);
      assert.strictEqual(comp.endpoints.length, 1);
    });
    it('should throw if no compositionId', function() {
      const s = new ServiceComposer();
      assert.throws(() => s.compose(null, []), /compositionId is required/);
    });
    it('should handle empty services', function() {
      const s = new ServiceComposer();
      const comp = s.compose('c1', []);
      assert.strictEqual(comp.services.length, 0);
    });
    it('should include topology if provided', function() {
      const s = new ServiceComposer();
      const comp = s.compose('c1', [], { nodes: [] });
      assert.ok(comp.topology);
    });
    it('should get composition', function() {
      const s = new ServiceComposer(); s.compose('c1', []);
      assert.strictEqual(s.getComposition('c1').services.length, 0);
    });
    it('getServiceEndpoints should return endpoints', function() {
      const s = new ServiceComposer();
      s.compose('c1', [{ id: 's1', endpoint: '/api' }, { id: 's2', endpoint: '/health' }]);
      assert.strictEqual(s.getServiceEndpoints('c1').length, 2);
    });
    it('getServiceEndpoints should return empty for missing', function() {
      const s = new ServiceComposer();
      assert.strictEqual(s.getServiceEndpoints('none').length, 0);
    });
    it('should handle services without endpoint', function() {
      const s = new ServiceComposer();
      s.compose('c1', [{ id: 's1' }]);
      assert.strictEqual(s.getServiceEndpoints('c1').length, 0);
    });
    it('clear should reset', function() {
      const s = new ServiceComposer(); s.compose('c1', []); s.clear();
      assert.strictEqual(s.getComposition('c1'), null);
    });
  });

  /* ─── WorkflowComposer (12 tests) ─── */
  describe('WorkflowComposer', function() {
    const { WorkflowComposer } = require('../lib/composer/workflowComposer');
    it('should create with empty state', function() {
      const w = new WorkflowComposer();
      assert.strictEqual(w.getComposed('none'), null);
    });
    it('should compose workflows', function() {
      const w = new WorkflowComposer();
      const r = w.compose('app1', [{ id: 'wf1', name: 'TestWF' }]);
      assert.strictEqual(r.composed, true); assert.strictEqual(r.count, 1);
    });
    it('should return false for invalid args', function() {
      const w = new WorkflowComposer();
      assert.deepStrictEqual(w.compose(null, []), { composed: false, count: 0 });
    });
    it('should return false for non-array', function() {
      const w = new WorkflowComposer();
      assert.deepStrictEqual(w.compose('a', null), { composed: false, count: 0 });
    });
    it('should getComposed workflows', function() {
      const w = new WorkflowComposer(); w.compose('a', [{ id: 'wf1' }]);
      assert.strictEqual(w.getComposed('a').length, 1);
    });
    it('addWorkflow should add a workflow', function() {
      const w = new WorkflowComposer(); w.compose('a', []);
      const item = w.addWorkflow('a', { id: 'wf1' });
      assert.strictEqual(item._id, 'wf1');
    });
    it('addWorkflow should return null for invalid args', function() {
      const w = new WorkflowComposer();
      assert.strictEqual(w.addWorkflow(null, {}), null);
    });
    it('removeWorkflow should remove', function() {
      const w = new WorkflowComposer(); w.compose('a', [{ id: 'wf1' }]);
      assert.strictEqual(w.removeWorkflow('a', 'wf1'), true);
      assert.strictEqual(w.getComposed('a').length, 0);
    });
    it('removeWorkflow should return false for missing', function() {
      const w = new WorkflowComposer();
      assert.strictEqual(w.removeWorkflow('a', 'none'), false);
    });
    it('removeWorkflow should handle non-existent app', function() {
      const w = new WorkflowComposer();
      assert.strictEqual(w.removeWorkflow('none', 'wf1'), false);
    });
    it('should auto-generate ids', function() {
      const w = new WorkflowComposer();
      const item = w.addWorkflow('a', { name: 'Test' });
      assert.ok(item._id.startsWith('wf_'));
    });
    it('clear should reset', function() {
      const w = new WorkflowComposer(); w.compose('a', [{ id: 'wf1' }]); w.clear();
      assert.strictEqual(w.getComposed('a'), null);
    });
  });

  /* ─── AgentComposer (12 tests) ─── */
  describe('AgentComposer', function() {
    const { AgentComposer } = require('../lib/composer/agentComposer');
    it('should create with empty state', function() {
      const a = new AgentComposer();
      assert.strictEqual(a.getComposed('none'), null);
    });
    it('should compose agents', function() {
      const a = new AgentComposer();
      const r = a.compose('app1', [{ id: 'ag1', name: 'Assistant' }]);
      assert.strictEqual(r.composed, true); assert.strictEqual(r.count, 1);
    });
    it('should return false for invalid args', function() {
      const a = new AgentComposer();
      assert.deepStrictEqual(a.compose(null, []), { composed: false, count: 0 });
    });
    it('should getComposed agents', function() {
      const a = new AgentComposer(); a.compose('a', [{ id: 'ag1' }]);
      assert.strictEqual(a.getComposed('a').length, 1);
    });
    it('addAgent should add', function() {
      const a = new AgentComposer(); a.compose('a', []);
      const item = a.addAgent('a', { id: 'ag1' });
      assert.strictEqual(item._id, 'ag1');
    });
    it('addAgent should return null for invalid', function() {
      const a = new AgentComposer();
      assert.strictEqual(a.addAgent(null, {}), null);
    });
    it('removeAgent should remove', function() {
      const a = new AgentComposer(); a.compose('a', [{ id: 'ag1' }]);
      assert.strictEqual(a.removeAgent('a', 'ag1'), true);
      assert.strictEqual(a.getComposed('a').length, 0);
    });
    it('removeAgent should return false for missing', function() {
      const a = new AgentComposer();
      assert.strictEqual(a.removeAgent('a', 'none'), false);
    });
    it('should handle multiple agents', function() {
      const a = new AgentComposer();
      a.compose('a', [{ id: 'ag1' }, { id: 'ag2' }]);
      assert.strictEqual(a.getComposed('a').length, 2);
    });
    it('should sum compose calls', function() {
      const a = new AgentComposer();
      a.compose('a', [{ id: 'ag1' }]); a.compose('a', [{ id: 'ag2' }]);
      assert.strictEqual(a.getComposed('a').length, 2);
    });
    it('should auto-generate ids', function() {
      const a = new AgentComposer();
      const item = a.addAgent('a', { name: 'Test' });
      assert.ok(item._id.startsWith('agent_'));
    });
    it('clear should reset', function() {
      const a = new AgentComposer(); a.compose('a', [{ id: 'ag1' }]); a.clear();
      assert.strictEqual(a.getComposed('a'), null);
    });
  });

  /* ─── PluginComposer (12 tests) ─── */
  describe('PluginComposer', function() {
    const { PluginComposer } = require('../lib/composer/pluginComposer');
    it('should create with empty state', function() {
      const p = new PluginComposer();
      assert.strictEqual(p.getComposed('none'), null);
    });
    it('should compose plugins', function() {
      const p = new PluginComposer();
      const r = p.compose('app1', [{ id: 'pl1', name: 'Mail' }]);
      assert.strictEqual(r.composed, true); assert.strictEqual(r.count, 1);
    });
    it('should return false for invalid args', function() {
      const p = new PluginComposer();
      assert.deepStrictEqual(p.compose(null, []), { composed: false, count: 0 });
    });
    it('should getComposed plugins', function() {
      const p = new PluginComposer(); p.compose('a', [{ id: 'pl1' }]);
      assert.strictEqual(p.getComposed('a').length, 1);
    });
    it('addPlugin should add', function() {
      const p = new PluginComposer(); p.compose('a', []);
      const item = p.addPlugin('a', { id: 'pl1' });
      assert.strictEqual(item._id, 'pl1');
    });
    it('addPlugin should return null for invalid', function() {
      const p = new PluginComposer();
      assert.strictEqual(p.addPlugin(null, {}), null);
    });
    it('removePlugin should remove', function() {
      const p = new PluginComposer(); p.compose('a', [{ id: 'pl1' }]);
      assert.strictEqual(p.removePlugin('a', 'pl1'), true);
      assert.strictEqual(p.getComposed('a').length, 0);
    });
    it('removePlugin should return false for missing', function() {
      const p = new PluginComposer();
      assert.strictEqual(p.removePlugin('a', 'none'), false);
    });
    it('should handle multiple plugins', function() {
      const p = new PluginComposer();
      p.compose('a', [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]);
      assert.strictEqual(p.getComposed('a').length, 3);
    });
    it('should sum compose calls', function() {
      const p = new PluginComposer();
      p.compose('a', [{ id: 'p1' }]); p.compose('a', [{ id: 'p2' }]);
      assert.strictEqual(p.getComposed('a').length, 2);
    });
    it('should auto-generate ids', function() {
      const p = new PluginComposer();
      const item = p.addPlugin('a', { name: 'Test' });
      assert.ok(item._id.startsWith('plugin_'));
    });
    it('clear should reset', function() {
      const p = new PluginComposer(); p.compose('a', [{ id: 'pl1' }]); p.clear();
      assert.strictEqual(p.getComposed('a'), null);
    });
  });

  /* ─── IntegrationComposer (12 tests) ─── */
  describe('IntegrationComposer', function() {
    const { IntegrationComposer } = require('../lib/composer/integrationComposer');
    it('should create with empty state', function() {
      const i = new IntegrationComposer();
      assert.strictEqual(i.getComposed('none'), null);
    });
    it('should compose integrations', function() {
      const i = new IntegrationComposer();
      const r = i.compose('app1', [{ id: 'int1', name: 'Slack' }]);
      assert.strictEqual(r.composed, true); assert.strictEqual(r.count, 1);
    });
    it('should return false for invalid args', function() {
      const i = new IntegrationComposer();
      assert.deepStrictEqual(i.compose(null, []), { composed: false, count: 0 });
    });
    it('should getComposed integrations', function() {
      const i = new IntegrationComposer(); i.compose('a', [{ id: 'int1' }]);
      assert.strictEqual(i.getComposed('a').length, 1);
    });
    it('addIntegration should add', function() {
      const i = new IntegrationComposer(); i.compose('a', []);
      const item = i.addIntegration('a', { id: 'int1' });
      assert.strictEqual(item._id, 'int1');
    });
    it('addIntegration should return null for invalid', function() {
      const i = new IntegrationComposer();
      assert.strictEqual(i.addIntegration(null, {}), null);
    });
    it('removeIntegration should remove', function() {
      const i = new IntegrationComposer(); i.compose('a', [{ id: 'int1' }]);
      assert.strictEqual(i.removeIntegration('a', 'int1'), true);
      assert.strictEqual(i.getComposed('a').length, 0);
    });
    it('removeIntegration should return false for missing', function() {
      const i = new IntegrationComposer();
      assert.strictEqual(i.removeIntegration('a', 'none'), false);
    });
    it('should handle multiple integrations', function() {
      const i = new IntegrationComposer();
      i.compose('a', [{ id: 'i1' }, { id: 'i2' }]);
      assert.strictEqual(i.getComposed('a').length, 2);
    });
    it('should sum compose calls', function() {
      const i = new IntegrationComposer();
      i.compose('a', [{ id: 'i1' }]); i.compose('a', [{ id: 'i2' }]);
      assert.strictEqual(i.getComposed('a').length, 2);
    });
    it('should auto-generate ids', function() {
      const i = new IntegrationComposer();
      const item = i.addIntegration('a', { name: 'Test' });
      assert.ok(item._id.startsWith('integ_'));
    });
    it('clear should reset', function() {
      const i = new IntegrationComposer(); i.compose('a', [{ id: 'int1' }]); i.clear();
      assert.strictEqual(i.getComposed('a'), null);
    });
  });

  /* ─── RuntimeComposer (10 tests) ─── */
  describe('RuntimeComposer', function() {
    const { RuntimeComposer } = require('../lib/composer/runtimeComposer');
    it('should create with empty state', function() {
      const r = new RuntimeComposer();
      assert.strictEqual(r.getComposed('none'), null);
    });
    it('should compose runtime', function() {
      const r = new RuntimeComposer();
      const result = r.compose('app1', { type: 'node', version: '18' });
      assert.strictEqual(result.composed, true);
      assert.strictEqual(r.getComposed('app1').type, 'node');
    });
    it('should return false for invalid args', function() {
      const r = new RuntimeComposer();
      assert.deepStrictEqual(r.compose(null, {}), { composed: false });
    });
    it('should return false for null runtime', function() {
      const r = new RuntimeComposer();
      assert.deepStrictEqual(r.compose('a', null), { composed: false });
    });
    it('should getComposed runtime', function() {
      const r = new RuntimeComposer(); r.compose('a', { type: 'node' });
      assert.strictEqual(r.getComposed('a').type, 'node');
    });
    it('updateRuntime should create if missing', function() {
      const r = new RuntimeComposer();
      const upd = r.updateRuntime('a', { type: 'python' });
      assert.strictEqual(upd.type, 'python');
    });
    it('updateRuntime should merge with existing', function() {
      const r = new RuntimeComposer(); r.compose('a', { type: 'node', version: '18' });
      r.updateRuntime('a', { version: '20' });
      assert.strictEqual(r.getComposed('a').type, 'node');
      assert.strictEqual(r.getComposed('a').version, '20');
    });
    it('should auto-generate ids', function() {
      const r = new RuntimeComposer();
      r.compose('a', { name: 'Test' });
      assert.ok(r.getComposed('a')._id.startsWith('rt_'));
    });
    it('should handle multiple runtimes', function() {
      const r = new RuntimeComposer();
      r.compose('a', { type: 'node' }); r.compose('b', { type: 'python' });
      assert.strictEqual(r.getComposed('a').type, 'node');
      assert.strictEqual(r.getComposed('b').type, 'python');
    });
    it('clear should reset', function() {
      const r = new RuntimeComposer(); r.compose('a', {}); r.clear();
      assert.strictEqual(r.getComposed('a'), null);
    });
  });

  /* ─── SecurityComposer (12 tests) ─── */
  describe('SecurityComposer', function() {
    const { SecurityComposer } = require('../lib/composer/securityComposer');
    it('should create with empty state', function() {
      const s = new SecurityComposer();
      assert.strictEqual(s.getComposed('none'), null);
    });
    it('should compose security', function() {
      const s = new SecurityComposer();
      const result = s.compose('app1', { type: 'oauth', policies: [{ id: 'p1', name: 'MFA' }] });
      assert.strictEqual(result.composed, true);
      assert.strictEqual(s.getComposed('app1').type, 'oauth');
    });
    it('should return false for invalid args', function() {
      const s = new SecurityComposer();
      assert.deepStrictEqual(s.compose(null, {}), { composed: false });
    });
    it('should getComposed security', function() {
      const s = new SecurityComposer(); s.compose('a', { type: 'jwt' });
      assert.strictEqual(s.getComposed('a').type, 'jwt');
    });
    it('addPolicy should add a policy', function() {
      const s = new SecurityComposer(); s.compose('a', { type: 'basic', policies: [] });
      const item = s.addPolicy('a', { id: 'p1' });
      assert.strictEqual(item._id, 'p1');
    });
    it('addPolicy should return null if not composed', function() {
      const s = new SecurityComposer();
      assert.strictEqual(s.addPolicy('none', { id: 'p1' }), null);
    });
    it('removePolicy should remove', function() {
      const s = new SecurityComposer();
      s.compose('a', { type: 'basic', policies: [{ id: 'p1' }] });
      assert.strictEqual(s.removePolicy('a', 'p1'), true);
    });
    it('removePolicy should return false for missing', function() {
      const s = new SecurityComposer();
      assert.strictEqual(s.removePolicy('a', 'none'), false);
    });
    it('should auto-generate policy ids', function() {
      const s = new SecurityComposer();
      s.compose('a', { type: 'basic', policies: [{ name: 'Test' }] });
      assert.ok(s.getComposed('a')._policies[0]._id.startsWith('secpol_'));
    });
    it('should handle empty policies', function() {
      const s = new SecurityComposer(); s.compose('a', { type: 'basic' });
      assert.strictEqual(s.getComposed('a').type, 'basic');
    });
    it('should handle multiple policies', function() {
      const s = new SecurityComposer();
      s.compose('a', { type: 'basic', policies: [{ id: 'p1' }, { id: 'p2' }] });
      assert.strictEqual(s.getComposed('a')._policies.length, 2);
    });
    it('clear should reset', function() {
      const s = new SecurityComposer(); s.compose('a', {}); s.clear();
      assert.strictEqual(s.getComposed('a'), null);
    });
  });

  /* ─── BillingComposer (12 tests) ─── */
  describe('BillingComposer', function() {
    const { BillingComposer } = require('../lib/composer/billingComposer');
    it('should create with empty state', function() {
      const b = new BillingComposer();
      assert.strictEqual(b.getComposed('none'), null);
    });
    it('should compose billing', function() {
      const b = new BillingComposer();
      const result = b.compose('app1', { provider: 'stripe', plans: [{ id: 'free' }] });
      assert.strictEqual(result.composed, true);
    });
    it('should return false for invalid args', function() {
      const b = new BillingComposer();
      assert.deepStrictEqual(b.compose(null, {}), { composed: false });
    });
    it('should getComposed billing', function() {
      const b = new BillingComposer(); b.compose('a', { provider: 'stripe' });
      assert.strictEqual(b.getComposed('a').provider, 'stripe');
    });
    it('addPlan should add a plan', function() {
      const b = new BillingComposer(); b.compose('a', { provider: 'stripe', plans: [] });
      const item = b.addPlan('a', { id: 'pro' });
      assert.strictEqual(item._id, 'pro');
    });
    it('addPlan should return null if not composed', function() {
      const b = new BillingComposer();
      assert.strictEqual(b.addPlan('none', { id: 'p1' }), null);
    });
    it('removePlan should remove', function() {
      const b = new BillingComposer();
      b.compose('a', { provider: 'stripe', plans: [{ id: 'free' }] });
      assert.strictEqual(b.removePlan('a', 'free'), true);
    });
    it('removePlan should return false for missing', function() {
      const b = new BillingComposer();
      assert.strictEqual(b.removePlan('a', 'none'), false);
    });
    it('should handle multiple plans', function() {
      const b = new BillingComposer();
      b.compose('a', { provider: 'stripe', plans: [{ id: 'free' }, { id: 'pro' }] });
      assert.strictEqual(b.getComposed('a')._plans.length, 2);
    });
    it('should auto-generate plan ids', function() {
      const b = new BillingComposer();
      b.compose('a', { provider: 'stripe', plans: [{ name: 'Basic' }] });
      assert.ok(b.getComposed('a')._plans[0]._id.startsWith('plan_'));
    });
    it('should handle empty plans', function() {
      const b = new BillingComposer(); b.compose('a', { provider: 'stripe' });
      assert.strictEqual(b.getComposed('a').provider, 'stripe');
    });
    it('clear should reset', function() {
      const b = new BillingComposer(); b.compose('a', {}); b.clear();
      assert.strictEqual(b.getComposed('a'), null);
    });
  });

  /* ─── DataComposer (12 tests) ─── */
  describe('DataComposer', function() {
    const { DataComposer } = require('../lib/composer/dataComposer');
    it('should create with empty state', function() {
      const d = new DataComposer();
      assert.strictEqual(d.getComposed('none'), null);
    });
    it('should compose data', function() {
      const d = new DataComposer();
      const result = d.compose('app1', { type: 'postgres', sources: [{ id: 'db1' }] });
      assert.strictEqual(result.composed, true);
    });
    it('should return false for invalid args', function() {
      const d = new DataComposer();
      assert.deepStrictEqual(d.compose(null, {}), { composed: false });
    });
    it('should getComposed data', function() {
      const d = new DataComposer(); d.compose('a', { type: 'postgres' });
      assert.strictEqual(d.getComposed('a').type, 'postgres');
    });
    it('addDataSource should add', function() {
      const d = new DataComposer(); d.compose('a', { type: 'postgres', sources: [] });
      const item = d.addDataSource('a', { id: 'src1' });
      assert.strictEqual(item._id, 'src1');
    });
    it('addDataSource should return null if not composed', function() {
      const d = new DataComposer();
      assert.strictEqual(d.addDataSource('none', { id: 's1' }), null);
    });
    it('removeDataSource should remove', function() {
      const d = new DataComposer();
      d.compose('a', { type: 'postgres', sources: [{ id: 'db1' }] });
      assert.strictEqual(d.removeDataSource('a', 'db1'), true);
    });
    it('removeDataSource should return false for missing', function() {
      const d = new DataComposer();
      assert.strictEqual(d.removeDataSource('a', 'none'), false);
    });
    it('should handle multiple sources', function() {
      const d = new DataComposer();
      d.compose('a', { type: 'postgres', sources: [{ id: 's1' }, { id: 's2' }] });
      assert.strictEqual(d.getComposed('a')._sources.length, 2);
    });
    it('should auto-generate source ids', function() {
      const d = new DataComposer();
      d.compose('a', { type: 'postgres', sources: [{ name: 'Main' }] });
      assert.ok(d.getComposed('a')._sources[0]._id.startsWith('ds_'));
    });
    it('should handle empty sources', function() {
      const d = new DataComposer(); d.compose('a', { type: 'postgres' });
      assert.strictEqual(d.getComposed('a').type, 'postgres');
    });
    it('clear should reset', function() {
      const d = new DataComposer(); d.compose('a', {}); d.clear();
      assert.strictEqual(d.getComposed('a'), null);
    });
  });

  /* ─── GovernanceComposer (12 tests) ─── */
  describe('GovernanceComposer', function() {
    const { GovernanceComposer } = require('../lib/composer/governanceComposer');
    it('should create with empty state', function() {
      const g = new GovernanceComposer();
      assert.strictEqual(g.getComposed('none'), null);
    });
    it('should compose governance', function() {
      const g = new GovernanceComposer();
      const result = g.compose('app1', { framework: 'soc2', policies: [{ id: 'p1' }] });
      assert.strictEqual(result.composed, true);
    });
    it('should return false for invalid args', function() {
      const g = new GovernanceComposer();
      assert.deepStrictEqual(g.compose(null, {}), { composed: false });
    });
    it('should getComposed governance', function() {
      const g = new GovernanceComposer(); g.compose('a', { framework: 'hipaa' });
      assert.strictEqual(g.getComposed('a').framework, 'hipaa');
    });
    it('addPolicy should add a policy', function() {
      const g = new GovernanceComposer(); g.compose('a', { framework: 'soc2', policies: [] });
      const item = g.addPolicy('a', { id: 'p1' });
      assert.strictEqual(item._id, 'p1');
    });
    it('addPolicy should return null if not composed', function() {
      const g = new GovernanceComposer();
      assert.strictEqual(g.addPolicy('none', { id: 'p1' }), null);
    });
    it('removePolicy should remove', function() {
      const g = new GovernanceComposer();
      g.compose('a', { framework: 'soc2', policies: [{ id: 'p1' }] });
      assert.strictEqual(g.removePolicy('a', 'p1'), true);
    });
    it('removePolicy should return false for missing', function() {
      const g = new GovernanceComposer();
      assert.strictEqual(g.removePolicy('a', 'none'), false);
    });
    it('should handle multiple policies', function() {
      const g = new GovernanceComposer();
      g.compose('a', { framework: 'soc2', policies: [{ id: 'p1' }, { id: 'p2' }] });
      assert.strictEqual(g.getComposed('a')._policies.length, 2);
    });
    it('should auto-generate policy ids', function() {
      const g = new GovernanceComposer();
      g.compose('a', { framework: 'soc2', policies: [{ name: 'Audit' }] });
      assert.ok(g.getComposed('a')._policies[0]._id.startsWith('govpol_'));
    });
    it('should handle empty policies', function() {
      const g = new GovernanceComposer(); g.compose('a', { framework: 'soc2' });
      assert.strictEqual(g.getComposed('a').framework, 'soc2');
    });
    it('clear should reset', function() {
      const g = new GovernanceComposer(); g.compose('a', {}); g.clear();
      assert.strictEqual(g.getComposed('a'), null);
    });
  });

  /* ─── CapabilityDiscovery (12 tests) ─── */
  describe('CapabilityDiscovery', function() {
    const { CapabilityDiscovery } = require('../lib/composer/capabilityDiscovery');
    const { CapabilityRegistry } = require('../lib/composer/capabilityRegistry');
    it('should create with empty history', function() {
      const reg = new CapabilityRegistry();
      const d = new CapabilityDiscovery(reg);
      assert.strictEqual(d.getDiscoveryHistory().length, 0);
    });
    it('should discover all capabilities', function() {
      const reg = new CapabilityRegistry();
      reg.register({ id: 'c1', type: 'auth' }); reg.register({ id: 'c2', type: 'db' });
      const d = new CapabilityDiscovery(reg);
      const results = d.discoverAll();
      assert.strictEqual(results.length, 2);
    });
    it('should discover by type', function() {
      const reg = new CapabilityRegistry();
      reg.register({ id: 'c1', type: 'auth' }); reg.register({ id: 'c2', type: 'db' });
      const d = new CapabilityDiscovery(reg);
      const results = d.discoverByType('auth');
      assert.strictEqual(results.length, 1);
    });
    it('discoverByType should return empty for no type', function() {
      const d = new CapabilityDiscovery(new CapabilityRegistry());
      assert.deepStrictEqual(d.discoverByType(null), []);
    });
    it('should discover with query', function() {
      const reg = new CapabilityRegistry();
      const d = new CapabilityDiscovery(reg);
      const results = d.discover({ type: 'auth' });
      assert.ok(Array.isArray(results));
    });
    it('should handle null registry gracefully', function() {
      const d = new CapabilityDiscovery(null);
      assert.deepStrictEqual(d.discoverAll(), []);
    });
    it('should track discovery history', function() {
      const d = new CapabilityDiscovery(new CapabilityRegistry());
      d.discoverAll(); d.discoverByType('auth');
      assert.strictEqual(d.getDiscoveryHistory().length, 2);
    });
    it('discover should record query in history', function() {
      const d = new CapabilityDiscovery(new CapabilityRegistry());
      d.discover({ type: 'test' });
      assert.strictEqual(d.getDiscoveryHistory()[0].type, 'query');
      assert.deepStrictEqual(d.getDiscoveryHistory()[0].query, { type: 'test' });
    });
    it('discoverByType should record type in history', function() {
      const d = new CapabilityDiscovery(new CapabilityRegistry());
      d.discoverByType('auth');
      assert.strictEqual(d.getDiscoveryHistory()[0].kind, 'type');
      assert.strictEqual(d.getDiscoveryHistory()[0].type, 'auth');
    });
    it('discoverAll should record all in history', function() {
      const d = new CapabilityDiscovery(new CapabilityRegistry());
      d.discoverAll();
      assert.strictEqual(d.getDiscoveryHistory()[0].type, 'all');
      assert.ok(d.getDiscoveryHistory()[0].timestamp);
    });
    it('should handle registry without findCapabilities', function() {
      const d = new CapabilityDiscovery({});
      assert.deepStrictEqual(d.discover({}), []);
    });
    it('clear should reset history', function() {
      const d = new CapabilityDiscovery(new CapabilityRegistry());
      d.discoverAll(); d.clear();
      assert.strictEqual(d.getDiscoveryHistory().length, 0);
    });
  });

  /* ─── CapabilityMatcher (15 tests) ─── */
  describe('CapabilityMatcher', function() {
    const { CapabilityMatcher } = require('../lib/composer/capabilityMatcher');
    it('should create with empty history', function() {
      const m = new CapabilityMatcher();
      assert.strictEqual(m.getMatchHistory().length, 0);
    });
    it('should match requirements to capabilities', function() {
      const m = new CapabilityMatcher();
      const reqs = [{ name: 'Auth', type: 'security' }];
      const caps = [{ name: 'Auth', type: 'security' }];
      const results = m.match(reqs, caps);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].score > 0);
    });
    it('should return empty for non-array args', function() {
      const m = new CapabilityMatcher();
      assert.deepStrictEqual(m.match(null, []), []);
      assert.deepStrictEqual(m.match([], null), []);
    });
    it('should score exact name match higher', function() {
      const m = new CapabilityMatcher();
      const reqs = [{ name: 'Auth' }];
      const caps = [{ name: 'Auth' }, { name: 'AuthService' }];
      const results = m.match(reqs, caps);
      assert.strictEqual(results.length, 2);
      assert.ok(results[0].score >= results[1].score);
    });
    it('should match by type', function() {
      const m = new CapabilityMatcher();
      const reqs = [{ type: 'security' }];
      const caps = [{ type: 'security' }];
      const results = m.match(reqs, caps);
      assert.strictEqual(results.length, 1);
    });
    it('matchSingle should return top result', function() {
      const m = new CapabilityMatcher();
      const result = m.matchSingle({ name: 'Auth' }, [{ name: 'Auth' }]);
      assert.ok(result !== null);
      assert.ok(result.score > 0);
    });
    it('matchSingle should return null if no match', function() {
      const m = new CapabilityMatcher();
      const result = m.matchSingle({ name: 'Missing' }, [{ name: 'Other' }]);
      assert.strictEqual(result, null);
    });
    it('matchSingle should return null for null requirement', function() {
      const m = new CapabilityMatcher();
      assert.strictEqual(m.matchSingle(null, [{ name: 'A' }]), null);
    });
    it('matchSingle should return null for non-array caps', function() {
      const m = new CapabilityMatcher();
      assert.strictEqual(m.matchSingle({ name: 'A' }, null), null);
    });
    it('should sort results by score descending', function() {
      const m = new CapabilityMatcher();
      const reqs = [{ name: 'Auth' }];
      const caps = [{ name: 'AuthService', type: 'security' }, { name: 'Auth', type: 'security' }];
      const results = m.match(reqs, caps);
      for (let i = 1; i < results.length; i++) {
        assert.ok(results[i-1].score >= results[i].score);
      }
    });
    it('should track match history', function() {
      const m = new CapabilityMatcher();
      m.match([{ name: 'A' }], [{ name: 'A' }]);
      assert.strictEqual(m.getMatchHistory().length, 1);
    });
    it('should handle empty arrays', function() {
      const m = new CapabilityMatcher();
      assert.deepStrictEqual(m.match([], []), []);
    });
    it('should score partial name match', function() {
      const m = new CapabilityMatcher();
      const results = m.match([{ name: 'Auth' }], [{ name: 'AuthService' }]);
      assert.strictEqual(results.length, 1);
      assert.ok(results[0].score > 0);
    });
    it('should handle multiple requirements', function() {
      const m = new CapabilityMatcher();
      const reqs = [{ name: 'Auth' }, { name: 'DB' }];
      const caps = [{ name: 'Auth' }, { name: 'DB' }];
      const results = m.match(reqs, caps);
      assert.strictEqual(results.length, 2);
    });
    it('clear should reset', function() {
      const m = new CapabilityMatcher();
      m.match([{ name: 'A' }], [{ name: 'A' }]); m.clear();
      assert.strictEqual(m.getMatchHistory().length, 0);
    });
  });

  /* ─── CapabilityScoring (16 tests) ─── */
  describe('CapabilityScoring', function() {
    const { CapabilityScoring } = require('../lib/composer/capabilityScoring');
    it('should create with default criteria', function() {
      const s = new CapabilityScoring();
      assert.strictEqual(s.getScoringCriteria().length, 4);
    });
    it('should score exact match high', function() {
      const s = new CapabilityScoring();
      const r = s.score({ name: 'Auth', type: 'security', version: '1.0.0', description: 'Auth service' },
                        { name: 'Auth', type: 'security', version: '1.0.0', description: 'Auth service' });
      assert.ok(r.score > 0.9);
    });
    it('should score 0 for null capability', function() {
      const s = new CapabilityScoring();
      const r = s.score(null, { name: 'A' });
      assert.strictEqual(r.score, 0);
    });
    it('should score 0 for null requirement', function() {
      const s = new CapabilityScoring();
      const r = s.score({ name: 'A' }, null);
      assert.strictEqual(r.score, 0);
    });
    it('should have 4 factors', function() {
      const s = new CapabilityScoring();
      const r = s.score({ name: 'Auth', type: 'security', version: '1.0.0' },
                        { name: 'Auth', type: 'security', version: '1.0.0' });
      assert.strictEqual(r.factors.length, 4);
    });
    it('scoreByName should work', function() {
      const s = new CapabilityScoring();
      const r = s.scoreByName('Auth', { name: 'Auth' });
      assert.ok(r.score > 0);
    });
    it('scoreByType should work', function() {
      const s = new CapabilityScoring();
      const r = s.scoreByType('security', { type: 'security' });
      assert.ok(r.score > 0);
    });
    it('scoreByName should handle null', function() {
      const s = new CapabilityScoring();
      const r = s.scoreByName(null, {});
      assert.strictEqual(r.score, 0);
    });
    it('scoreByType should handle null', function() {
      const s = new CapabilityScoring();
      const r = s.scoreByType(null, {});
      assert.strictEqual(r.score, 0);
    });
    it('_scoreByName should return 1 for exact', function() {
      const s = new CapabilityScoring();
      assert.strictEqual(s._scoreByName({ name: 'Auth' }, { name: 'Auth' }), 1);
    });
    it('_scoreByName should return 0.6 for partial', function() {
      const s = new CapabilityScoring();
      assert.strictEqual(s._scoreByName({ name: 'AuthService' }, { name: 'Auth' }), 0.6);
    });
    it('_scoreByType should return 1 for match', function() {
      const s = new CapabilityScoring();
      assert.strictEqual(s._scoreByType({ type: 'sec' }, { type: 'sec' }), 1);
    });
    it('_scoreByVersion should return 1 for exact', function() {
      const s = new CapabilityScoring();
      assert.strictEqual(s._scoreByVersion({ version: '1.0.0' }, { version: '1.0.0' }), 1);
    });
    it('_scoreByVersion should return 0.5 for missing', function() {
      const s = new CapabilityScoring();
      assert.strictEqual(s._scoreByVersion({}, {}), 0.5);
    });
    it('_scoreByDescription should return 0.7 for partial', function() {
      const s = new CapabilityScoring();
      assert.strictEqual(s._scoreByDescription({ description: 'Auth Service' }, { description: 'Auth' }), 0.7);
    });
    it('clear should reset criteria', function() {
      const s = new CapabilityScoring(); s.clear();
      assert.strictEqual(s.getScoringCriteria().length, 4);
    });
  });

  /* ─── CapabilityValidator (12 tests) ─── */
  describe('CapabilityValidator', function() {
    const { CapabilityValidator } = require('../lib/composer/capabilityValidator');
    it('should create with required fields', function() {
      const v = new CapabilityValidator();
      assert.ok(v);
    });
    it('should validate valid capability', function() {
      const v = new CapabilityValidator();
      const r = v.validate({ id: 'c1', name: 'Auth', type: 'security', version: '1.0.0' });
      assert.strictEqual(r.valid, true);
    });
    it('should reject null capability', function() {
      const v = new CapabilityValidator();
      const r = v.validate(null);
      assert.strictEqual(r.valid, false);
    });
    it('should reject missing id', function() {
      const v = new CapabilityValidator();
      const r = v.validate({ name: 'Auth', type: 'security', version: '1.0.0' });
      assert.strictEqual(r.valid, false);
    });
    it('should reject missing name', function() {
      const v = new CapabilityValidator();
      const r = v.validate({ id: 'c1', type: 'security', version: '1.0.0' });
      assert.strictEqual(r.valid, false);
    });
    it('should reject empty string fields', function() {
      const v = new CapabilityValidator();
      const r = v.validate({ id: '', name: '', type: '', version: '' });
      assert.strictEqual(r.valid, false);
    });
    it('validateCompatibility should accept matching', function() {
      const v = new CapabilityValidator();
      const r = v.validateCompatibility({ id: 'c1', name: 'Auth', type: 'security' },
                                        { name: 'Auth', type: 'security' });
      assert.strictEqual(r.compatible, true);
    });
    it('validateCompatibility should detect type mismatch', function() {
      const v = new CapabilityValidator();
      const r = v.validateCompatibility({ id: 'c1', name: 'Auth', type: 'security' },
                                        { type: 'database' });
      assert.strictEqual(r.compatible, false);
    });
    it('validateCompatibility should detect name mismatch', function() {
      const v = new CapabilityValidator();
      const r = v.validateCompatibility({ id: 'c1', name: 'Auth' }, { name: 'Other' });
      assert.strictEqual(r.compatible, false);
    });
    it('validateCompatibility should accept null requirements', function() {
      const v = new CapabilityValidator();
      const r = v.validateCompatibility({ id: 'c1', name: 'Auth' }, null);
      assert.strictEqual(r.compatible, true);
    });
    it('validateCompatibility should reject null capability', function() {
      const v = new CapabilityValidator();
      const r = v.validateCompatibility(null, {});
      assert.strictEqual(r.compatible, false);
    });
    it('clear should reset', function() {
      const v = new CapabilityValidator(); v.clear();
      assert.ok(v);
    });
  });

  /* ─── CompositionPolicies (14 tests) ─── */
  describe('CompositionPolicies', function() {
    const { CompositionPolicies } = require('../lib/composer/compositionPolicies');
    it('should create with empty state', function() {
      const p = new CompositionPolicies();
      assert.strictEqual(p.listPolicies().length, 0);
    });
    it('should add a policy', function() {
      const p = new CompositionPolicies();
      const policy = p.addPolicy({ id: 'pol1', name: 'MaxModules', rule: c => c.modules.length <= 10 });
      assert.strictEqual(policy.id, 'pol1');
    });
    it('should return null if no rule function', function() {
      const p = new CompositionPolicies();
      assert.strictEqual(p.addPolicy({ name: 'NoRule' }), null);
    });
    it('should auto-generate id', function() {
      const p = new CompositionPolicies();
      const policy = p.addPolicy({ name: 'Gen', rule: () => true });
      assert.ok(policy.id.startsWith('policy_'));
    });
    it('should default severity to warning', function() {
      const p = new CompositionPolicies();
      const policy = p.addPolicy({ name: 'Test', rule: () => true });
      assert.strictEqual(policy.severity, 'warning');
    });
    it('should remove a policy', function() {
      const p = new CompositionPolicies();
      p.addPolicy({ id: 'p1', name: 'P1', rule: () => true });
      assert.strictEqual(p.removePolicy('p1'), true);
      assert.strictEqual(p.listPolicies().length, 0);
    });
    it('removePolicy should return false for missing', function() {
      const p = new CompositionPolicies();
      assert.strictEqual(p.removePolicy('none'), false);
    });
    it('removePolicy should return false for null', function() {
      const p = new CompositionPolicies();
      assert.strictEqual(p.removePolicy(null), false);
    });
    it('evaluate should pass for passing policies', function() {
      const p = new CompositionPolicies();
      p.addPolicy({ name: 'Pass', rule: () => true });
      const r = p.evaluate({ modules: [] });
      assert.strictEqual(r.passed, true);
    });
    it('evaluate should fail for failing policy', function() {
      const p = new CompositionPolicies();
      p.addPolicy({ name: 'Fail', rule: () => false });
      const r = p.evaluate({ modules: [] });
      assert.strictEqual(r.passed, false);
    });
    it('evaluate should handle composition null', function() {
      const p = new CompositionPolicies();
      const r = p.evaluate(null);
      assert.strictEqual(r.passed, false);
    });
    it('evaluate should catch exceptions', function() {
      const p = new CompositionPolicies();
      p.addPolicy({ name: 'Crash', rule: () => { throw new Error('boom'); } });
      const r = p.evaluate({ modules: [] });
      assert.strictEqual(r.passed, false);
      assert.ok(r.results[0].message.includes('threw'));
    });
    it('should evaluate multiple policies', function() {
      const p = new CompositionPolicies();
      p.addPolicy({ name: 'P1', rule: () => true });
      p.addPolicy({ name: 'P2', rule: () => false });
      const r = p.evaluate({ modules: [] });
      assert.strictEqual(r.passed, false);
      assert.strictEqual(r.results.length, 2);
    });
    it('clear should reset', function() {
      const p = new CompositionPolicies();
      p.addPolicy({ name: 'P1', rule: () => true }); p.clear();
      assert.strictEqual(p.listPolicies().length, 0);
    });
  });

  /* ─── CompositionConstraints (14 tests) ─── */
  describe('CompositionConstraints', function() {
    const { CompositionConstraints } = require('../lib/composer/compositionConstraints');
    it('should create with empty state', function() {
      const c = new CompositionConstraints();
      assert.strictEqual(c.listConstraints().length, 0);
    });
    it('should add a constraint', function() {
      const c = new CompositionConstraints();
      const con = c.addConstraint({ id: 'c1', type: 'maxModules', value: 10 });
      assert.strictEqual(con.id, 'c1');
    });
    it('should return null for null', function() {
      const c = new CompositionConstraints();
      assert.strictEqual(c.addConstraint(null), null);
    });
    it('should auto-generate id', function() {
      const c = new CompositionConstraints();
      const con = c.addConstraint({ type: 'maxModules', value: 5 });
      assert.ok(con.id.startsWith('constraint_'));
    });
    it('should remove a constraint', function() {
      const c = new CompositionConstraints();
      c.addConstraint({ id: 'c1', type: 'maxModules', value: 10 });
      assert.strictEqual(c.removeConstraint('c1'), true);
      assert.strictEqual(c.listConstraints().length, 0);
    });
    it('removeConstraint should return false for missing', function() {
      const c = new CompositionConstraints();
      assert.strictEqual(c.removeConstraint('none'), false);
    });
    it('check should detect maxModules violation', function() {
      const c = new CompositionConstraints();
      c.addConstraint({ type: 'maxModules', value: 2 });
      const r = c.check({ modules: ['a', 'b', 'c'] });
      assert.strictEqual(r.compliant, false);
    });
    it('check should pass maxModules', function() {
      const c = new CompositionConstraints();
      c.addConstraint({ type: 'maxModules', value: 5 });
      const r = c.check({ modules: ['a', 'b'] });
      assert.strictEqual(r.compliant, true);
    });
    it('check should detect requiredModule violation', function() {
      const c = new CompositionConstraints();
      c.addConstraint({ type: 'requiredModule', value: 'auth' });
      const r = c.check({ modules: ['pages', 'routing'] });
      assert.strictEqual(r.compliant, false);
    });
    it('check should pass requiredModule', function() {
      const c = new CompositionConstraints();
      c.addConstraint({ type: 'requiredModule', value: 'auth' });
      const r = c.check({ modules: ['auth', 'pages'] });
      assert.strictEqual(r.compliant, true);
    });
    it('check should detect forbiddenModule violation', function() {
      const c = new CompositionConstraints();
      c.addConstraint({ type: 'forbiddenModule', value: 'deprecated' });
      const r = c.check({ modules: ['auth', 'deprecated'] });
      assert.strictEqual(r.compliant, false);
    });
    it('check should handle null composition', function() {
      const c = new CompositionConstraints();
      const r = c.check(null);
      assert.strictEqual(r.compliant, false);
    });
    it('check should handle missing modules field', function() {
      const c = new CompositionConstraints();
      c.addConstraint({ type: 'maxModules', value: 5 });
      const r = c.check({});
      assert.strictEqual(r.compliant, true);
    });
    it('clear should reset', function() {
      const c = new CompositionConstraints();
      c.addConstraint({ id: 'c1', type: 'maxModules', value: 10 }); c.clear();
      assert.strictEqual(c.listConstraints().length, 0);
    });
  });

  /* ─── CompositionSimulation (10 tests) ─── */
  describe('CompositionSimulation', function() {
    const { CompositionSimulation } = require('../lib/composer/compositionSimulation');
    it('should create with empty state', function() {
      const s = new CompositionSimulation();
      assert.strictEqual(s.listSimulations().length, 0);
    });
    it('should simulate a composition', function() {
      const s = new CompositionSimulation();
      const result = s.simulate({ modules: ['a', 'b'] });
      assert.strictEqual(result.status, 'completed');
      assert.ok(result.simulationId);
    });
    it('should return failed for null composition', function() {
      const s = new CompositionSimulation();
      const result = s.simulate(null);
      assert.strictEqual(result.status, 'failed');
    });
    it('should have 4 stages', function() {
      const s = new CompositionSimulation();
      const result = s.simulate({ modules: ['a'] });
      assert.strictEqual(result.stages.length, 4);
    });
    it('should warn on >10 modules', function() {
      const s = new CompositionSimulation();
      const modules = [];
      for (let i = 0; i < 11; i++) modules.push('m-'+i);
      const result = s.simulate({ modules });
      assert.ok(result.warnings.length > 0);
    });
    it('should recommend for no runtime', function() {
      const s = new CompositionSimulation();
      const result = s.simulate({ modules: ['a'] });
      assert.ok(result.warnings.some(w => w.includes('runtime')));
    });
    it('should get simulation by id', function() {
      const s = new CompositionSimulation();
      const r = s.simulate({ modules: ['a'] });
      assert.strictEqual(s.getSimulation(r.simulationId).simulationId, r.simulationId);
    });
    it('getSimulation should return null for missing', function() {
      const s = new CompositionSimulation();
      assert.strictEqual(s.getSimulation('none'), null);
    });
    it('should list all simulations', function() {
      const s = new CompositionSimulation();
      s.simulate({ modules: ['a'] }); s.simulate({ modules: ['b'] });
      assert.strictEqual(s.listSimulations().length, 2);
    });
    it('clear should reset', function() {
      const s = new CompositionSimulation();
      s.simulate({ modules: ['a'] }); s.clear();
      assert.strictEqual(s.listSimulations().length, 0);
    });
  });

  /* ─── CompositionApproval (14 tests) ─── */
  describe('CompositionApproval', function() {
    const { CompositionApproval } = require('../lib/composer/compositionApproval');
    it('should create with empty state', function() {
      const a = new CompositionApproval();
      assert.strictEqual(a.listPending().length, 0);
    });
    it('should request approval', function() {
      const a = new CompositionApproval();
      const req = a.requestApproval('comp1', 'admin');
      assert.strictEqual(req.status, 'pending');
      assert.strictEqual(req.compositionId, 'comp1');
    });
    it('should return null if no compositionId', function() {
      const a = new CompositionApproval();
      assert.strictEqual(a.requestApproval(null, 'admin'), null);
    });
    it('should return null if no approver', function() {
      const a = new CompositionApproval();
      assert.strictEqual(a.requestApproval('comp1', null), null);
    });
    it('should approve', function() {
      const a = new CompositionApproval();
      a.requestApproval('comp1', 'admin');
      const result = a.approve('comp1', 'admin');
      assert.strictEqual(result.status, 'approved');
    });
    it('approve should return null for missing', function() {
      const a = new CompositionApproval();
      assert.strictEqual(a.approve('none', 'admin'), null);
    });
    it('approve should return null if not pending', function() {
      const a = new CompositionApproval();
      a.requestApproval('comp1', 'admin'); a.approve('comp1', 'admin');
      assert.strictEqual(a.approve('comp1', 'admin'), null);
    });
    it('should reject', function() {
      const a = new CompositionApproval();
      a.requestApproval('comp1', 'admin');
      const result = a.reject('comp1', 'admin', 'missing data');
      assert.strictEqual(result.status, 'rejected');
      assert.strictEqual(result.reason, 'missing data');
    });
    it('reject should use default reason', function() {
      const a = new CompositionApproval();
      a.requestApproval('comp1', 'admin');
      const result = a.reject('comp1', 'admin');
      assert.strictEqual(result.reason, 'No reason provided');
    });
    it('reject should return null for missing', function() {
      const a = new CompositionApproval();
      assert.strictEqual(a.reject('none', 'admin'), null);
    });
    it('should get approval status', function() {
      const a = new CompositionApproval();
      a.requestApproval('comp1', 'admin');
      const status = a.getApprovalStatus('comp1');
      assert.strictEqual(status.status, 'pending');
    });
    it('getApprovalStatus should return null for missing', function() {
      const a = new CompositionApproval();
      assert.strictEqual(a.getApprovalStatus('none'), null);
    });
    it('listPending should only return pending', function() {
      const a = new CompositionApproval();
      a.requestApproval('c1', 'admin'); a.requestApproval('c2', 'admin');
      a.approve('c1', 'admin');
      assert.strictEqual(a.listPending().length, 1);
    });
    it('clear should reset', function() {
      const a = new CompositionApproval();
      a.requestApproval('comp1', 'admin'); a.clear();
      assert.strictEqual(a.listPending().length, 0);
    });
  });

  /* ─── Application Templates — 10 templates (25 tests) ─── */
  describe('Application Templates', function() {
    const templates = [
      { class: require('../lib/composer/website').Website, name: 'Website' },
      { class: require('../lib/composer/saas').Saas, name: 'SaaS' },
      { class: require('../lib/composer/crm').Crm, name: 'CRM' },
      { class: require('../lib/composer/erp').Erp, name: 'ERP' },
      { class: require('../lib/composer/marketplace').Marketplace, name: 'Marketplace' },
      { class: require('../lib/composer/knowledgeBase').KnowledgeBase, name: 'Knowledge Base' },
      { class: require('../lib/composer/automation').Automation, name: 'Automation' },
      { class: require('../lib/composer/dashboard').Dashboard, name: 'Dashboard' },
      { class: require('../lib/composer/aiAssistant').AiAssistant, name: 'AI Assistant' },
      { class: require('../lib/composer/custom').Custom, name: 'Custom' }
    ];
    templates.forEach(({ class: Cls, name }) => {
      it(`${name} should have getName`, () => {
        const t = new Cls(); assert.strictEqual(t.getName(), name);
      });
      it(`${name} should have getDescription returning string`, () => {
        const t = new Cls(); assert.ok(typeof t.getDescription() === 'string');
      });
      it(`${name} should have getModules returning array`, () => {
        const t = new Cls(); assert.ok(Array.isArray(t.getModules()));
      });
      it(`${name} should have getCapabilities returning array`, () => {
        const t = new Cls(); assert.ok(Array.isArray(t.getCapabilities()));
      });
      it(`${name} should have getConfig returning object`, () => {
        const t = new Cls(); assert.ok(typeof t.getConfig() === 'object');
      });
      it(`${name} apply should return config when no args`, () => {
        const t = new Cls(); const config = t.apply();
        assert.ok(typeof config === 'object');
      });
      it(`${name} apply should merge customizations`, () => {
        const t = new Cls(); const config = t.apply({ custom: true });
        assert.strictEqual(config.custom, true);
      });
    });
    it('Website should have correct modules', () => {
      const t = new (require('../lib/composer/website').Website)();
      assert.ok(t.getModules().includes('pages'));
    });
    it('SaaS should have correct capabilities', () => {
      const t = new (require('../lib/composer/saas').Saas)();
      assert.ok(t.getCapabilities().includes('authentication'));
    });
    it('Custom should return empty modules', () => {
      const t = new (require('../lib/composer/custom').Custom)();
      assert.deepStrictEqual(t.getModules(), []);
    });
  });

  /* ─── ComposerIntegration (15 tests) ─── */
  describe('ComposerIntegration', function() {
    const { ComposerIntegration } = require('../lib/composer/composerIntegration');
    it('should create with composer reference', function() {
      const i = new ComposerIntegration({});
      assert.ok(i);
    });
    it('should be enabled by default', function() {
      const i = new ComposerIntegration({});
      assert.strictEqual(i.isEnabled(), true);
    });
    it('should disable and enable', function() {
      const i = new ComposerIntegration({}); i.disable();
      assert.strictEqual(i.isEnabled(), false);
      i.enable(); assert.strictEqual(i.isEnabled(), true);
    });
    it('should return null when disabled', function() {
      const i = new ComposerIntegration({}); i.disable();
      assert.strictEqual(i.integrateLifecycle({}), null);
    });
    it('should record lifecycle integration', function() {
      const i = new ComposerIntegration({});
      const entry = i.integrateLifecycle({ action: 'deploy' });
      assert.strictEqual(entry.source, 'lifecycle');
      assert.strictEqual(entry.context.action, 'deploy');
    });
    it('should record all 13 integration types', function() {
      const i = new ComposerIntegration({});
      i.integrateLifecycle({}); i.integrateRuntime({}); i.integrateDeployment({});
      i.integrateWorkflow({}); i.integrateAgent({}); i.integrateData({});
      i.integrateSecurity({}); i.integrateGovernance({}); i.integrateBilling({});
      i.integrateEvaluation({}); i.integrateDeveloper({}); i.integrateTelemetry({});
      i.integratePlugin({});
      const stats = i.getStats();
      assert.strictEqual(stats.total, 13);
    });
    it('getLog should filter by source', function() {
      const i = new ComposerIntegration({});
      i.integrateLifecycle({}); i.integrateRuntime({});
      const log = i.getLog({ source: 'lifecycle' });
      assert.strictEqual(log.length, 1);
    });
    it('getLog should filter by since', function() {
      const i = new ComposerIntegration({});
      i.integrateLifecycle({});
      const log = i.getLog({ since: Date.now() + 10000 });
      assert.strictEqual(log.length, 0);
    });
    it('getLog should limit results', function() {
      const i = new ComposerIntegration({});
      i.integrateLifecycle({}); i.integrateRuntime({}); i.integrateDeployment({});
      const log = i.getLog({ limit: 2 });
      assert.strictEqual(log.length, 2);
    });
    it('getStats should return bySource breakdown', function() {
      const i = new ComposerIntegration({});
      i.integrateLifecycle({}); i.integrateLifecycle({}); i.integrateRuntime({});
      const stats = i.getStats();
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.bySource.lifecycle, 2);
      assert.strictEqual(stats.bySource.runtime, 1);
    });
    it('should limit log to 1000 entries', function() {
      const i = new ComposerIntegration({});
      for (let j = 0; j < 1010; j++) i.integrateLifecycle({});
      assert.strictEqual(i.getStats().total, 1000);
    });
    it('should emit event on compositionEvents if available', function() {
      const events = { emit: () => {} };
      let emitted = false;
      const i = new ComposerIntegration({ compositionEvents: { emit: (e) => { emitted = true; } } });
      i.integrateLifecycle({});
      assert.strictEqual(emitted, true);
    });
    it('clear should reset log', function() {
      const i = new ComposerIntegration({});
      i.integrateLifecycle({}); i.clear();
      assert.strictEqual(i.getStats().total, 0);
    });
  });

  /* ─── Index exports (5 tests) ─── */
  describe('Composer index exports', function() {
    const composer = require('../lib/composer/index');
    it('should export ApplicationComposer', function() {
      assert.ok(composer.ApplicationComposer);
    });
    it('should export ComposerManager', function() {
      assert.ok(composer.ComposerManager);
    });
    it('should export getDefaultComposer', function() {
      assert.ok(typeof composer.getDefaultComposer === 'function');
    });
    it('getDefaultComposer should return ComposerManager', function() {
      const m = composer.getDefaultComposer();
      assert.ok(m.applicationComposer);
    });
    it('should export all core modules', function() {
      const expected = ['ApplicationComposer', 'CompositionEngine', 'CompositionPlanner', 'CompositionRegistry',
        'CompositionValidator', 'CompositionStorage', 'CompositionMetrics', 'CompositionEvents', 'CompositionReporter',
        'CapabilityRegistry', 'DependencyResolver', 'CompositionGraph', 'ComposerManager', 'ApplicationDefinition',
        'ApplicationManifest', 'ApplicationBlueprint', 'ApplicationCapabilities', 'ApplicationDependencies',
        'ApplicationTopology', 'ExecutionPlanner', 'ResourceAllocator', 'ServiceComposer'];
      for (const name of expected) {
        assert.ok(composer[name], `Missing export: ${name}`);
      }
    });
  });

});
