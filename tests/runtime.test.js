const assert = require('assert');

const { RuntimeManager } = require('../lib/runtime/runtimeManager');
const { RuntimeRegistry } = require('../lib/runtime/runtimeRegistry');
const { RuntimeStorage } = require('../lib/runtime/runtimeStorage');
const { RuntimeEvents } = require('../lib/runtime/runtimeEvents');
const { RuntimeMetrics } = require('../lib/runtime/runtimeMetrics');
const { RuntimeHealth } = require('../lib/runtime/runtimeHealth');
const { RuntimeScheduler } = require('../lib/runtime/runtimeScheduler');
const { RuntimeHistory } = require('../lib/runtime/runtimeHistory');
const { RuntimeReporter } = require('../lib/runtime/runtimeReporter');
const { FeatureFlagRegistry } = require('../lib/runtime/featureFlagRegistry');
const { FeatureFlagTargeting } = require('../lib/runtime/featureFlagTargeting');
const { FeatureFlagEvaluator } = require('../lib/runtime/featureFlagEvaluator');
const { FeatureFlagRollouts } = require('../lib/runtime/featureFlagRollouts');
const { FeatureFlagExperiments } = require('../lib/runtime/featureFlagExperiments');
const { FeatureFlagAudit } = require('../lib/runtime/featureFlagAudit');
const { FeatureFlagManager } = require('../lib/runtime/featureFlagManager');
const { ConfigurationRegistry } = require('../lib/runtime/configurationRegistry');
const { ConfigurationSources } = require('../lib/runtime/configurationSources');
const { ConfigurationOverrides } = require('../lib/runtime/configurationOverrides');
const { ConfigurationProfiles } = require('../lib/runtime/configurationProfiles');
const { ConfigurationValidation } = require('../lib/runtime/configurationValidation');
const { ConfigurationManager } = require('../lib/runtime/configurationManager');
const { SecretProviders } = require('../lib/runtime/secretProviders');
const { SecretRotation } = require('../lib/runtime/secretRotation');
const { SecretVersioning } = require('../lib/runtime/secretVersioning');
const { SecretAudit } = require('../lib/runtime/secretAudit');
const { SecretManager } = require('../lib/runtime/secretManager');
const { ServiceRegistry } = require('../lib/runtime/serviceRegistry');
const { ServiceDiscovery } = require('../lib/runtime/serviceDiscovery');
const { ServiceHealth } = require('../lib/runtime/serviceHealth');
const { ServiceResolver } = require('../lib/runtime/serviceResolver');
const { DistributedLocks } = require('../lib/runtime/distributedLocks');
const { LeaseManager } = require('../lib/runtime/leaseManager');
const { LeaderRuntime } = require('../lib/runtime/leaderRuntime');
const { CoordinationEngine } = require('../lib/runtime/coordinationEngine');
const { RuntimePolicies } = require('../lib/runtime/runtimePolicies');
const { RuntimeConstraints } = require('../lib/runtime/runtimeConstraints');
const { RuntimeApprovals } = require('../lib/runtime/runtimeApprovals');
const { RuntimeSimulation } = require('../lib/runtime/runtimeSimulation');
const { RolloutManager } = require('../lib/runtime/rolloutManager');
const { CanaryRollout } = require('../lib/runtime/canaryRollout');
const { BlueGreenRollout } = require('../lib/runtime/blueGreenRollout');
const { ProgressiveRollout } = require('../lib/runtime/progressiveRollout');
const { RollbackManager } = require('../lib/runtime/rollbackManager');
const { KillSwitchManager } = require('../lib/runtime/killSwitchManager');
const { EmergencyControls } = require('../lib/runtime/emergencyControls');
const { SafeMode } = require('../lib/runtime/safeMode');
const { RuntimeIntegration } = require('../lib/runtime/runtimeIntegration');

describe('Enterprise Runtime Platform — Phase 9.9.0', function () {

  describe('runtimeManager.js', function () {
    it('create returns instance with correct methods', function () {
      const rm = new RuntimeManager();
      assert.ok(rm);
      assert.strictEqual(typeof rm.start, 'function');
      assert.strictEqual(typeof rm.stop, 'function');
      assert.strictEqual(typeof rm.getStatus, 'function');
      assert.strictEqual(typeof rm.clear, 'function');
    });

    it('getStatus returns version and uptime before start', function () {
      const rm = new RuntimeManager();
      const status = rm.getStatus();
      assert.strictEqual(status.version, '1.0.0');
      assert.strictEqual(status.uptime, null);
    });

    it('start returns true and emits event', function () {
      const rm = new RuntimeManager();
      let emitted = false;
      rm.events.on(rm.events.constructor.EVENTS.RUNTIME_STARTED, function () { emitted = true; });
      const result = rm.start();
      assert.strictEqual(result, true);
      assert.ok(emitted);
    });

    it('start returns false if already started', function () {
      const rm = new RuntimeManager();
      rm.start();
      const result = rm.start();
      assert.strictEqual(result, false);
    });

    it('stop returns true and clears scheduler', function () {
      const rm = new RuntimeManager();
      rm.start();
      rm.scheduler.schedule('t1', function () {}, 60000);
      const result = rm.stop();
      assert.strictEqual(result, true);
      assert.strictEqual(rm.scheduler.list().length, 0);
    });

    it('stop returns false if not started', function () {
      const rm = new RuntimeManager();
      const result = rm.stop();
      assert.strictEqual(result, false);
    });

    it('getStatus returns uptime after start', function () {
      const rm = new RuntimeManager();
      rm.start();
      const status = rm.getStatus();
      assert.strictEqual(status.version, '1.0.0');
      assert.ok(typeof status.uptime === 'number');
      assert.ok(status.uptime >= 0);
    });

    it('getRegistry returns registry instance', function () {
      const rm = new RuntimeManager();
      assert.ok(rm.registry instanceof RuntimeRegistry);
    });

    it('getStorage returns storage instance', function () {
      const rm = new RuntimeManager();
      assert.ok(rm.storage instanceof RuntimeStorage);
    });

    it('getEvents returns events instance', function () {
      const rm = new RuntimeManager();
      assert.ok(rm.events instanceof RuntimeEvents);
    });

    it('getMetrics returns metrics instance', function () {
      const rm = new RuntimeManager();
      assert.ok(rm.metrics instanceof RuntimeMetrics);
    });

    it('getHealth returns health instance', function () {
      const rm = new RuntimeManager();
      assert.ok(rm.health instanceof RuntimeHealth);
    });

    it('getScheduler returns scheduler instance', function () {
      const rm = new RuntimeManager();
      assert.ok(rm.scheduler instanceof RuntimeScheduler);
    });

    it('getHistory returns history instance', function () {
      const rm = new RuntimeManager();
      assert.ok(rm.history instanceof RuntimeHistory);
    });

    it('getReporter returns reporter instance', function () {
      const rm = new RuntimeManager();
      assert.ok(rm.reporter instanceof RuntimeReporter);
    });

    it('clear resets all sub-components', function () {
      const rm = new RuntimeManager();
      rm.registry.register('svc', {});
      rm.storage.set('k', 'v');
      rm.metrics.record('m1', 1);
      rm.clear();
      assert.strictEqual(rm.registry.count(), 0);
      assert.strictEqual(rm.storage.get('k'), null);
      assert.strictEqual(rm.metrics.getMetricNames().length, 0);
    });
  });

  describe('runtimeRegistry.js', function () {
    it('register adds component and returns true', function () {
      const reg = new RuntimeRegistry();
      const result = reg.register('comp1', { type: 'service' });
      assert.strictEqual(result, true);
    });

    it('get returns registered component', function () {
      const reg = new RuntimeRegistry();
      const comp = { type: 'service' };
      reg.register('comp1', comp);
      assert.deepStrictEqual(reg.get('comp1'), comp);
    });

    it('get returns null for non-existent', function () {
      const reg = new RuntimeRegistry();
      assert.strictEqual(reg.get('nonexistent'), null);
    });

    it('register returns false for duplicate name', function () {
      const reg = new RuntimeRegistry();
      reg.register('comp1', {});
      const result = reg.register('comp1', {});
      assert.strictEqual(result, false);
    });

    it('unregister returns true and removes component', function () {
      const reg = new RuntimeRegistry();
      reg.register('comp1', {});
      const result = reg.unregister('comp1');
      assert.strictEqual(result, true);
      assert.strictEqual(reg.get('comp1'), null);
    });

    it('unregister returns false for non-existent', function () {
      const reg = new RuntimeRegistry();
      const result = reg.unregister('nonexistent');
      assert.strictEqual(result, false);
    });

    it('list returns registered names', function () {
      const reg = new RuntimeRegistry();
      reg.register('a', {});
      reg.register('b', {});
      const names = reg.list();
      assert.strictEqual(names.length, 2);
      assert.ok(names.includes('a'));
      assert.ok(names.includes('b'));
    });

    it('findByType filters by constructor name', function () {
      const reg = new RuntimeRegistry();
      class XService {}
      class YService {}
      reg.register('x', new XService());
      reg.register('y', new YService());
      const found = reg.findByType('XService');
      assert.strictEqual(found.length, 1);
    });

    it('findByType returns empty for non-matching type', function () {
      const reg = new RuntimeRegistry();
      reg.register('a', { type: 'svc' });
      assert.deepStrictEqual(reg.findByType('NoMatch'), []);
    });

    it('count returns number of registered components', function () {
      const reg = new RuntimeRegistry();
      reg.register('a', {});
      reg.register('b', {});
      assert.strictEqual(reg.count(), 2);
    });

    it('clear removes all components', function () {
      const reg = new RuntimeRegistry();
      reg.register('a', {});
      reg.register('b', {});
      reg.clear();
      assert.strictEqual(reg.count(), 0);
      assert.strictEqual(reg.get('a'), null);
    });
  });

  describe('runtimeStorage.js', function () {
    it('set stores value and returns true', function () {
      const s = new RuntimeStorage();
      const result = s.set('key1', 'value1');
      assert.strictEqual(result, true);
    });

    it('get returns stored value', function () {
      const s = new RuntimeStorage();
      s.set('key1', 'value1');
      assert.strictEqual(s.get('key1'), 'value1');
    });

    it('get returns null for non-existent key', function () {
      const s = new RuntimeStorage();
      assert.strictEqual(s.get('nonexistent'), null);
    });

    it('delete returns true for existing key', function () {
      const s = new RuntimeStorage();
      s.set('key1', 'value1');
      const result = s.delete('key1');
      assert.strictEqual(result, true);
    });

    it('delete returns false for non-existent key', function () {
      const s = new RuntimeStorage();
      const result = s.delete('nonexistent');
      assert.strictEqual(result, false);
    });

    it('has returns true for existing key', function () {
      const s = new RuntimeStorage();
      s.set('key1', 'value1');
      assert.strictEqual(s.has('key1'), true);
    });

    it('has returns false for non-existent key', function () {
      const s = new RuntimeStorage();
      assert.strictEqual(s.has('nonexistent'), false);
    });

    it('getAll returns a copy of all entries', function () {
      const s = new RuntimeStorage();
      s.set('a', 1);
      s.set('b', 2);
      const all = s.getAll();
      assert.deepStrictEqual(all, { a: 1, b: 2 });
    });

    it('getAll copy is not mutated when storage changes', function () {
      const s = new RuntimeStorage();
      s.set('a', 1);
      const all = s.getAll();
      s.set('b', 2);
      assert.strictEqual(Object.keys(all).length, 1);
    });

    it('clear removes all entries', function () {
      const s = new RuntimeStorage();
      s.set('a', 1);
      s.set('b', 2);
      s.clear();
      assert.strictEqual(s.has('a'), false);
    });

    it('set with null key returns false', function () {
      const s = new RuntimeStorage();
      assert.strictEqual(s.set(null, 'v'), false);
    });
  });

  describe('runtimeEvents.js', function () {
    it('on registers handler and returns true', function () {
      const ev = new RuntimeEvents();
      const result = ev.on('test', function () {});
      assert.strictEqual(result, true);
    });

    it('emit calls registered handler', function () {
      const ev = new RuntimeEvents();
      let called = false;
      ev.on('test', function () { called = true; });
      ev.emit('test');
      assert.ok(called);
    });

    it('emit passes data to handler', function () {
      const ev = new RuntimeEvents();
      let received = null;
      ev.on('test', function (data) { received = data; });
      ev.emit('test', { msg: 'hello' });
      assert.deepStrictEqual(received, { msg: 'hello' });
    });

    it('off removes handler and returns true', function () {
      const ev = new RuntimeEvents();
      function handler() {}
      ev.on('test', handler);
      const result = ev.off('test', handler);
      assert.strictEqual(result, true);
      assert.strictEqual(ev.listEvents().length, 0);
    });

    it('off returns false for non-existent handler', function () {
      const ev = new RuntimeEvents();
      assert.strictEqual(ev.off('test', function () {}), false);
    });

    it('emit returns false for unregistered event', function () {
      const ev = new RuntimeEvents();
      assert.strictEqual(ev.emit('nonexistent', {}), false);
    });

    it('listEvents returns registered event types', function () {
      const ev = new RuntimeEvents();
      ev.on('a', function () {});
      ev.on('b', function () {});
      const types = ev.listEvents();
      assert.strictEqual(types.length, 2);
      assert.ok(types.includes('a'));
      assert.ok(types.includes('b'));
    });

    it('EVENTS constants exist', function () {
      const ev = new RuntimeEvents();
      assert.ok(ev.constructor.EVENTS);
      assert.strictEqual(ev.constructor.EVENTS.RUNTIME_STARTED, 'RUNTIME_STARTED');
      assert.strictEqual(ev.constructor.EVENTS.RUNTIME_STOPPED, 'RUNTIME_STOPPED');
      assert.strictEqual(ev.constructor.EVENTS.CONFIG_CHANGED, 'CONFIG_CHANGED');
    });

    it('multiple handlers are all called', function () {
      const ev = new RuntimeEvents();
      let count = 0;
      ev.on('test', function () { count++; });
      ev.on('test', function () { count++; });
      ev.on('test', function () { count++; });
      ev.emit('test');
      assert.strictEqual(count, 3);
    });

    it('emit with no handlers returns false', function () {
      const ev = new RuntimeEvents();
      assert.strictEqual(ev.emit('nonexistent'), false);
    });

    it('clear removes all handlers', function () {
      const ev = new RuntimeEvents();
      ev.on('a', function () {});
      ev.on('b', function () {});
      ev.clear();
      assert.strictEqual(ev.listEvents().length, 0);
    });
  });

  describe('runtimeMetrics.js', function () {
    it('record stores metric entry and returns true', function () {
      const m = new RuntimeMetrics();
      assert.strictEqual(m.record('requests', 100), true);
    });

    it('query returns recorded entries', function () {
      const m = new RuntimeMetrics();
      m.record('requests', 100);
      const entries = m.query('requests');
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].value, 100);
    });

    it('query with since filters by timestamp', function () {
      const m = new RuntimeMetrics();
      m.record('requests', 100);
      m.record('requests', 200);
      const entries = m.query('requests', { since: Date.now() + 10000 });
      assert.strictEqual(entries.length, 0);
    });

    it('query with limit returns limited entries', function () {
      const m = new RuntimeMetrics();
      m.record('a', 1);
      m.record('a', 2);
      m.record('a', 3);
      const entries = m.query('a', { limit: 2 });
      assert.strictEqual(entries.length, 2);
    });

    it('aggregate count returns number of entries', function () {
      const m = new RuntimeMetrics();
      m.record('r', 10);
      m.record('r', 20);
      m.record('r', 30);
      assert.strictEqual(m.aggregate('r', 'count'), 3);
    });

    it('aggregate avg returns average value', function () {
      const m = new RuntimeMetrics();
      m.record('r', 10);
      m.record('r', 20);
      m.record('r', 30);
      assert.strictEqual(m.aggregate('r', 'avg'), 20);
    });

    it('aggregate min returns minimum value', function () {
      const m = new RuntimeMetrics();
      m.record('r', 30);
      m.record('r', 10);
      m.record('r', 20);
      assert.strictEqual(m.aggregate('r', 'min'), 10);
    });

    it('aggregate max returns maximum value', function () {
      const m = new RuntimeMetrics();
      m.record('r', 10);
      m.record('r', 30);
      m.record('r', 20);
      assert.strictEqual(m.aggregate('r', 'max'), 30);
    });

    it('aggregate sum returns sum of values', function () {
      const m = new RuntimeMetrics();
      m.record('r', 10);
      m.record('r', 20);
      m.record('r', 30);
      assert.strictEqual(m.aggregate('r', 'sum'), 60);
    });

    it('getMetricNames returns recorded metric names', function () {
      const m = new RuntimeMetrics();
      m.record('cpu', 50);
      m.record('mem', 1024);
      const names = m.getMetricNames();
      assert.strictEqual(names.length, 2);
    });

    it('aggregate returns null for unknown metric', function () {
      const m = new RuntimeMetrics();
      assert.strictEqual(m.aggregate('unknown', 'count'), null);
    });

    it('clear removes all metrics', function () {
      const m = new RuntimeMetrics();
      m.record('cpu', 50);
      m.clear();
      assert.strictEqual(m.getMetricNames().length, 0);
    });
  });

  describe('runtimeHealth.js', function () {
    it('registerCheck adds check and returns true', function () {
      const h = new RuntimeHealth();
      assert.strictEqual(h.registerCheck('db', function () { return true; }), true);
    });

    it('runCheck returns status entry for healthy check', function () {
      const h = new RuntimeHealth();
      h.registerCheck('db', function () { return true; });
      const entry = h.runCheck('db');
      assert.strictEqual(entry.name, 'db');
      assert.strictEqual(entry.status, 'healthy');
    });

    it('runCheck returns down for failing check', function () {
      const h = new RuntimeHealth();
      h.registerCheck('db', function () { return false; });
      const entry = h.runCheck('db');
      assert.strictEqual(entry.status, 'down');
    });

    it('runCheck returns null for unregistered', function () {
      const h = new RuntimeHealth();
      assert.strictEqual(h.runCheck('unknown'), null);
    });

    it('runAll returns all check results', function () {
      const h = new RuntimeHealth();
      h.registerCheck('a', function () { return true; });
      h.registerCheck('b', function () { return 'healthy'; });
      assert.strictEqual(h.runAll().length, 2);
    });

    it('getStatus returns last status for check', function () {
      const h = new RuntimeHealth();
      h.registerCheck('db', function () { return true; });
      h.runCheck('db');
      const status = h.getStatus('db');
      assert.strictEqual(status.name, 'db');
    });

    it('getStatus returns null for unknown', function () {
      const h = new RuntimeHealth();
      assert.strictEqual(h.getStatus('unknown'), null);
    });

    it('getAllStatus returns map of all statuses', function () {
      const h = new RuntimeHealth();
      h.registerCheck('a', function () { return true; });
      h.registerCheck('b', function () { return false; });
      h.runAll();
      const all = h.getAllStatus();
      assert.ok(all.a);
      assert.ok(all.b);
    });

    it('clear removes all checks and statuses', function () {
      const h = new RuntimeHealth();
      h.registerCheck('a', function () { return true; });
      h.clear();
      assert.strictEqual(h.runCheck('a'), null);
    });
  });

  describe('runtimeScheduler.js', function () {
    it('schedule returns task info', function () {
      const s = new RuntimeScheduler();
      const info = s.schedule('t1', function () {}, 60000);
      assert.ok(info);
      assert.strictEqual(info.name, 't1');
      assert.strictEqual(info.interval, 60000);
    });

    it('schedule returns null for duplicate', function () {
      const s = new RuntimeScheduler();
      s.schedule('t1', function () {}, 60000);
      assert.strictEqual(s.schedule('t1', function () {}, 60000), null);
    });

    it('cancel removes scheduled task and returns true', function () {
      const s = new RuntimeScheduler();
      s.schedule('t1', function () {}, 60000);
      assert.strictEqual(s.cancel('t1'), true);
      assert.strictEqual(s.list().length, 0);
    });

    it('cancel returns false for non-existent', function () {
      const s = new RuntimeScheduler();
      assert.strictEqual(s.cancel('unknown'), false);
    });

    it('list returns scheduled tasks', function () {
      const s = new RuntimeScheduler();
      s.schedule('a', function () {}, 60000);
      s.schedule('b', function () {}, 30000);
      assert.strictEqual(s.list().length, 2);
    });

    it('tick runs due tasks', function (done) {
      const s = new RuntimeScheduler();
      let ran = false;
      s.schedule('t1', function () { ran = true; }, 5);
      setTimeout(function () {
        const executed = s.tick();
        assert.strictEqual(executed.length, 1);
        assert.ok(ran);
        done();
      }, 10);
    });

    it('pause prevents tick from running tasks', function (done) {
      const s = new RuntimeScheduler();
      let ran = false;
      s.schedule('t1', function () { ran = true; }, 5);
      s.pause();
      setTimeout(function () {
        assert.strictEqual(s.tick().length, 0);
        assert.strictEqual(ran, false);
        done();
      }, 10);
    });

    it('resume allows tick to run tasks again', function (done) {
      const s = new RuntimeScheduler();
      let ran = false;
      s.schedule('t1', function () { ran = true; }, 5);
      s.pause();
      s.resume();
      setTimeout(function () {
        const executed = s.tick();
        assert.strictEqual(executed.length, 1);
        assert.ok(ran);
        done();
      }, 10);
    });

    it('clear removes all tasks and resets pause', function (done) {
      const s = new RuntimeScheduler();
      s.schedule('t1', function () {}, 60000);
      s.pause();
      s.clear();
      assert.strictEqual(s.list().length, 0);
      let ran = false;
      s.schedule('t2', function () { ran = true; }, 5);
      setTimeout(function () {
        assert.strictEqual(s.tick().length, 1);
        done();
      }, 10);
    });
  });

  describe('runtimeHistory.js', function () {
    it('record returns entry with id', function () {
      const h = new RuntimeHistory();
      const entry = h.record({ type: 'deploy', source: 'web', action: 'create' });
      assert.ok(entry);
      assert.strictEqual(typeof entry.id, 'number');
      assert.strictEqual(entry.type, 'deploy');
    });

    it('record returns null for missing required fields', function () {
      const h = new RuntimeHistory();
      assert.strictEqual(h.record({ type: 'deploy' }), null);
      assert.strictEqual(h.record({}), null);
      assert.strictEqual(h.record(null), null);
    });

    it('query by type filters correctly', function () {
      const h = new RuntimeHistory();
      h.record({ type: 'deploy', source: 'web', action: 'create' });
      h.record({ type: 'config', source: 'cli', action: 'update' });
      assert.strictEqual(h.query({ type: 'deploy' }).length, 1);
    });

    it('query by source filters correctly', function () {
      const h = new RuntimeHistory();
      h.record({ type: 'deploy', source: 'web', action: 'create' });
      h.record({ type: 'config', source: 'cli', action: 'update' });
      assert.strictEqual(h.query({ source: 'cli' }).length, 1);
    });

    it('get returns entry by id', function () {
      const h = new RuntimeHistory();
      const entry = h.record({ type: 'deploy', source: 'web', action: 'create' });
      const found = h.get(entry.id);
      assert.deepStrictEqual(found, entry);
    });

    it('get returns null for missing id', function () {
      const h = new RuntimeHistory();
      assert.strictEqual(h.get(999), null);
    });

    it('getStats returns counts', function () {
      const h = new RuntimeHistory();
      h.record({ type: 'deploy', source: 'web', action: 'create' });
      h.record({ type: 'deploy', source: 'web', action: 'update' });
      h.record({ type: 'config', source: 'cli', action: 'update' });
      const stats = h.getStats();
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.byType.deploy, 2);
      assert.strictEqual(stats.bySource.cli, 1);
    });

    it('getStats returns empty for no entries', function () {
      const h = new RuntimeHistory();
      const stats = h.getStats();
      assert.strictEqual(stats.total, 0);
      assert.deepStrictEqual(stats.byType, {});
    });

    it('clear removes all entries', function () {
      const h = new RuntimeHistory();
      h.record({ type: 'deploy', source: 'web', action: 'create' });
      h.clear();
      assert.strictEqual(h.getStats().total, 0);
    });
  });

  describe('runtimeReporter.js', function () {
    it('generateReport returns report with id and summary', function () {
      const r = new RuntimeReporter();
      const report = r.generateReport({ uptime: '10h', status: 'ok' });
      assert.ok(report);
      assert.strictEqual(typeof report.id, 'number');
      assert.ok(report.summary.includes('2 section(s)'));
    });

    it('generateReport returns null for invalid input', function () {
      const r = new RuntimeReporter();
      assert.strictEqual(r.generateReport(null), null);
      assert.strictEqual(r.generateReport('string'), null);
    });

    it('getReport returns report by id', function () {
      const r = new RuntimeReporter();
      const report = r.generateReport({ cpu: '50%' });
      const found = r.getReport(report.id);
      assert.deepStrictEqual(found, report);
    });

    it('getReport returns null for unknown id', function () {
      const r = new RuntimeReporter();
      assert.strictEqual(r.getReport(999), null);
    });

    it('listReports returns all report summaries', function () {
      const r = new RuntimeReporter();
      r.generateReport({ a: 1 });
      r.generateReport({ b: 2 });
      assert.strictEqual(r.listReports().length, 2);
    });

    it('exportJSON returns stringified report', function () {
      const r = new RuntimeReporter();
      const report = r.generateReport({ cpu: '50%' });
      const json = r.exportJSON(report.id);
      const parsed = JSON.parse(json);
      assert.strictEqual(parsed.id, report.id);
    });

    it('exportJSON returns null for unknown id', function () {
      const r = new RuntimeReporter();
      assert.strictEqual(r.exportJSON(999), null);
    });

    it('clear removes all reports', function () {
      const r = new RuntimeReporter();
      r.generateReport({ a: 1 });
      r.clear();
      assert.strictEqual(r.listReports().length, 0);
    });
  });

  describe('featureFlagRegistry.js', function () {
    it('register stores flag and succeeds', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'flag1', name: 'Flag One', enabled: true });
      assert.strictEqual(ffr.count(), 1);
    });

    it('get returns registered flag', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'flag1', name: 'Flag One', enabled: true });
      const flag = ffr.get('flag1');
      assert.strictEqual(flag.key, 'flag1');
      assert.strictEqual(flag.enabled, true);
    });

    it('get returns null for unknown key', function () {
      const ffr = new FeatureFlagRegistry();
      assert.strictEqual(ffr.get('unknown'), null);
    });

    it('register throws for missing key', function () {
      const ffr = new FeatureFlagRegistry();
      assert.throws(function () { ffr.register({}); }, /must have a key/);
    });

    it('register throws for duplicate key', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'flag1' });
      assert.throws(function () { ffr.register({ key: 'flag1' }); }, /already exists/);
    });

    it('unregister returns true and removes flag', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'flag1' });
      assert.strictEqual(ffr.unregister('flag1'), true);
      assert.strictEqual(ffr.get('flag1'), null);
    });

    it('unregister returns false for non-existent', function () {
      const ffr = new FeatureFlagRegistry();
      assert.strictEqual(ffr.unregister('unknown'), false);
    });

    it('list filters by enabled', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'a', enabled: true });
      ffr.register({ key: 'b', enabled: false });
      ffr.register({ key: 'c', enabled: true });
      assert.strictEqual(ffr.list({ enabled: true }).length, 2);
      assert.strictEqual(ffr.list({ enabled: false }).length, 1);
    });

    it('list filters by tags', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'a', tags: ['frontend'] });
      ffr.register({ key: 'b', tags: ['backend'] });
      ffr.register({ key: 'c', tags: ['frontend', 'backend'] });
      assert.strictEqual(ffr.list({ tags: ['frontend'] }).length, 2);
    });

    it('search finds by name', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'a', name: 'Feature Alpha', description: '' });
      ffr.register({ key: 'b', name: 'Feature Beta', description: '' });
      assert.strictEqual(ffr.search('Alpha').length, 1);
    });

    it('search returns empty for no match', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'a', name: 'Alpha', description: '' });
      assert.strictEqual(ffr.search('NonExistent').length, 0);
    });

    it('count returns number of flags', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'a' });
      ffr.register({ key: 'b' });
      assert.strictEqual(ffr.count(), 2);
    });

    it('clear removes all flags', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'a' });
      ffr.register({ key: 'b' });
      ffr.clear();
      assert.strictEqual(ffr.count(), 0);
    });
  });

  describe('featureFlagTargeting.js', function () {
    it('addTargeting stores rules for flag', function () {
      const t = new FeatureFlagTargeting();
      t.addTargeting('flag1', [{ field: 'country', operator: 'eq', value: 'US' }]);
      const rules = t.getTargeting('flag1');
      assert.strictEqual(rules.length, 1);
      assert.strictEqual(rules[0].field, 'country');
    });

    it('getTargeting returns null for unknown', function () {
      const t = new FeatureFlagTargeting();
      assert.strictEqual(t.getTargeting('unknown'), null);
    });

    it('evaluate returns true when all rules match', function () {
      const t = new FeatureFlagTargeting();
      t.addTargeting('flag1', [{ field: 'country', operator: 'eq', value: 'US' }, { field: 'tier', operator: 'eq', value: 'premium' }]);
      assert.strictEqual(t.evaluate('flag1', { country: 'US', tier: 'premium' }), true);
    });

    it('evaluate with eq operator', function () {
      const t = new FeatureFlagTargeting();
      t.addTargeting('f1', [{ field: 'role', operator: 'eq', value: 'admin' }]);
      assert.strictEqual(t.evaluate('f1', { role: 'admin' }), true);
      assert.strictEqual(t.evaluate('f1', { role: 'user' }), false);
    });

    it('evaluate with neq operator', function () {
      const t = new FeatureFlagTargeting();
      t.addTargeting('f1', [{ field: 'role', operator: 'neq', value: 'banned' }]);
      assert.strictEqual(t.evaluate('f1', { role: 'admin' }), true);
      assert.strictEqual(t.evaluate('f1', { role: 'banned' }), false);
    });

    it('evaluate with in operator', function () {
      const t = new FeatureFlagTargeting();
      t.addTargeting('f1', [{ field: 'country', operator: 'in', value: ['US', 'CA'] }]);
      assert.strictEqual(t.evaluate('f1', { country: 'US' }), true);
      assert.strictEqual(t.evaluate('f1', { country: 'MX' }), false);
    });

    it('evaluate returns false when no rules match', function () {
      const t = new FeatureFlagTargeting();
      t.addTargeting('f1', [{ field: 'country', operator: 'eq', value: 'US' }]);
      assert.strictEqual(t.evaluate('f1', { country: 'MX' }), false);
    });

    it('evaluate returns true when no rules defined', function () {
      const t = new FeatureFlagTargeting();
      assert.strictEqual(t.evaluate('unknown', { country: 'US' }), true);
    });

    it('removeTargeting removes rules and returns true', function () {
      const t = new FeatureFlagTargeting();
      t.addTargeting('f1', [{ field: 'country', operator: 'eq', value: 'US' }]);
      assert.strictEqual(t.removeTargeting('f1'), true);
      assert.strictEqual(t.getTargeting('f1'), null);
    });

    it('clear removes all targeting rules', function () {
      const t = new FeatureFlagTargeting();
      t.addTargeting('f1', [{ field: 'a', operator: 'eq', value: 1 }]);
      t.addTargeting('f2', [{ field: 'b', operator: 'eq', value: 2 }]);
      t.clear();
      assert.strictEqual(t.getTargeting('f1'), null);
      assert.strictEqual(t.getTargeting('f2'), null);
    });
  });

  describe('featureFlagEvaluator.js', function () {
    it('isEnabled true when flag enabled and targeting matches', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      reg.register({ key: 'f1', enabled: true });
      tgt.addTargeting('f1', [{ field: 'x', operator: 'eq', value: 1 }]);
      const ev = new FeatureFlagEvaluator(reg, tgt);
      assert.strictEqual(ev.isEnabled('f1', { x: 1 }), true);
    });

    it('isEnabled false when flag does not exist', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      const ev = new FeatureFlagEvaluator(reg, tgt);
      assert.strictEqual(ev.isEnabled('unknown', {}), false);
    });

    it('isEnabled false when flag is disabled', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      reg.register({ key: 'f1', enabled: false });
      const ev = new FeatureFlagEvaluator(reg, tgt);
      assert.strictEqual(ev.isEnabled('f1', {}), false);
    });

    it('isEnabled false when targeting does not match', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      reg.register({ key: 'f1', enabled: true });
      tgt.addTargeting('f1', [{ field: 'x', operator: 'eq', value: 1 }]);
      const ev = new FeatureFlagEvaluator(reg, tgt);
      assert.strictEqual(ev.isEnabled('f1', { x: 2 }), false);
    });

    it('getValue returns true when enabled and targeting matches', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      reg.register({ key: 'f1', enabled: true });
      const ev = new FeatureFlagEvaluator(reg, tgt);
      assert.strictEqual(ev.getValue('f1', {}, false), true);
    });

    it('getValue returns default when flag does not exist', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      const ev = new FeatureFlagEvaluator(reg, tgt);
      assert.strictEqual(ev.getValue('unknown', {}, 'fallback'), 'fallback');
    });

    it('getValue returns default when flag is disabled', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      reg.register({ key: 'f1', enabled: false });
      const ev = new FeatureFlagEvaluator(reg, tgt);
      assert.strictEqual(ev.getValue('f1', {}, 'off'), 'off');
    });

    it('getAllFlags evaluates all registered flags', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      reg.register({ key: 'a', enabled: true });
      reg.register({ key: 'b', enabled: false });
      const ev = new FeatureFlagEvaluator(reg, tgt);
      const all = ev.getAllFlags({});
      assert.strictEqual(all.a.enabled, true);
      assert.strictEqual(all.b.enabled, false);
    });

    it('getAllFlags returns empty object for no flags', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      const ev = new FeatureFlagEvaluator(reg, tgt);
      assert.deepStrictEqual(ev.getAllFlags({}), {});
    });

    it('constructor throws without registry', function () {
      assert.throws(function () { new FeatureFlagEvaluator(null, {}); }, /required/);
    });

    it('clear resets registry and targeting', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      reg.register({ key: 'f1', enabled: true });
      tgt.addTargeting('f1', [{ field: 'x', operator: 'eq', value: 1 }]);
      const ev = new FeatureFlagEvaluator(reg, tgt);
      ev.clear();
      assert.strictEqual(reg.count(), 0);
      assert.strictEqual(tgt.getTargeting('f1'), null);
    });
  });

  describe('featureFlagRollouts.js', function () {
    it('startRollout sets percentage', function () {
      const r = new FeatureFlagRollouts();
      r.startRollout('flag1', 50);
      assert.strictEqual(r.getRollout('flag1').percentage, 50);
    });

    it('getRollout returns rollout info', function () {
      const r = new FeatureFlagRollouts();
      r.startRollout('flag1', 25);
      const info = r.getRollout('flag1');
      assert.strictEqual(info.flagKey, 'flag1');
      assert.strictEqual(info.percentage, 25);
    });

    it('getRollout returns null for unknown', function () {
      const r = new FeatureFlagRollouts();
      assert.strictEqual(r.getRollout('unknown'), null);
    });

    it('updateRollout changes percentage', function () {
      const r = new FeatureFlagRollouts();
      r.startRollout('flag1', 10);
      r.updateRollout('flag1', 75);
      assert.strictEqual(r.getRollout('flag1').percentage, 75);
    });

    it('isInRollout returns true based on context', function () {
      const r = new FeatureFlagRollouts();
      r.startRollout('flag1', 100);
      assert.strictEqual(r.isInRollout('flag1', { userId: 'user1' }), true);
    });

    it('isInRollout returns false for 0 percent', function () {
      const r = new FeatureFlagRollouts();
      r.startRollout('flag1', 0);
      assert.strictEqual(r.isInRollout('flag1', { userId: 'user1' }), false);
    });

    it('isInRollout returns false for unknown flag', function () {
      const r = new FeatureFlagRollouts();
      assert.strictEqual(r.isInRollout('unknown', {}), false);
    });

    it('completeRollout sets percentage to 100', function () {
      const r = new FeatureFlagRollouts();
      r.startRollout('flag1', 50);
      r.completeRollout('flag1');
      assert.strictEqual(r.getRollout('flag1').percentage, 100);
    });

    it('stopRollout sets percentage to 0', function () {
      const r = new FeatureFlagRollouts();
      r.startRollout('flag1', 50);
      r.stopRollout('flag1');
      assert.strictEqual(r.getRollout('flag1').percentage, 0);
    });

    it('listRollouts returns all rollouts', function () {
      const r = new FeatureFlagRollouts();
      r.startRollout('a', 10);
      r.startRollout('b', 20);
      assert.strictEqual(r.listRollouts().length, 2);
    });

    it('clear removes all rollouts', function () {
      const r = new FeatureFlagRollouts();
      r.startRollout('a', 10);
      r.clear();
      assert.strictEqual(r.listRollouts().length, 0);
    });
  });

  describe('featureFlagExperiments.js', function () {
    it('createExperiment stores experiment with variants', function () {
      const e = new FeatureFlagExperiments();
      e.createExperiment('f1', [{ name: 'control', weight: 50 }, { name: 'treatment', weight: 50 }]);
      const exp = e.getExperiment('f1');
      assert.strictEqual(exp.flagKey, 'f1');
      assert.strictEqual(exp.variants.length, 2);
    });

    it('getExperiment returns null for unknown', function () {
      const e = new FeatureFlagExperiments();
      assert.strictEqual(e.getExperiment('unknown'), null);
    });

    it('assignVariant returns a variant name', function () {
      const e = new FeatureFlagExperiments();
      e.createExperiment('f1', [{ name: 'control', weight: 50 }, { name: 'treatment', weight: 50 }]);
      const variant = e.assignVariant('f1', { userId: 'u1' });
      assert.ok(variant === 'control' || variant === 'treatment');
    });

    it('assignVariant is consistent for same user', function () {
      const e = new FeatureFlagExperiments();
      e.createExperiment('f1', [{ name: 'control', weight: 50 }, { name: 'treatment', weight: 50 }]);
      const v1 = e.assignVariant('f1', { userId: 'u-fixed' });
      const v2 = e.assignVariant('f1', { userId: 'u-fixed' });
      assert.strictEqual(v1, v2);
    });

    it('assignVariant returns null for unknown experiment', function () {
      const e = new FeatureFlagExperiments();
      assert.strictEqual(e.assignVariant('unknown', {}), null);
    });

    it('recordResult stores result for flag+variant', function () {
      const e = new FeatureFlagExperiments();
      e.createExperiment('f1', [{ name: 'control', weight: 100 }]);
      e.recordResult('f1', 'control', { conversions: 5 });
      const results = e.getResults('f1');
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].variant, 'control');
    });

    it('getResults returns all results for flag', function () {
      const e = new FeatureFlagExperiments();
      e.createExperiment('f1', [{ name: 'control', weight: 100 }]);
      e.recordResult('f1', 'control', { a: 1 });
      e.recordResult('f1', 'control', { a: 2 });
      assert.strictEqual(e.getResults('f1').length, 2);
    });

    it('createExperiment throws for invalid variants', function () {
      const e = new FeatureFlagExperiments();
      assert.throws(function () { e.createExperiment('f1', []); }, /non-empty/);
      assert.throws(function () { e.createExperiment('f1', [{ name: 'a' }]); }, /weight/);
    });

    it('clear removes all experiments and results', function () {
      const e = new FeatureFlagExperiments();
      e.createExperiment('f1', [{ name: 'c', weight: 100 }]);
      e.recordResult('f1', 'c', { x: 1 });
      e.clear();
      assert.strictEqual(e.getExperiment('f1'), null);
      assert.strictEqual(e.getResults('f1').length, 0);
    });
  });

  describe('featureFlagAudit.js', function () {
    it('recordChange stores audit entry', function () {
      const a = new FeatureFlagAudit();
      a.recordChange('f1', 'create', 'admin', { source: 'cli' });
      const history = a.getHistory('f1');
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].action, 'create');
    });

    it('getHistory returns entries for flag', function () {
      const a = new FeatureFlagAudit();
      a.recordChange('f1', 'create', 'admin');
      a.recordChange('f1', 'update', 'admin');
      a.recordChange('f2', 'create', 'admin');
      assert.strictEqual(a.getHistory('f1').length, 2);
    });

    it('getHistory returns empty for flag with no entries', function () {
      const a = new FeatureFlagAudit();
      assert.deepStrictEqual(a.getHistory('unknown'), []);
    });

    it('query filters by action', function () {
      const a = new FeatureFlagAudit();
      a.recordChange('f1', 'create', 'admin');
      a.recordChange('f1', 'update', 'admin');
      assert.strictEqual(a.query({ action: 'create' }).length, 1);
    });

    it('query filters by actor', function () {
      const a = new FeatureFlagAudit();
      a.recordChange('f1', 'create', 'admin');
      a.recordChange('f1', 'create', 'user');
      assert.strictEqual(a.query({ actor: 'admin' }).length, 1);
    });

    it('query with limit returns limited results', function () {
      const a = new FeatureFlagAudit();
      a.recordChange('f1', 'c', 'admin');
      a.recordChange('f1', 'u', 'admin');
      a.recordChange('f1', 'd', 'admin');
      assert.strictEqual(a.query({ limit: 2 }).length, 2);
    });

    it('getStats returns counts by action and flag', function () {
      const a = new FeatureFlagAudit();
      a.recordChange('f1', 'create', 'admin');
      a.recordChange('f1', 'update', 'admin');
      a.recordChange('f2', 'create', 'admin');
      const stats = a.getStats();
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.byAction.create, 2);
      assert.strictEqual(stats.byFlag.f1, 2);
    });

    it('getStats returns zeros for empty audit', function () {
      const a = new FeatureFlagAudit();
      const stats = a.getStats();
      assert.strictEqual(stats.total, 0);
      assert.deepStrictEqual(stats.byAction, {});
    });

    it('clear removes all audit entries', function () {
      const a = new FeatureFlagAudit();
      a.recordChange('f1', 'create', 'admin');
      a.clear();
      assert.strictEqual(a.getStats().total, 0);
    });
  });

  describe('featureFlagManager.js', function () {
    it('createFlag registers flag and audits', function () {
      const fm = new FeatureFlagManager();
      fm.createFlag({ key: 'f1', name: 'Feature 1', enabled: true });
      assert.strictEqual(fm.getStatus().total, 1);
    });

    it('evaluate returns result for enabled flag', function () {
      const fm = new FeatureFlagManager();
      fm.createFlag({ key: 'f1', enabled: true });
      const result = fm.evaluate('f1', {});
      assert.strictEqual(result.key, 'f1');
      assert.ok(result.enabled);
    });

    it('evaluate returns disabled for non-existent flag', function () {
      const fm = new FeatureFlagManager();
      const result = fm.evaluate('unknown', {});
      assert.strictEqual(result.key, 'unknown');
      assert.strictEqual(result.enabled, false);
    });

    it('startRollout starts rollout and audits', function () {
      const fm = new FeatureFlagManager();
      fm.createFlag({ key: 'f1', enabled: true });
      fm.startRollout('f1', 50);
      assert.strictEqual(fm.getStatus().rollouts, 1);
    });

    it('createExperiment creates experiment and audits', function () {
      const fm = new FeatureFlagManager();
      fm.createFlag({ key: 'f1', enabled: true });
      fm.createExperiment('f1', [{ name: 'control', weight: 100 }]);
      assert.strictEqual(fm.getStatus().experiments, 1);
    });

    it('getStatus returns counts', function () {
      const fm = new FeatureFlagManager();
      fm.createFlag({ key: 'a', enabled: true });
      fm.createFlag({ key: 'b', enabled: false });
      fm.createFlag({ key: 'c', enabled: true });
      const status = fm.getStatus();
      assert.strictEqual(status.total, 3);
      assert.strictEqual(status.enabled, 2);
    });

    it('getStatus returns zero for empty manager', function () {
      const fm = new FeatureFlagManager();
      const status = fm.getStatus();
      assert.strictEqual(status.total, 0);
      assert.strictEqual(status.enabled, 0);
    });

    it('clear resets all sub-components', function () {
      const fm = new FeatureFlagManager();
      fm.createFlag({ key: 'f1', enabled: true });
      fm.clear();
      const status = fm.getStatus();
      assert.strictEqual(status.total, 0);
    });
  });

  describe('configurationRegistry.js', function () {
    it('register stores configuration', function () {
      const cr = new ConfigurationRegistry();
      cr.register('db.url', { value: 'localhost', type: 'string', source: 'env' });
      const config = cr.get('db.url');
      assert.strictEqual(config.value, 'localhost');
    });

    it('get returns null for unknown config', function () {
      const cr = new ConfigurationRegistry();
      assert.strictEqual(cr.get('unknown'), null);
    });

    it('register throws for duplicate', function () {
      const cr = new ConfigurationRegistry();
      cr.register('db.url', { value: 'localhost' });
      assert.throws(function () { cr.register('db.url', { value: 'other' }); }, /already registered/);
    });

    it('update increments version', function () {
      const cr = new ConfigurationRegistry();
      cr.register('db.url', { value: 'localhost' });
      cr.update('db.url', 'newhost');
      assert.strictEqual(cr.get('db.url').version, 2);
    });

    it('update throws for unknown', function () {
      const cr = new ConfigurationRegistry();
      assert.throws(function () { cr.update('unknown', 'val'); }, /not found/);
    });

    it('unregister returns true and removes config', function () {
      const cr = new ConfigurationRegistry();
      cr.register('db.url', { value: 'localhost' });
      assert.strictEqual(cr.unregister('db.url'), true);
      assert.strictEqual(cr.get('db.url'), null);
    });

    it('unregister returns false for non-existent', function () {
      const cr = new ConfigurationRegistry();
      assert.strictEqual(cr.unregister('unknown'), false);
    });

    it('list filters by type', function () {
      const cr = new ConfigurationRegistry();
      cr.register('a', { value: 1, type: 'number' });
      cr.register('b', { value: 'x', type: 'string' });
      cr.register('c', { value: 2, type: 'number' });
      assert.strictEqual(cr.list({ type: 'number' }).length, 2);
    });

    it('list filters by source', function () {
      const cr = new ConfigurationRegistry();
      cr.register('a', { value: 1, source: 'env' });
      cr.register('b', { value: 2, source: 'file' });
      assert.strictEqual(cr.list({ source: 'env' }).length, 1);
    });

    it('clear removes all configs', function () {
      const cr = new ConfigurationRegistry();
      cr.register('a', { value: 1 });
      cr.register('b', { value: 2 });
      cr.clear();
      assert.strictEqual(cr.list().length, 0);
    });
  });

  describe('configurationSources.js', function () {
    it('addSource stores source with fetcher', function () {
      const cs = new ConfigurationSources();
      cs.addSource('env', { priority: 10, fetcher: function () { return { port: 3000 }; } });
      const src = cs.getSource('env');
      assert.strictEqual(src.priority, 10);
    });

    it('getSource returns null for unknown', function () {
      const cs = new ConfigurationSources();
      assert.strictEqual(cs.getSource('unknown'), null);
    });

    it('removeSource removes and returns true', function () {
      const cs = new ConfigurationSources();
      cs.addSource('env', { priority: 10, fetcher: function () { return {}; } });
      assert.strictEqual(cs.removeSource('env'), true);
      assert.strictEqual(cs.getSource('env'), null);
    });

    it('listSources returns sorted by priority', function () {
      const cs = new ConfigurationSources();
      cs.addSource('high', { priority: 100, fetcher: function () { return {}; } });
      cs.addSource('low', { priority: 1, fetcher: function () { return {}; } });
      cs.addSource('mid', { priority: 50, fetcher: function () { return {}; } });
      const list = cs.listSources();
      assert.strictEqual(list[0].priority, 1);
      assert.strictEqual(list[1].priority, 50);
      assert.strictEqual(list[2].priority, 100);
    });

    it('fetchFromSource calls fetcher and returns data', function () {
      const cs = new ConfigurationSources();
      cs.addSource('env', { priority: 10, fetcher: function () { return { port: 3000 }; } });
      assert.deepStrictEqual(cs.fetchFromSource('env'), { port: 3000 });
    });

    it('fetchFromSource returns null for unknown', function () {
      const cs = new ConfigurationSources();
      assert.strictEqual(cs.fetchFromSource('unknown'), null);
    });

    it('fetchAll merges data from all sources', function () {
      const cs = new ConfigurationSources();
      cs.addSource('a', { priority: 1, fetcher: function () { return { x: 1 }; } });
      cs.addSource('b', { priority: 2, fetcher: function () { return { y: 2 }; } });
      const data = cs.fetchAll();
      assert.strictEqual(data.x, 1);
      assert.strictEqual(data.y, 2);
    });

    it('clear removes all sources', function () {
      const cs = new ConfigurationSources();
      cs.addSource('a', { priority: 1, fetcher: function () { return {}; } });
      cs.clear();
      assert.strictEqual(cs.listSources().length, 0);
    });
  });

  describe('configurationOverrides.js', function () {
    it('setOverride stores override value', function () {
      const co = new ConfigurationOverrides();
      co.setOverride('db.url', 'override-host');
      const ovr = co.getOverride('db.url');
      assert.strictEqual(ovr.value, 'override-host');
    });

    it('getOverride returns null for unknown', function () {
      const co = new ConfigurationOverrides();
      assert.strictEqual(co.getOverride('unknown'), null);
    });

    it('removeOverride removes and returns true', function () {
      const co = new ConfigurationOverrides();
      co.setOverride('db.url', 'val');
      assert.strictEqual(co.removeOverride('db.url'), true);
      assert.strictEqual(co.getOverride('db.url'), null);
    });

    it('listOverrides returns all overrides', function () {
      const co = new ConfigurationOverrides();
      co.setOverride('a', 1);
      co.setOverride('b', 2);
      assert.strictEqual(co.listOverrides().length, 2);
    });

    it('hasOverride returns true/false', function () {
      const co = new ConfigurationOverrides();
      co.setOverride('a', 1);
      assert.strictEqual(co.hasOverride('a'), true);
      assert.strictEqual(co.hasOverride('b'), false);
    });

    it('clear removes all overrides', function () {
      const co = new ConfigurationOverrides();
      co.setOverride('a', 1);
      co.clear();
      assert.strictEqual(co.hasOverride('a'), false);
    });
  });

  describe('configurationProfiles.js', function () {
    it('createProfile stores profile', function () {
      const cp = new ConfigurationProfiles();
      cp.createProfile('prod', { debug: false });
      const profile = cp.getProfile('prod');
      assert.strictEqual(profile.name, 'prod');
    });

    it('getProfile returns null for unknown', function () {
      const cp = new ConfigurationProfiles();
      assert.strictEqual(cp.getProfile('unknown'), null);
    });

    it('activateProfile sets active profile', function () {
      const cp = new ConfigurationProfiles();
      cp.createProfile('prod', { debug: false });
      cp.activateProfile('prod');
      assert.strictEqual(cp.getActiveProfile(), 'prod');
    });

    it('getActiveProfile returns null when none active', function () {
      const cp = new ConfigurationProfiles();
      assert.strictEqual(cp.getActiveProfile(), null);
    });

    it('listProfiles returns all profiles', function () {
      const cp = new ConfigurationProfiles();
      cp.createProfile('a', {});
      cp.createProfile('b', {});
      assert.strictEqual(cp.listProfiles().length, 2);
    });

    it('deleteProfile removes profile', function () {
      const cp = new ConfigurationProfiles();
      cp.createProfile('prod', {});
      assert.strictEqual(cp.deleteProfile('prod'), true);
      assert.strictEqual(cp.getProfile('prod'), null);
    });

    it('deleteProfile returns false for unknown', function () {
      const cp = new ConfigurationProfiles();
      assert.strictEqual(cp.deleteProfile('unknown'), false);
    });

    it('clear removes all profiles and deactivates', function () {
      const cp = new ConfigurationProfiles();
      cp.createProfile('prod', {});
      cp.activateProfile('prod');
      cp.clear();
      assert.strictEqual(cp.listProfiles().length, 0);
      assert.strictEqual(cp.getActiveProfile(), null);
    });
  });

  describe('configurationValidation.js', function () {
    it('validate passes when required field present', function () {
      const cv = new ConfigurationValidation();
      const result = cv.validate({ port: 3000 }, [{ field: 'port', required: true }]);
      assert.strictEqual(result.valid, true);
    });

    it('validate fails when required field missing', function () {
      const cv = new ConfigurationValidation();
      const result = cv.validate({}, [{ field: 'port', required: true }]);
      assert.strictEqual(result.valid, false);
    });

    it('validate type check fails on wrong type', function () {
      const cv = new ConfigurationValidation();
      const result = cv.validate({ port: '3000' }, [{ field: 'port', type: 'number' }]);
      assert.strictEqual(result.valid, false);
    });

    it('validate min/max checks', function () {
      const cv = new ConfigurationValidation();
      assert.strictEqual(cv.validate({ port: 50 }, [{ field: 'port', min: 100 }]).valid, false);
      assert.strictEqual(cv.validate({ port: 150 }, [{ field: 'port', max: 100 }]).valid, false);
      assert.strictEqual(cv.validate({ port: 80 }, [{ field: 'port', min: 1, max: 65535 }]).valid, true);
    });

    it('validate pattern check on string', function () {
      const cv = new ConfigurationValidation();
      const r1 = cv.validate({ email: 'bad' }, [{ field: 'email', pattern: '^\\S+@\\S+$' }]);
      assert.strictEqual(r1.valid, false);
      const r2 = cv.validate({ email: 'a@b.com' }, [{ field: 'email', pattern: '^\\S+@\\S+$' }]);
      assert.strictEqual(r2.valid, true);
    });

    it('addSchema stores schema rules', function () {
      const cv = new ConfigurationValidation();
      cv.addSchema('server', [{ field: 'port', required: true, type: 'number' }]);
      const schema = cv.getSchema('server');
      assert.strictEqual(schema.length, 1);
    });

    it('getSchema returns null for unknown', function () {
      const cv = new ConfigurationValidation();
      assert.strictEqual(cv.getSchema('unknown'), null);
    });

    it('validateAgainstSchema uses stored schema', function () {
      const cv = new ConfigurationValidation();
      cv.addSchema('server', [{ field: 'port', required: true, type: 'number' }]);
      assert.strictEqual(cv.validateAgainstSchema({}, 'server').valid, false);
      assert.strictEqual(cv.validateAgainstSchema({ port: 3000 }, 'server').valid, true);
    });

    it('clear removes all schemas', function () {
      const cv = new ConfigurationValidation();
      cv.addSchema('s1', [{ field: 'a' }]);
      cv.clear();
      assert.strictEqual(cv.getSchema('s1'), null);
    });
  });

  describe('configurationManager.js', function () {
    it('getConfig returns resolved value from registry', function () {
      const cm = new ConfigurationManager();
      cm.setConfig('db.url', 'localhost');
      assert.strictEqual(cm.getConfig('db.url'), 'localhost');
    });

    it('setConfig stores value in registry', function () {
      const cm = new ConfigurationManager();
      cm.setConfig('port', 3000);
      assert.strictEqual(cm.getConfig('port'), 3000);
    });

    it('activateProfile uses profile configs', function () {
      const cm = new ConfigurationManager();
      cm._profiles.createProfile('dev', { debug: true });
      cm.activateProfile('dev');
      assert.strictEqual(cm.getConfig('debug'), true);
    });

    it('getConfigValue returns default for missing', function () {
      const cm = new ConfigurationManager();
      assert.strictEqual(cm.getConfigValue('unknown', 'fallback'), 'fallback');
    });

    it('getConfigValue returns actual when exists', function () {
      const cm = new ConfigurationManager();
      cm.setConfig('port', 3000);
      assert.strictEqual(cm.getConfigValue('port', 8080), 3000);
    });

    it('getConfig uses override before registry', function () {
      const cm = new ConfigurationManager();
      cm.setConfig('db.url', 'localhost');
      cm._overrides.setOverride('db.url', 'override-host');
      assert.strictEqual(cm.getConfig('db.url'), 'override-host');
    });

    it('getStatus returns counts', function () {
      const cm = new ConfigurationManager();
      cm.setConfig('a', 1);
      cm.setConfig('b', 2);
      assert.strictEqual(cm.getStatus().total, 2);
    });

    it('clear resets all sub-components', function () {
      const cm = new ConfigurationManager();
      cm.setConfig('a', 1);
      cm.clear();
      assert.strictEqual(cm.getConfig('a'), undefined);
    });
  });

  describe('secretProviders.js', function () {
    it('register stores provider', function () {
      const sp = new SecretProviders();
      sp.register('aws', { name: 'AWS Secrets', getSecret: function () {}, setSecret: function () {} });
      assert.strictEqual(sp.getProvider('aws').name, 'AWS Secrets');
    });

    it('getProvider returns null for unknown', function () {
      const sp = new SecretProviders();
      assert.strictEqual(sp.getProvider('unknown'), null);
    });

    it('register throws for missing methods', function () {
      const sp = new SecretProviders();
      assert.throws(function () { sp.register('bad', { name: 'Bad' }); }, /getSecret/);
    });

    it('register throws for duplicate', function () {
      const sp = new SecretProviders();
      sp.register('aws', { name: 'A', getSecret: function () {}, setSecret: function () {} });
      assert.throws(function () { sp.register('aws', { name: 'B', getSecret: function () {}, setSecret: function () {} }); }, /already registered/);
    });

    it('listProviders returns all providers', function () {
      const sp = new SecretProviders();
      sp.register('a', { name: 'A', getSecret: function () {}, setSecret: function () {} });
      sp.register('b', { name: 'B', getSecret: function () {}, setSecret: function () {} });
      assert.strictEqual(sp.listProviders().length, 2);
    });

    it('clear removes all providers', function () {
      const sp = new SecretProviders();
      sp.register('a', { name: 'A', getSecret: function () {}, setSecret: function () {} });
      sp.clear();
      assert.strictEqual(sp.listProviders().length, 0);
    });
  });

  describe('secretRotation.js', function () {
    it('scheduleRotation stores rotation schedule', function () {
      const sr = new SecretRotation();
      sr.scheduleRotation('db-password', 86400000);
      const status = sr.getRotationStatus('db-password');
      assert.ok(status);
      assert.strictEqual(status.interval, 86400000);
    });

    it('rotate updates lastRotated and nextRotation', function () {
      const sr = new SecretRotation();
      sr.scheduleRotation('db-password', 86400000);
      assert.strictEqual(sr.rotate('db-password'), true);
      assert.ok(sr.getRotationStatus('db-password').lastRotated);
    });

    it('rotate returns false for unknown', function () {
      const sr = new SecretRotation();
      assert.strictEqual(sr.rotate('unknown'), false);
    });

    it('getRotationStatus returns null for unknown', function () {
      const sr = new SecretRotation();
      assert.strictEqual(sr.getRotationStatus('unknown'), null);
    });

    it('listRotations returns all rotations', function () {
      const sr = new SecretRotation();
      sr.scheduleRotation('a', 1000);
      sr.scheduleRotation('b', 2000);
      assert.strictEqual(sr.listRotations().length, 2);
    });

    it('cancelRotation removes rotation', function () {
      const sr = new SecretRotation();
      sr.scheduleRotation('a', 1000);
      assert.strictEqual(sr.cancelRotation('a'), true);
      assert.strictEqual(sr.getRotationStatus('a'), null);
    });

    it('cancelRotation returns false for unknown', function () {
      const sr = new SecretRotation();
      assert.strictEqual(sr.cancelRotation('unknown'), false);
    });

    it('clear removes all rotations', function () {
      const sr = new SecretRotation();
      sr.scheduleRotation('a', 1000);
      sr.clear();
      assert.strictEqual(sr.listRotations().length, 0);
    });
  });

  describe('secretVersioning.js', function () {
    it('createVersion creates new version and returns number', function () {
      const sv = new SecretVersioning();
      assert.strictEqual(sv.createVersion('db-pw', 'secret123'), 1);
    });

    it('getVersion returns specific version', function () {
      const sv = new SecretVersioning();
      sv.createVersion('db-pw', 'v1');
      const entry = sv.getVersion('db-pw', 1);
      assert.strictEqual(entry.version, 1);
      assert.strictEqual(entry.value, 'v1');
    });

    it('getVersion returns null for missing', function () {
      const sv = new SecretVersioning();
      assert.strictEqual(sv.getVersion('db-pw', 999), null);
    });

    it('getLatestVersion returns most recent', function () {
      const sv = new SecretVersioning();
      sv.createVersion('db-pw', 'v1');
      sv.createVersion('db-pw', 'v2');
      const latest = sv.getLatestVersion('db-pw');
      assert.strictEqual(latest.value, 'v2');
    });

    it('getLatestVersion returns null for unknown', function () {
      const sv = new SecretVersioning();
      assert.strictEqual(sv.getLatestVersion('unknown'), null);
    });

    it('listVersions returns all version metadata', function () {
      const sv = new SecretVersioning();
      sv.createVersion('db-pw', 'v1');
      sv.createVersion('db-pw', 'v2');
      assert.strictEqual(sv.listVersions('db-pw').length, 2);
    });

    it('clear removes all versions', function () {
      const sv = new SecretVersioning();
      sv.createVersion('db-pw', 'v1');
      sv.clear();
      assert.strictEqual(sv.getLatestVersion('db-pw'), null);
    });
  });

  describe('secretAudit.js', function () {
    it('recordAccess stores audit entry', function () {
      const sa = new SecretAudit();
      sa.recordAccess('db-pw', 'read', 'admin');
      assert.strictEqual(sa.query({}).length, 1);
    });

    it('query filters by key', function () {
      const sa = new SecretAudit();
      sa.recordAccess('a', 'read', 'admin');
      sa.recordAccess('b', 'read', 'admin');
      assert.strictEqual(sa.query({ secretKey: 'a' }).length, 1);
    });

    it('query filters by action', function () {
      const sa = new SecretAudit();
      sa.recordAccess('a', 'read', 'admin');
      sa.recordAccess('a', 'write', 'admin');
      assert.strictEqual(sa.query({ action: 'write' }).length, 1);
    });

    it('query filters by actor', function () {
      const sa = new SecretAudit();
      sa.recordAccess('a', 'read', 'admin');
      sa.recordAccess('a', 'read', 'user');
      assert.strictEqual(sa.query({ actor: 'admin' }).length, 1);
    });

    it('getStats returns counts', function () {
      const sa = new SecretAudit();
      sa.recordAccess('a', 'read', 'admin');
      sa.recordAccess('a', 'write', 'admin');
      sa.recordAccess('b', 'read', 'admin');
      const stats = sa.getStats();
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.byAction.read, 2);
    });

    it('clear removes all entries', function () {
      const sa = new SecretAudit();
      sa.recordAccess('a', 'read', 'admin');
      sa.clear();
      assert.strictEqual(sa.getStats().total, 0);
    });
  });

  describe('secretManager.js', function () {
    it('getSecret returns masked in sim mode', function () {
      const sm = new SecretManager();
      assert.strictEqual(sm.getSecret('missing', { simulate: true }), '***masked***');
    });

    it('setSecret stores locally and creates version', function () {
      const sm = new SecretManager();
      sm.setSecret('api-key', 'sk-123');
      assert.strictEqual(sm.getSecret('api-key'), 'sk-123');
    });

    it('rotateSecret rotates and returns true', function () {
      const sm = new SecretManager();
      sm._rotation.scheduleRotation('api-key', 1000);
      assert.strictEqual(sm.rotateSecret('api-key'), true);
    });

    it('rotateSecret throws for missing key', function () {
      const sm = new SecretManager();
      assert.throws(function () { sm.rotateSecret(null); }, /required/);
    });

    it('getStatus returns counts', function () {
      const sm = new SecretManager();
      sm.setSecret('a', 'v1');
      sm.setSecret('b', 'v2');
      assert.strictEqual(sm.getStatus().total, 2);
    });

    it('getStatus returns empty for fresh instance', function () {
      const sm = new SecretManager();
      assert.strictEqual(sm.getStatus().total, 0);
    });

    it('clear resets all sub-components', function () {
      const sm = new SecretManager();
      sm.setSecret('a', 'v1');
      sm.clear();
      assert.strictEqual(sm.getSecret('a'), null);
    });
  });

  describe('serviceRegistry.js', function () {
    it('register stores service entry', function () {
      const sr = new ServiceRegistry();
      sr.register({ id: 's1', name: 'auth-service', host: 'localhost', port: 3001 });
      const svc = sr.get('s1');
      assert.strictEqual(svc.name, 'auth-service');
    });

    it('get returns null for unknown', function () {
      const sr = new ServiceRegistry();
      assert.strictEqual(sr.get('unknown'), null);
    });

    it('unregister returns true and removes', function () {
      const sr = new ServiceRegistry();
      sr.register({ id: 's1', name: 'svc' });
      assert.strictEqual(sr.unregister('s1'), true);
      assert.strictEqual(sr.get('s1'), null);
    });

    it('unregister returns false for non-existent', function () {
      const sr = new ServiceRegistry();
      assert.strictEqual(sr.unregister('unknown'), false);
    });

    it('findByName returns instances by name', function () {
      const sr = new ServiceRegistry();
      sr.register({ id: 'a', name: 'api' });
      sr.register({ id: 'b', name: 'api' });
      sr.register({ id: 'c', name: 'web' });
      assert.strictEqual(sr.findByName('api').length, 2);
    });

    it('findByTag finds by metadata tag', function () {
      const sr = new ServiceRegistry();
      sr.register({ id: 'a', name: 'svc', metadata: { tags: ['frontend'] } });
      sr.register({ id: 'b', name: 'svc', metadata: { tags: ['backend'] } });
      assert.strictEqual(sr.findByTag('frontend').length, 1);
    });

    it('list returns all services', function () {
      const sr = new ServiceRegistry();
      sr.register({ id: 'a', name: 's1' });
      sr.register({ id: 'b', name: 's2' });
      assert.strictEqual(sr.list().length, 2);
    });

    it('register throws for missing id', function () {
      const sr = new ServiceRegistry();
      assert.throws(function () { sr.register({}); }, /id/);
    });

    it('clear removes all services', function () {
      const sr = new ServiceRegistry();
      sr.register({ id: 'a', name: 'svc' });
      sr.clear();
      assert.strictEqual(sr.list().length, 0);
    });
  });

  describe('serviceDiscovery.js', function () {
    it('discover returns instances by name', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 'a', name: 'api' });
      const sd = new ServiceDiscovery(reg);
      assert.strictEqual(sd.discover('api').length, 1);
    });

    it('discover returns empty for unknown', function () {
      const reg = new ServiceRegistry();
      const sd = new ServiceDiscovery(reg);
      assert.deepStrictEqual(sd.discover('unknown'), []);
    });

    it('discoverAll returns all instances', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 'a', name: 's1' });
      reg.register({ id: 'b', name: 's2' });
      const sd = new ServiceDiscovery(reg);
      assert.strictEqual(sd.discoverAll().length, 2);
    });

    it('getInstance returns single instance', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 'a', name: 'api', host: 'h1', port: 1 });
      const sd = new ServiceDiscovery(reg);
      assert.ok(sd.getInstance('api'));
    });

    it('getInstance returns null when no instances', function () {
      const reg = new ServiceRegistry();
      const sd = new ServiceDiscovery(reg);
      assert.strictEqual(sd.getInstance('unknown'), null);
    });

    it('refresh clears round-robin state', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 'a', name: 'api' });
      const sd = new ServiceDiscovery(reg);
      sd.getInstance('api');
      assert.strictEqual(sd.refresh().length, 1);
    });

    it('clear resets discovery', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 'a', name: 'svc' });
      const sd = new ServiceDiscovery(reg);
      sd.clear();
      assert.strictEqual(sd.discoverAll().length, 0);
    });
  });

  describe('serviceHealth.js', function () {
    it('check returns healthy for valid service', function () {
      const sh = new ServiceHealth();
      const result = sh.check({ id: 's1', host: 'localhost', port: 3000 });
      assert.strictEqual(result.status, 'healthy');
    });

    it('check returns degraded for missing host/port', function () {
      const sh = new ServiceHealth();
      assert.strictEqual(sh.check({ id: 's1' }).status, 'degraded');
    });

    it('checkAll returns results for all services', function () {
      const sh = new ServiceHealth();
      const results = sh.checkAll([{ id: 'a', host: 'h', port: 1 }, { id: 'b', host: 'h', port: 2 }]);
      assert.strictEqual(results.length, 2);
    });

    it('getStatus returns last check result', function () {
      const sh = new ServiceHealth();
      sh.check({ id: 's1', host: 'h', port: 3000 });
      assert.strictEqual(sh.getStatus('s1').status, 'healthy');
    });

    it('getStatus returns null for unknown', function () {
      const sh = new ServiceHealth();
      assert.strictEqual(sh.getStatus('unknown'), null);
    });

    it('getUnhealthy returns degraded/down services', function () {
      const sh = new ServiceHealth();
      sh.check({ id: 'good', host: 'h', port: 1 });
      sh.check({ id: 'bad' });
      const unhealthy = sh.getUnhealthy();
      assert.strictEqual(unhealthy.length, 1);
    });

    it('clear removes all statuses', function () {
      const sh = new ServiceHealth();
      sh.check({ id: 's1', host: 'h', port: 1 });
      sh.clear();
      assert.strictEqual(sh.getStatus('s1'), null);
    });
  });

  describe('serviceResolver.js', function () {
    it('resolve returns host/port/protocol/url', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 's1', name: 'api', host: 'api.example.com', port: 443, protocol: 'https' });
      const resolver = new ServiceResolver(reg);
      const resolved = resolver.resolve('api');
      assert.strictEqual(resolved.host, 'api.example.com');
      assert.strictEqual(resolved.port, 443);
      assert.strictEqual(resolved.protocol, 'https');
      assert.strictEqual(resolved.url, 'https://api.example.com:443');
    });

    it('resolve returns null for unknown', function () {
      const reg = new ServiceRegistry();
      const resolver = new ServiceResolver(reg);
      assert.strictEqual(resolver.resolve('unknown'), null);
    });

    it('resolveUrl returns url string', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 's1', name: 'api', host: 'h', port: 80, protocol: 'http' });
      const resolver = new ServiceResolver(reg);
      assert.strictEqual(resolver.resolveUrl('api'), 'http://h:80');
    });

    it('resolveAll returns map of resolved services', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 'a', name: 'api', host: 'h1', port: 80, protocol: 'http' });
      reg.register({ id: 'b', name: 'web', host: 'h2', port: 8080, protocol: 'http' });
      const resolver = new ServiceResolver(reg);
      const all = resolver.resolveAll(['api', 'web']);
      assert.ok(all.api);
      assert.ok(all.web);
    });

    it('clear resets underlying registry', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 'a', name: 'api', host: 'h', port: 80 });
      const resolver = new ServiceResolver(reg);
      resolver.clear();
      assert.strictEqual(resolver.resolve('api'), null);
    });
  });

  describe('distributedLocks.js', function () {
    it('acquire returns lock object', function () {
      const dl = new DistributedLocks();
      const lock = dl.acquire('lock1', 'holder1', 30000);
      assert.ok(lock);
      assert.strictEqual(lock.name, 'lock1');
      assert.strictEqual(lock.holder, 'holder1');
    });

    it('isLocked returns true after acquire', function () {
      const dl = new DistributedLocks();
      dl.acquire('lock1', 'holder1', 30000);
      assert.strictEqual(dl.isLocked('lock1'), true);
    });

    it('isLocked returns false for non-existent', function () {
      const dl = new DistributedLocks();
      assert.strictEqual(dl.isLocked('unknown'), false);
    });

    it('acquire returns null for already held lock', function () {
      const dl = new DistributedLocks();
      dl.acquire('lock1', 'holder1', 30000);
      assert.strictEqual(dl.acquire('lock1', 'holder2', 30000), null);
    });

    it('release by holder succeeds', function () {
      const dl = new DistributedLocks();
      dl.acquire('lock1', 'holder1', 30000);
      assert.strictEqual(dl.release('lock1', 'holder1'), true);
      assert.strictEqual(dl.isLocked('lock1'), false);
    });

    it('release by wrong holder fails', function () {
      const dl = new DistributedLocks();
      dl.acquire('lock1', 'holder1', 30000);
      assert.strictEqual(dl.release('lock1', 'holder2'), false);
    });

    it('getLock returns lock info', function () {
      const dl = new DistributedLocks();
      dl.acquire('lock1', 'holder1', 30000);
      const info = dl.getLock('lock1');
      assert.strictEqual(info.name, 'lock1');
      assert.strictEqual(info.holder, 'holder1');
    });

    it('getLock returns null for non-existent', function () {
      const dl = new DistributedLocks();
      assert.strictEqual(dl.getLock('unknown'), null);
    });

    it('forceRelease removes lock and returns true', function () {
      const dl = new DistributedLocks();
      dl.acquire('lock1', 'holder1', 30000);
      assert.strictEqual(dl.forceRelease('lock1'), true);
      assert.strictEqual(dl.isLocked('lock1'), false);
    });

    it('forceRelease returns false for non-existent', function () {
      const dl = new DistributedLocks();
      assert.strictEqual(dl.forceRelease('unknown'), false);
    });

    it('listLocks returns all active locks', function () {
      const dl = new DistributedLocks();
      dl.acquire('a', 'h1', 30000);
      dl.acquire('b', 'h2', 30000);
      assert.strictEqual(dl.listLocks().length, 2);
    });

    it('expired lock auto-releases', function (done) {
      const dl = new DistributedLocks();
      dl.acquire('lock1', 'holder1', 1);
      setTimeout(function () {
        assert.strictEqual(dl.isLocked('lock1'), false);
        done();
      }, 5);
    });

    it('clear removes all locks', function () {
      const dl = new DistributedLocks();
      dl.acquire('a', 'h1', 30000);
      dl.clear();
      assert.strictEqual(dl.listLocks().length, 0);
    });
  });

  describe('leaseManager.js', function () {
    it('acquireLease returns lease object', function () {
      const lm = new LeaseManager();
      const lease = lm.acquireLease('lease1', 'holder1', 60000);
      assert.ok(lease);
      assert.strictEqual(lease.name, 'lease1');
    });

    it('acquireLease returns null for active lease', function () {
      const lm = new LeaseManager();
      lm.acquireLease('lease1', 'holder1', 60000);
      assert.strictEqual(lm.acquireLease('lease1', 'holder2', 60000), null);
    });

    it('renewLease extends duration', function () {
      const lm = new LeaseManager();
      lm.acquireLease('lease1', 'holder1', 60000);
      assert.strictEqual(lm.renewLease('lease1', 'holder1', 120000), true);
    });

    it('renewLease returns false for wrong holder', function () {
      const lm = new LeaseManager();
      lm.acquireLease('lease1', 'holder1', 60000);
      assert.strictEqual(lm.renewLease('lease1', 'holder2', 120000), false);
    });

    it('releaseLease removes lease', function () {
      const lm = new LeaseManager();
      lm.acquireLease('lease1', 'holder1', 60000);
      assert.strictEqual(lm.releaseLease('lease1', 'holder1'), true);
    });

    it('releaseLease returns false for wrong holder', function () {
      const lm = new LeaseManager();
      lm.acquireLease('lease1', 'holder1', 60000);
      assert.strictEqual(lm.releaseLease('lease1', 'holder2'), false);
    });

    it('isLeaseValid returns true for active lease', function () {
      const lm = new LeaseManager();
      lm.acquireLease('lease1', 'holder1', 60000);
      assert.strictEqual(lm.isLeaseValid('lease1'), true);
    });

    it('isLeaseValid returns false for expired', function () {
      const lm = new LeaseManager();
      lm.acquireLease('lease1', 'holder1', -1);
      assert.strictEqual(lm.isLeaseValid('lease1'), false);
    });

    it('getLease returns lease info', function () {
      const lm = new LeaseManager();
      lm.acquireLease('lease1', 'holder1', 60000);
      assert.strictEqual(lm.getLease('lease1').name, 'lease1');
    });

    it('listLeases returns all active leases', function () {
      const lm = new LeaseManager();
      lm.acquireLease('a', 'h1', 60000);
      lm.acquireLease('b', 'h2', 60000);
      assert.strictEqual(lm.listLeases().length, 2);
    });

    it('clear removes all leases', function () {
      const lm = new LeaseManager();
      lm.acquireLease('a', 'h1', 60000);
      lm.clear();
      assert.strictEqual(lm.listLeases().length, 0);
    });
  });

  describe('leaderRuntime.js', function () {
    it('electLeader returns node id', function () {
      const lr = new LeaderRuntime();
      const leader = lr.electLeader('group1');
      assert.ok(leader);
      assert.ok(leader.startsWith('node-'));
    });

    it('electLeader returns same leader for subsequent calls', function () {
      const lr = new LeaderRuntime();
      const l1 = lr.electLeader('group1');
      const l2 = lr.electLeader('group1');
      assert.strictEqual(l1, l2);
    });

    it('isLeader checks if node is leader', function () {
      const lr = new LeaderRuntime();
      const leader = lr.electLeader('group1');
      assert.strictEqual(lr.isLeader('group1', leader), true);
      assert.strictEqual(lr.isLeader('group1', 'other'), false);
    });

    it('getLeader returns current leader', function () {
      const lr = new LeaderRuntime();
      const leader = lr.electLeader('group1');
      assert.strictEqual(lr.getLeader('group1'), leader);
    });

    it('getLeader returns null for unknown group', function () {
      const lr = new LeaderRuntime();
      assert.strictEqual(lr.getLeader('unknown'), null);
    });

    it('stepDown changes leader and returns true', function () {
      const lr = new LeaderRuntime();
      lr.electLeader('group1');
      assert.strictEqual(lr.stepDown('group1'), true);
      const newLeader = lr.electLeader('group1');
      assert.ok(newLeader);
    });

    it('listGroups returns all groups', function () {
      const lr = new LeaderRuntime();
      lr.electLeader('g1');
      lr.electLeader('g2');
      assert.strictEqual(lr.listGroups().length, 2);
    });

    it('clear removes all leaders', function () {
      const lr = new LeaderRuntime();
      lr.electLeader('g1');
      lr.clear();
      assert.strictEqual(lr.listGroups().length, 0);
    });
  });

  describe('coordinationEngine.js', function () {
    it('executeWithLock acquires and executes function', function () {
      const ce = new CoordinationEngine();
      const result = ce.executeWithLock('lock1', 'holder1', function () { return 'done'; });
      assert.strictEqual(result, 'done');
    });

    it('executeWithLock returns null when lock held', function () {
      const ce = new CoordinationEngine();
      ce._locks.acquire('lock1', 'holder1', 30000);
      const result = ce.executeWithLock('lock1', 'holder2', function () { return 'x'; });
      assert.strictEqual(result, null);
    });

    it('executeWithLock releases lock after execution', function () {
      const ce = new CoordinationEngine();
      ce.executeWithLock('lock1', 'h1', function () { return 42; });
      const result = ce.executeWithLock('lock1', 'h2', function () { return 99; });
      assert.strictEqual(result, 99);
    });

    it('getStatus returns locks/leases/leaders info', function () {
      const ce = new CoordinationEngine();
      const status = ce.getStatus();
      assert.ok(Array.isArray(status.locks));
      assert.ok(Array.isArray(status.leases));
      assert.ok(Array.isArray(status.leaders));
    });

    it('getStatus reflects active locks', function () {
      const ce = new CoordinationEngine();
      ce._locks.acquire('test-lock', 'holder', 30000);
      assert.strictEqual(ce.getStatus().locks.length, 1);
    });

    it('clear resets all sub-components', function () {
      const ce = new CoordinationEngine();
      ce._locks.acquire('a', 'h', 30000);
      ce.clear();
      assert.strictEqual(ce.getStatus().locks.length, 0);
    });
  });

  describe('runtimePolicies.js', function () {
    it('definePolicy stores policy and returns true', function () {
      const rp = new RuntimePolicies();
      const result = rp.definePolicy('p1', { name: 'Policy1', description: 'Test', rules: ['rule1'], actions: ['notify'], severity: 'high' });
      assert.strictEqual(result, true);
    });

    it('getPolicy returns stored policy', function () {
      const rp = new RuntimePolicies();
      rp.definePolicy('p1', { name: 'Policy1', description: 'Test', rules: ['r1'], actions: ['a1'], severity: 'high' });
      const policy = rp.getPolicy('p1');
      assert.strictEqual(policy.name, 'Policy1');
    });

    it('getPolicy returns null for unknown', function () {
      const rp = new RuntimePolicies();
      assert.strictEqual(rp.getPolicy('unknown'), null);
    });

    it('listPolicies returns all policies', function () {
      const rp = new RuntimePolicies();
      rp.definePolicy('a', { name: 'A', description: 'd', rules: [], actions: [], severity: 'low' });
      rp.definePolicy('b', { name: 'B', description: 'd', rules: [], actions: [], severity: 'low' });
      assert.strictEqual(rp.listPolicies().length, 2);
    });

    it('updatePolicy modifies existing policy', function () {
      const rp = new RuntimePolicies();
      rp.definePolicy('p1', { name: 'P1', description: 'old', rules: [], actions: [], severity: 'low' });
      rp.updatePolicy('p1', { description: 'new', severity: 'high' });
      const policy = rp.getPolicy('p1');
      assert.strictEqual(policy.description, 'new');
      assert.strictEqual(policy.severity, 'high');
    });

    it('updatePolicy returns false for unknown', function () {
      const rp = new RuntimePolicies();
      assert.strictEqual(rp.updatePolicy('unknown', { description: 'new' }), false);
    });

    it('removePolicy removes and returns true', function () {
      const rp = new RuntimePolicies();
      rp.definePolicy('p1', { name: 'P1', description: 'd', rules: [], actions: [], severity: 'low' });
      assert.strictEqual(rp.removePolicy('p1'), true);
      assert.strictEqual(rp.getPolicy('p1'), null);
    });

    it('clear removes all policies', function () {
      const rp = new RuntimePolicies();
      rp.definePolicy('a', { name: 'A', description: 'd', rules: [], actions: [], severity: 'low' });
      rp.clear();
      assert.strictEqual(rp.listPolicies().length, 0);
    });
  });

  describe('runtimeConstraints.js', function () {
    it('addConstraint stores constraint', function () {
      const rc = new RuntimeConstraints();
      const result = rc.addConstraint('c1', { name: 'MinPort', field: 'port', operator: 'gte', value: 1024, message: 'Port too low' });
      assert.strictEqual(result, true);
    });

    it('checkConstraint with eq operator', function () {
      const rc = new RuntimeConstraints();
      const result = rc.checkConstraint({ field: 'env', operator: 'eq', value: 'prod', message: 'Not prod' }, { env: 'prod' });
      assert.strictEqual(result.passed, true);
    });

    it('checkConstraint with gt operator', function () {
      const rc = new RuntimeConstraints();
      assert.strictEqual(rc.checkConstraint({ field: 'c', operator: 'gt', value: 5, message: 'low' }, { c: 10 }).passed, true);
      assert.strictEqual(rc.checkConstraint({ field: 'c', operator: 'gt', value: 5, message: 'low' }, { c: 3 }).passed, false);
    });

    it('checkConstraint with lt operator', function () {
      const rc = new RuntimeConstraints();
      const result = rc.checkConstraint({ field: 'load', operator: 'lt', value: 100, message: 'high' }, { load: 50 });
      assert.strictEqual(result.passed, true);
    });

    it('checkConstraint with in operator', function () {
      const rc = new RuntimeConstraints();
      assert.strictEqual(rc.checkConstraint({ field: 'r', operator: 'in', value: ['US', 'EU'], message: 'bad' }, { r: 'US' }).passed, true);
      assert.strictEqual(rc.checkConstraint({ field: 'r', operator: 'in', value: ['US', 'EU'], message: 'bad' }, { r: 'ASIA' }).passed, false);
    });

    it('checkConstraint with regex operator', function () {
      const rc = new RuntimeConstraints();
      assert.strictEqual(rc.checkConstraint({ field: 'email', operator: 'regex', value: '^\\S+@\\S+$', message: 'bad' }, { email: 'a@b.com' }).passed, true);
    });

    it('checkAll returns passed and failed arrays', function () {
      const rc = new RuntimeConstraints();
      rc.addConstraint('c1', { name: 'CheckPort', field: 'port', operator: 'gte', value: 1024, message: 'Too low' });
      rc.addConstraint('c2', { name: 'CheckEnv', field: 'env', operator: 'eq', value: 'prod', message: 'Not prod' });
      const result = rc.checkAll({ port: 3000, env: 'prod' });
      assert.strictEqual(result.passed.length, 2);
      assert.strictEqual(result.failed.length, 0);
    });

    it('listConstraints returns all constraints', function () {
      const rc = new RuntimeConstraints();
      rc.addConstraint('a', { name: 'A', field: 'x', operator: 'eq', value: 1, message: 'm' });
      rc.addConstraint('b', { name: 'B', field: 'y', operator: 'eq', value: 2, message: 'm' });
      assert.strictEqual(rc.listConstraints().length, 2);
    });

    it('clear removes all constraints', function () {
      const rc = new RuntimeConstraints();
      rc.addConstraint('a', { name: 'A', field: 'x', operator: 'eq', value: 1, message: 'm' });
      rc.clear();
      assert.strictEqual(rc.listConstraints().length, 0);
    });
  });

  describe('runtimeApprovals.js', function () {
    it('requestApproval returns request object', function () {
      const ra = new RuntimeApprovals();
      const req = ra.requestApproval('policy1', 'Need access', 'user1');
      assert.ok(req);
      assert.strictEqual(req.status, 'pending');
    });

    it('requestApproval returns null for missing args', function () {
      const ra = new RuntimeApprovals();
      assert.strictEqual(ra.requestApproval(null, 'r', 'u'), null);
    });

    it('approve changes status to approved', function () {
      const ra = new RuntimeApprovals();
      const req = ra.requestApproval('p1', 'r', 'u1');
      assert.strictEqual(ra.approve(req.id, 'admin'), true);
      assert.strictEqual(ra.getRequest(req.id).status, 'approved');
    });

    it('approve returns false for non-pending', function () {
      const ra = new RuntimeApprovals();
      const req = ra.requestApproval('p1', 'r', 'u1');
      ra.approve(req.id, 'admin');
      assert.strictEqual(ra.approve(req.id, 'admin'), false);
    });

    it('reject changes status to rejected', function () {
      const ra = new RuntimeApprovals();
      const req = ra.requestApproval('p1', 'r', 'u1');
      assert.strictEqual(ra.reject(req.id, 'admin', 'Not needed'), true);
      assert.strictEqual(ra.getRequest(req.id).status, 'rejected');
    });

    it('getRequest returns null for unknown id', function () {
      const ra = new RuntimeApprovals();
      assert.strictEqual(ra.getRequest('unknown'), null);
    });

    it('listRequests filters by status', function () {
      const ra = new RuntimeApprovals();
      const r1 = ra.requestApproval('p1', 'r', 'u1');
      const r2 = ra.requestApproval('p2', 'r', 'u1');
      ra.approve(r1.id, 'admin');
      assert.strictEqual(ra.listRequests({ status: 'pending' }).length, 1);
      assert.strictEqual(ra.listRequests({ status: 'approved' }).length, 1);
    });

    it('getPending returns only pending requests', function () {
      const ra = new RuntimeApprovals();
      const r1 = ra.requestApproval('p1', 'r', 'u1');
      const r2 = ra.requestApproval('p2', 'r', 'u1');
      ra.approve(r1.id, 'admin');
      assert.strictEqual(ra.getPending().length, 1);
    });

    it('clear removes all requests', function () {
      const ra = new RuntimeApprovals();
      ra.requestApproval('p1', 'r', 'u1');
      ra.clear();
      assert.strictEqual(ra.getPending().length, 0);
    });
  });

  describe('runtimeSimulation.js', function () {
    it('simulateChange returns result with change and impact', function () {
      const rs = new RuntimeSimulation();
      const result = rs.simulateChange({ type: 'config', target: 'db.url', value: 'newhost' });
      assert.ok(result);
      assert.strictEqual(result.change.type, 'config');
      assert.strictEqual(result.wouldSucceed, true);
    });

    it('simulateChange returns warnings for bad input', function () {
      const rs = new RuntimeSimulation();
      const result = rs.simulateChange({});
      assert.ok(result.warnings.length > 0);
      assert.strictEqual(result.wouldSucceed, false);
    });

    it('simulateChange returns null for null', function () {
      const rs = new RuntimeSimulation();
      assert.strictEqual(rs.simulateChange(null), null);
    });

    it('simulateRollout returns rollout simulation', function () {
      const rs = new RuntimeSimulation();
      const result = rs.simulateRollout({ name: 'r1', strategy: 'canary', phases: [{ percent: 10, duration: 60000 }] });
      assert.ok(result);
      assert.strictEqual(result.wouldSucceed, true);
    });

    it('simulateRollout returns warnings for bad config', function () {
      const rs = new RuntimeSimulation();
      const result = rs.simulateRollout({});
      assert.ok(result.warnings.length > 0);
    });

    it('getSimulationResults returns all results', function () {
      const rs = new RuntimeSimulation();
      rs.simulateChange({ type: 'config', target: 'x', value: 'y' });
      rs.simulateRollout({ name: 'r1', strategy: 's', phases: [{ percent: 10, duration: 1000 }] });
      assert.strictEqual(rs.getSimulationResults().length, 2);
    });

    it('clear removes all results', function () {
      const rs = new RuntimeSimulation();
      rs.simulateChange({ type: 'config', target: 'x', value: 'y' });
      rs.clear();
      assert.strictEqual(rs.getSimulationResults().length, 0);
    });
  });

  describe('rolloutManager.js', function () {
    it('createRollout returns rollout object', function () {
      const rm = new RolloutManager();
      const rollout = rm.createRollout('r1', { type: 'canary', target: 'api', strategy: '10percent' });
      assert.ok(rollout);
      assert.strictEqual(rollout.status, 'created');
    });

    it('createRollout returns null for missing config', function () {
      const rm = new RolloutManager();
      assert.strictEqual(rm.createRollout('r1', {}), null);
    });

    it('getRollout returns rollout by name', function () {
      const rm = new RolloutManager();
      rm.createRollout('r1', { type: 't', target: 't', strategy: 's' });
      assert.strictEqual(rm.getRollout('r1').name, 'r1');
    });

    it('getRollout returns null for unknown', function () {
      const rm = new RolloutManager();
      assert.strictEqual(rm.getRollout('unknown'), null);
    });

    it('listRollouts returns all rollouts', function () {
      const rm = new RolloutManager();
      rm.createRollout('a', { type: 't', target: 't', strategy: 's' });
      rm.createRollout('b', { type: 't', target: 't', strategy: 's' });
      assert.strictEqual(rm.listRollouts().length, 2);
    });

    it('startRollout activates rollout', function () {
      const rm = new RolloutManager();
      rm.createRollout('r1', { type: 't', target: 't', strategy: 's' });
      assert.strictEqual(rm.startRollout('r1'), true);
      assert.strictEqual(rm.getRollout('r1').status, 'active');
    });

    it('pauseRollout pauses active rollout', function () {
      const rm = new RolloutManager();
      rm.createRollout('r1', { type: 't', target: 't', strategy: 's' });
      rm.startRollout('r1');
      assert.strictEqual(rm.pauseRollout('r1'), true);
      assert.strictEqual(rm.getRollout('r1').status, 'paused');
    });

    it('resumeRollout resumes paused rollout', function () {
      const rm = new RolloutManager();
      rm.createRollout('r1', { type: 't', target: 't', strategy: 's' });
      rm.startRollout('r1');
      rm.pauseRollout('r1');
      assert.strictEqual(rm.resumeRollout('r1'), true);
      assert.strictEqual(rm.getRollout('r1').status, 'active');
    });

    it('completeRollout completes active rollout', function () {
      const rm = new RolloutManager();
      rm.createRollout('r1', { type: 't', target: 't', strategy: 's' });
      rm.startRollout('r1');
      assert.strictEqual(rm.completeRollout('r1'), true);
      assert.strictEqual(rm.getRollout('r1').status, 'completed');
    });

    it('cancelRollout cancels active rollout', function () {
      const rm = new RolloutManager();
      rm.createRollout('r1', { type: 't', target: 't', strategy: 's' });
      rm.startRollout('r1');
      assert.strictEqual(rm.cancelRollout('r1'), true);
      assert.strictEqual(rm.getRollout('r1').status, 'cancelled');
    });

    it('getStatus returns counts by status', function () {
      const rm = new RolloutManager();
      rm.createRollout('a', { type: 't', target: 't', strategy: 's' });
      rm.createRollout('b', { type: 't', target: 't', strategy: 's' });
      rm.startRollout('a');
      const status = rm.getStatus();
      assert.strictEqual(status.active, 1);
    });

    it('clear removes all rollouts', function () {
      const rm = new RolloutManager();
      rm.createRollout('a', { type: 't', target: 't', strategy: 's' });
      rm.clear();
      assert.strictEqual(rm.listRollouts().length, 0);
    });
  });

  describe('canaryRollout.js', function () {
    it('startCanary returns canary info', function () {
      const cr = new CanaryRollout();
      const result = cr.startCanary({ service: 'api', newVersion: 'v2', canaryPercent: 10 });
      assert.ok(result);
      assert.strictEqual(result.status, 'running');
    });

    it('startCanary returns null for duplicate', function () {
      const cr = new CanaryRollout();
      cr.startCanary({ service: 'api', newVersion: 'v2' });
      assert.strictEqual(cr.startCanary({ service: 'api', newVersion: 'v3' }), null);
    });

    it('getCanaryStatus returns status info', function () {
      const cr = new CanaryRollout();
      cr.startCanary({ service: 'api', newVersion: 'v2' });
      const status = cr.getCanaryStatus('api');
      assert.strictEqual(status.newVersion, 'v2');
    });

    it('getCanaryStatus returns null for unknown', function () {
      const cr = new CanaryRollout();
      assert.strictEqual(cr.getCanaryStatus('unknown'), null);
    });

    it('promoteCanary promotes to 100 percent', function () {
      const cr = new CanaryRollout();
      cr.startCanary({ service: 'api', newVersion: 'v2' });
      assert.strictEqual(cr.promoteCanary('api'), true);
      const status = cr.getCanaryStatus('api');
      assert.strictEqual(status.status, 'promoted');
      assert.strictEqual(status.canaryPercent, 100);
    });

    it('rollbackCanary rolls back', function () {
      const cr = new CanaryRollout();
      cr.startCanary({ service: 'api', newVersion: 'v2' });
      assert.strictEqual(cr.rollbackCanary('api'), true);
      assert.strictEqual(cr.getCanaryStatus('api').status, 'rolled-back');
    });

    it('adjustCanaryPercent changes percentage', function () {
      const cr = new CanaryRollout();
      cr.startCanary({ service: 'api', newVersion: 'v2', canaryPercent: 10 });
      assert.strictEqual(cr.adjustCanaryPercent('api', 25), true);
      assert.strictEqual(cr.getCanaryStatus('api').canaryPercent, 25);
    });

    it('clear removes all canaries', function () {
      const cr = new CanaryRollout();
      cr.startCanary({ service: 'api', newVersion: 'v2' });
      cr.clear();
      assert.strictEqual(cr.getCanaryStatus('api'), null);
    });
  });

  describe('blueGreenRollout.js', function () {
    it('startBlueGreen returns deployment info', function () {
      const bg = new BlueGreenRollout();
      const result = bg.startBlueGreen({ service: 'api', blueVersion: 'v1', greenVersion: 'v2' });
      assert.ok(result);
      assert.strictEqual(result.active, 'blue');
    });

    it('startBlueGreen returns null for duplicate', function () {
      const bg = new BlueGreenRollout();
      bg.startBlueGreen({ service: 'api', blueVersion: 'v1', greenVersion: 'v2' });
      assert.strictEqual(bg.startBlueGreen({ service: 'api', blueVersion: 'v3', greenVersion: 'v4' }), null);
    });

    it('switchToGreen switches active', function () {
      const bg = new BlueGreenRollout();
      bg.startBlueGreen({ service: 'api', blueVersion: 'v1', greenVersion: 'v2' });
      assert.strictEqual(bg.switchToGreen('api'), true);
      assert.strictEqual(bg.getStatus('api').active, 'green');
    });

    it('switchToBlue switches back', function () {
      const bg = new BlueGreenRollout();
      bg.startBlueGreen({ service: 'api', blueVersion: 'v1', greenVersion: 'v2' });
      bg.switchToGreen('api');
      assert.strictEqual(bg.switchToBlue('api'), true);
      assert.strictEqual(bg.getStatus('api').active, 'blue');
    });

    it('getStatus returns current deployment state', function () {
      const bg = new BlueGreenRollout();
      bg.startBlueGreen({ service: 'api', blueVersion: 'v1', greenVersion: 'v2' });
      const status = bg.getStatus('api');
      assert.strictEqual(status.blue, 'v1');
    });

    it('getStatus returns null for unknown', function () {
      const bg = new BlueGreenRollout();
      assert.strictEqual(bg.getStatus('unknown'), null);
    });

    it('clear removes all deployments', function () {
      const bg = new BlueGreenRollout();
      bg.startBlueGreen({ service: 'api', blueVersion: 'v1', greenVersion: 'v2' });
      bg.clear();
      assert.strictEqual(bg.getStatus('api'), null);
    });
  });

  describe('progressiveRollout.js', function () {
    it('startProgressive returns rollout info', function () {
      const pr = new ProgressiveRollout();
      const result = pr.startProgressive({ name: 'r1', phases: [{ percent: 10, duration: 60000 }, { percent: 50, duration: 60000 }] });
      assert.ok(result);
      assert.strictEqual(result.status, 'running');
    });

    it('startProgressive returns null for bad config', function () {
      const pr = new ProgressiveRollout();
      assert.strictEqual(pr.startProgressive({ name: 'r1' }), null);
    });

    it('advancePhase advances to next phase', function () {
      const pr = new ProgressiveRollout();
      pr.startProgressive({ name: 'r1', phases: [{ percent: 10, duration: 60000 }, { percent: 50, duration: 60000 }] });
      assert.strictEqual(pr.advancePhase('r1'), true);
    });

    it('advancePhase returns false when all phases complete', function () {
      const pr = new ProgressiveRollout();
      pr.startProgressive({ name: 'r1', phases: [{ percent: 100, duration: 60000 }] });
      assert.strictEqual(pr.advancePhase('r1'), false);
    });

    it('getCurrentPhase returns current phase info', function () {
      const pr = new ProgressiveRollout();
      pr.startProgressive({ name: 'r1', phases: [{ percent: 10, duration: 60000 }, { percent: 50, duration: 60000 }] });
      const phase = pr.getCurrentPhase('r1');
      assert.strictEqual(phase.index, 0);
      assert.strictEqual(phase.percent, 10);
    });

    it('getProgress returns progress info', function () {
      const pr = new ProgressiveRollout();
      pr.startProgressive({ name: 'r1', phases: [{ percent: 10, duration: 1000 }, { percent: 50, duration: 1000 }, { percent: 100, duration: 1000 }] });
      const prog = pr.getProgress('r1');
      assert.strictEqual(prog.currentPhase, 1);
      assert.strictEqual(prog.totalPhases, 3);
    });

    it('clear removes all rollouts', function () {
      const pr = new ProgressiveRollout();
      pr.startProgressive({ name: 'r1', phases: [{ percent: 100, duration: 60000 }] });
      pr.clear();
      assert.strictEqual(pr.getCurrentPhase('r1'), null);
    });
  });

  describe('rollbackManager.js', function () {
    it('executeRollback returns success result', function () {
      const rbm = new RollbackManager();
      const result = rbm.executeRollback('svc1', 'v1.0.0');
      assert.ok(result);
      assert.strictEqual(result.success, true);
    });

    it('executeRollback returns null for missing args', function () {
      const rbm = new RollbackManager();
      assert.strictEqual(rbm.executeRollback(null, 'v1'), null);
    });

    it('canRollback returns true after rollback', function () {
      const rbm = new RollbackManager();
      rbm.executeRollback('svc1', 'v1.0.0');
      assert.strictEqual(rbm.canRollback('svc1'), true);
    });

    it('canRollback returns false for never rolled back', function () {
      const rbm = new RollbackManager();
      assert.strictEqual(rbm.canRollback('unknown'), false);
    });

    it('getRollbackHistory returns all entries', function () {
      const rbm = new RollbackManager();
      rbm.executeRollback('a', 'v1');
      rbm.executeRollback('b', 'v2');
      assert.strictEqual(rbm.getRollbackHistory().length, 2);
    });

    it('clear removes all history', function () {
      const rbm = new RollbackManager();
      rbm.executeRollback('a', 'v1');
      rbm.clear();
      assert.strictEqual(rbm.canRollback('a'), false);
    });
  });

  describe('killSwitchManager.js', function () {
    it('activate returns switch info', function () {
      const ks = new KillSwitchManager();
      const result = ks.activate('feature-x', 'Critical bug');
      assert.ok(result);
      assert.strictEqual(result.key, 'feature-x');
    });

    it('activate returns null for already active', function () {
      const ks = new KillSwitchManager();
      ks.activate('feature-x', 'r');
      assert.strictEqual(ks.activate('feature-x', 'r2'), null);
    });

    it('isActive returns true after activate', function () {
      const ks = new KillSwitchManager();
      ks.activate('feature-x', 'r');
      assert.strictEqual(ks.isActive('feature-x'), true);
    });

    it('isActive returns false for unknown', function () {
      const ks = new KillSwitchManager();
      assert.strictEqual(ks.isActive('unknown'), false);
    });

    it('deactivate deactivates and returns true', function () {
      const ks = new KillSwitchManager();
      ks.activate('feature-x', 'r');
      assert.strictEqual(ks.deactivate('feature-x'), true);
      assert.strictEqual(ks.isActive('feature-x'), false);
    });

    it('getSwitch returns switch info', function () {
      const ks = new KillSwitchManager();
      ks.activate('feature-x', 'Bug');
      assert.strictEqual(ks.getSwitch('feature-x').key, 'feature-x');
    });

    it('listActive returns only active switches', function () {
      const ks = new KillSwitchManager();
      ks.activate('a', 'r1');
      ks.activate('b', 'r2');
      ks.deactivate('b');
      assert.strictEqual(ks.listActive().length, 1);
    });

    it('listAll returns all switches', function () {
      const ks = new KillSwitchManager();
      ks.activate('a', 'r1');
      ks.activate('b', 'r2');
      assert.strictEqual(ks.listAll().length, 2);
    });

    it('clear removes all switches', function () {
      const ks = new KillSwitchManager();
      ks.activate('a', 'r1');
      ks.clear();
      assert.strictEqual(ks.listAll().length, 0);
    });
  });

  describe('emergencyControls.js', function () {
    it('activateEmergency activates and returns true', function () {
      const ec = new EmergencyControls();
      assert.strictEqual(ec.activateEmergency('Security breach'), true);
    });

    it('activateEmergency returns false if already active', function () {
      const ec = new EmergencyControls();
      ec.activateEmergency('R1');
      assert.strictEqual(ec.activateEmergency('R2'), false);
    });

    it('deactivateEmergency deactivates and returns true', function () {
      const ec = new EmergencyControls();
      ec.activateEmergency('R');
      assert.strictEqual(ec.deactivateEmergency(), true);
    });

    it('isEmergencyActive returns true when active', function () {
      const ec = new EmergencyControls();
      ec.activateEmergency('R');
      assert.strictEqual(ec.isEmergencyActive(), true);
    });

    it('getEmergencyInfo returns current state', function () {
      const ec = new EmergencyControls();
      ec.activateEmergency('Fire');
      const info = ec.getEmergencyInfo();
      assert.strictEqual(info.active, true);
      assert.strictEqual(info.reason, 'Fire');
    });

    it('executeAction records in action log', function () {
      const ec = new EmergencyControls();
      ec.activateEmergency('R');
      assert.strictEqual(ec.executeAction('disable-service', 'api'), true);
      assert.strictEqual(ec.getActionLog().length, 2);
    });

    it('executeAction returns false when not active', function () {
      const ec = new EmergencyControls();
      assert.strictEqual(ec.executeAction('disable-service', 'api'), false);
    });

    it('getActionLog returns action history', function () {
      const ec = new EmergencyControls();
      ec.activateEmergency('R');
      ec.executeAction('block-traffic', 'web');
      assert.strictEqual(ec.getActionLog().length, 2);
    });

    it('clear resets all state', function () {
      const ec = new EmergencyControls();
      ec.activateEmergency('R');
      ec.clear();
      assert.strictEqual(ec.isEmergencyActive(), false);
    });
  });

  describe('safeMode.js', function () {
    it('enterSafeMode activates and returns true', function () {
      const sm = new SafeMode();
      assert.strictEqual(sm.enterSafeMode('Maintenance'), true);
    });

    it('enterSafeMode returns false if already active', function () {
      const sm = new SafeMode();
      sm.enterSafeMode('R1');
      assert.strictEqual(sm.enterSafeMode('R2'), false);
    });

    it('exitSafeMode deactivates and returns true', function () {
      const sm = new SafeMode();
      sm.enterSafeMode('R');
      assert.strictEqual(sm.exitSafeMode(), true);
    });

    it('exitSafeMode returns false if not active', function () {
      const sm = new SafeMode();
      assert.strictEqual(sm.exitSafeMode(), false);
    });

    it('isSafeMode returns true when active', function () {
      const sm = new SafeMode();
      sm.enterSafeMode('R');
      assert.strictEqual(sm.isSafeMode(), true);
    });

    it('getSafeModeInfo returns current state', function () {
      const sm = new SafeMode();
      sm.enterSafeMode('Testing');
      const info = sm.getSafeModeInfo();
      assert.strictEqual(info.active, true);
      assert.strictEqual(info.reason, 'Testing');
    });

    it('addSafeFeature adds allowed feature', function () {
      const sm = new SafeMode();
      assert.strictEqual(sm.addSafeFeature('deploy'), true);
    });

    it('isFeatureAllowed returns true for default features', function () {
      const sm = new SafeMode();
      sm.enterSafeMode('R');
      assert.strictEqual(sm.isFeatureAllowed('read'), true);
    });

    it('isFeatureAllowed returns true for added features', function () {
      const sm = new SafeMode();
      sm.enterSafeMode('R');
      sm.addSafeFeature('custom-action');
      assert.strictEqual(sm.isFeatureAllowed('custom-action'), true);
    });

    it('isFeatureAllowed returns false for non-allowed in safe mode', function () {
      const sm = new SafeMode();
      sm.enterSafeMode('R');
      assert.strictEqual(sm.isFeatureAllowed('deploy'), false);
    });

    it('isFeatureAllowed returns true outside safe mode', function () {
      const sm = new SafeMode();
      assert.strictEqual(sm.isFeatureAllowed('anything'), true);
    });

    it('clear resets safe mode and features', function () {
      const sm = new SafeMode();
      sm.enterSafeMode('R');
      sm.addSafeFeature('custom');
      sm.clear();
      assert.strictEqual(sm.isSafeMode(), false);
    });
  });

  describe('runtimeIntegration.js', function () {
    it('enable/disable toggle integration', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      ri.disable();
      assert.strictEqual(ri.isEnabled(), false);
      ri.enable();
      assert.strictEqual(ri.isEnabled(), true);
    });

    it('integrateAI records AI integration', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateAI({ model: 'gpt4' });
      assert.strictEqual(entry.source, 'ai');
    });

    it('integrateAgent records agent integration', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateAgent({ agent: 'helper' });
      assert.strictEqual(entry.source, 'agent');
    });

    it('integrateWorkflow records workflow', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateWorkflow({ id: 'wf1' });
      assert.strictEqual(entry.source, 'workflow');
    });

    it('integrateCluster records cluster', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateCluster({ node: 'n1' });
      assert.strictEqual(entry.source, 'cluster');
    });

    it('integrateGovernance records governance', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateGovernance({ policy: 'p1' });
      assert.strictEqual(entry.source, 'governance');
    });

    it('integrateSecurity records security', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateSecurity({ scan: true });
      assert.strictEqual(entry.source, 'security');
    });

    it('integrateBilling records billing', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateBilling({ cost: 100 });
      assert.strictEqual(entry.source, 'billing');
    });

    it('integrateEvaluation records evaluation', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateEvaluation({ score: 0.9 });
      assert.strictEqual(entry.source, 'evaluation');
    });

    it('integrateDeveloper records developer', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateDeveloper({ action: 'deploy' });
      assert.strictEqual(entry.source, 'developer');
    });

    it('integrateData records data', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateData({ pipeline: 'etl' });
      assert.strictEqual(entry.source, 'data');
    });

    it('integrateTelemetry records telemetry', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      const entry = ri.integrateTelemetry({ metric: 'cpu' });
      assert.strictEqual(entry.source, 'telemetry');
    });

    it('getLog filters by source', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      ri.integrateAI({});
      ri.integrateAgent({});
      const log = ri.getLog({ source: 'ai' });
      assert.strictEqual(log.length, 1);
    });

    it('getLog filters by since', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      ri.integrateAI({});
      const log = ri.getLog({ since: Date.now() + 10000 });
      assert.strictEqual(log.length, 0);
    });

    it('getStats returns counts', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      ri.integrateAI({});
      ri.integrateAI({});
      ri.integrateAgent({});
      const stats = ri.getStats();
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.bySource.ai, 2);
    });

    it('clear removes all log entries', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      ri.integrateAI({});
      ri.clear();
      assert.strictEqual(ri.getStats().total, 0);
    });
  });

  describe('Plugin SDK — ConfigurationProvider', function () {
    it('constructor stores initial config', function () {
      const provider = new (function ConfigurationProvider(config) { this._config = config || {}; this.getConfig = function (k) { return this._config[k]; }; this.setConfig = function (k, v) { this._config[k] = v; }; this.listConfigs = function () { return Object.keys(this._config); }; })({ host: 'localhost' });
      assert.strictEqual(provider.getConfig('host'), 'localhost');
    });

    it('setConfig stores new config value', function () {
      const provider = new (function ConfigurationProvider(config) { this._config = config || {}; this.getConfig = function (k) { return this._config[k]; }; this.setConfig = function (k, v) { this._config[k] = v; }; this.listConfigs = function () { return Object.keys(this._config); }; })();
      provider.setConfig('port', 3000);
      assert.strictEqual(provider.getConfig('port'), 3000);
    });

    it('getConfig returns undefined for unknown', function () {
      const provider = new (function ConfigurationProvider(config) { this._config = config || {}; this.getConfig = function (k) { return this._config[k]; }; this.setConfig = function (k, v) { this._config[k] = v; }; this.listConfigs = function () { return Object.keys(this._config); }; })();
      assert.strictEqual(provider.getConfig('unknown'), undefined);
    });

    it('listConfigs returns all keys', function () {
      const provider = new (function ConfigurationProvider(config) { this._config = config || {}; this.getConfig = function (k) { return this._config[k]; }; this.setConfig = function (k, v) { this._config[k] = v; }; this.listConfigs = function () { return Object.keys(this._config); }; })({ a: 1, b: 2 });
      const keys = provider.listConfigs();
      assert.strictEqual(keys.length, 2);
    });
  });

  describe('Plugin SDK — FeatureFlagProvider', function () {
    it('constructor initializes flags', function () {
      const provider = new (function FeatureFlagProvider(flags) { this._flags = flags || {}; this.isEnabled = function (k) { return !!this._flags[k]; }; this.getValue = function (k) { return this._flags[k]; }; this.listFlags = function () { return Object.keys(this._flags); }; })({ f1: true, f2: false });
      assert.strictEqual(provider.isEnabled('f1'), true);
    });

    it('isEnabled returns correct state', function () {
      const provider = new (function FeatureFlagProvider(flags) { this._flags = flags || {}; this.isEnabled = function (k) { return !!this._flags[k]; }; this.getValue = function (k) { return this._flags[k]; }; this.listFlags = function () { return Object.keys(this._flags); }; })({ f1: true, f2: false });
      assert.strictEqual(provider.isEnabled('f2'), false);
    });

    it('getValue returns flag value', function () {
      const provider = new (function FeatureFlagProvider(flags) { this._flags = flags || {}; this.isEnabled = function (k) { return !!this._flags[k]; }; this.getValue = function (k) { return this._flags[k]; }; this.listFlags = function () { return Object.keys(this._flags); }; })({ f1: true });
      assert.strictEqual(provider.getValue('f1'), true);
    });

    it('listFlags returns all flag keys', function () {
      const provider = new (function FeatureFlagProvider(flags) { this._flags = flags || {}; this.isEnabled = function (k) { return !!this._flags[k]; }; this.getValue = function (k) { return this._flags[k]; }; this.listFlags = function () { return Object.keys(this._flags); }; })({ a: true, b: false, c: true });
      assert.strictEqual(provider.listFlags().length, 3);
    });
  });

  describe('Plugin SDK — SecretProvider', function () {
    it('constructor stores secrets', function () {
      const provider = new (function SecretProvider(secrets) { this._secrets = secrets || {}; this.getSecret = function (k) { return this._secrets[k]; }; this.setSecret = function (k, v) { this._secrets[k] = v; }; this.rotateSecret = function (k) { this._secrets[k] = 'rotated-' + this._secrets[k]; return true; }; })({ key1: 'val1' });
      assert.strictEqual(provider.getSecret('key1'), 'val1');
    });

    it('setSecret stores secret', function () {
      const provider = new (function SecretProvider(secrets) { this._secrets = secrets || {}; this.getSecret = function (k) { return this._secrets[k]; }; this.setSecret = function (k, v) { this._secrets[k] = v; }; this.rotateSecret = function (k) { this._secrets[k] = 'rotated-' + this._secrets[k]; return true; }; })();
      provider.setSecret('api-key', 'sk-456');
      assert.strictEqual(provider.getSecret('api-key'), 'sk-456');
    });

    it('rotateSecret rotates and returns true', function () {
      const provider = new (function SecretProvider(secrets) { this._secrets = secrets || {}; this.getSecret = function (k) { return this._secrets[k]; }; this.setSecret = function (k, v) { this._secrets[k] = v; }; this.rotateSecret = function (k) { this._secrets[k] = 'rotated-' + this._secrets[k]; return true; }; })({ k: 'v' });
      provider.rotateSecret('k');
      assert.ok(provider.getSecret('k').startsWith('rotated-'));
    });

    it('getSecret returns undefined for unknown', function () {
      const provider = new (function SecretProvider(secrets) { this._secrets = secrets || {}; this.getSecret = function (k) { return this._secrets[k]; }; this.setSecret = function (k, v) { this._secrets[k] = v; }; this.rotateSecret = function (k) { this._secrets[k] = 'rotated-' + this._secrets[k]; return true; }; })();
      assert.strictEqual(provider.getSecret('unknown'), undefined);
    });
  });

  describe('Plugin SDK — RuntimeHook', function () {
    it('constructor initializes hooks map', function () {
      const hook = new (function RuntimeHook() { this._hooks = {}; this.onEvent = function (e, h) { if (!this._hooks[e]) this._hooks[e] = []; this._hooks[e].push(h); }; this.trigger = function (e, d) { var h = this._hooks[e]; if (h) h.forEach(function (fn) { fn(d); }); }; this.getHooks = function (e) { return this._hooks[e] || []; }; })();
      assert.ok(hook);
    });

    it('onEvent registers event handler', function () {
      const hook = new (function RuntimeHook() { this._hooks = {}; this.onEvent = function (e, h) { if (!this._hooks[e]) this._hooks[e] = []; this._hooks[e].push(h); }; this.trigger = function (e, d) { var h = this._hooks[e]; if (h) h.forEach(function (fn) { fn(d); }); }; this.getHooks = function (e) { return this._hooks[e] || []; }; })();
      hook.onEvent('start', function () {});
      assert.strictEqual(hook.getHooks('start').length, 1);
    });

    it('trigger calls registered handlers', function () {
      const hook = new (function RuntimeHook() { this._hooks = {}; this.onEvent = function (e, h) { if (!this._hooks[e]) this._hooks[e] = []; this._hooks[e].push(h); }; this.trigger = function (e, d) { var h = this._hooks[e]; if (h) h.forEach(function (fn) { fn(d); }); }; this.getHooks = function (e) { return this._hooks[e] || []; }; })();
      let called = false;
      hook.onEvent('start', function () { called = true; });
      hook.trigger('start');
      assert.ok(called);
    });

    it('getHooks returns handlers for event', function () {
      const hook = new (function RuntimeHook() { this._hooks = {}; this.onEvent = function (e, h) { if (!this._hooks[e]) this._hooks[e] = []; this._hooks[e].push(h); }; this.trigger = function (e, d) { var h = this._hooks[e]; if (h) h.forEach(function (fn) { fn(d); }); }; this.getHooks = function (e) { return this._hooks[e] || []; }; })();
      hook.onEvent('data', function () {});
      hook.onEvent('data', function () {});
      assert.strictEqual(hook.getHooks('data').length, 2);
    });
  });

  describe('Plugin SDK — RolloutProvider', function () {
    it('constructor initializes strategies', function () {
      const provider = new (function RolloutProvider() { this._strategies = {}; this.executeStrategy = function (n, c) { var s = this._strategies[n]; return s ? s(c) : null; }; this.getStrategies = function () { return Object.keys(this._strategies); }; })();
      assert.ok(provider);
    });

    it('executeStrategy executes named strategy', function () {
      const provider = new (function RolloutProvider() { this._strategies = {}; this.executeStrategy = function (n, c) { var s = this._strategies[n]; return s ? s(c) : null; }; this.getStrategies = function () { return Object.keys(this._strategies); }; })();
      provider._strategies['canary'] = function (c) { return { strategy: 'canary', context: c }; };
      const result = provider.executeStrategy('canary', { pct: 10 });
      assert.strictEqual(result.strategy, 'canary');
    });

    it('getStrategies returns registered strategy names', function () {
      const provider = new (function RolloutProvider() { this._strategies = {}; this.executeStrategy = function (n, c) { var s = this._strategies[n]; return s ? s(c) : null; }; this.getStrategies = function () { return Object.keys(this._strategies); }; })();
      provider._strategies['a'] = function () {};
      provider._strategies['b'] = function () {};
      assert.strictEqual(provider.getStrategies().length, 2);
    });
  });

  describe('API Controller', function () {
    it('getOverview returns all required fields', function () {
      const rm = new RuntimeManager();
      rm.start();
      const overview = rm.getStatus();
      assert.ok(overview.version);
      assert.ok(overview.uptime !== undefined);
      assert.ok(overview.components);
      assert.ok(overview.services !== undefined);
    });

    it('getConfiguration returns config info', function () {
      const cm = new ConfigurationManager();
      cm.setConfig('host', 'localhost');
      cm.setConfig('port', 3000);
      const configs = cm.getStatus();
      assert.strictEqual(configs.total, 2);
    });

    it('getFlags returns flag info', function () {
      const fm = new FeatureFlagManager();
      fm.createFlag({ key: 'f1', enabled: true });
      fm.createFlag({ key: 'f2', enabled: false });
      const status = fm.getStatus();
      assert.strictEqual(status.total, 2);
    });

    it('getSecrets returns secret info', function () {
      const sm = new SecretManager();
      sm.setSecret('k1', 'v1');
      const status = sm.getStatus();
      assert.strictEqual(status.total, 1);
    });

    it('getServices returns service info', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 's1', name: 'api' });
      reg.register({ id: 's2', name: 'web' });
      assert.strictEqual(reg.list().length, 2);
    });

    it('getRollouts returns rollout info', function () {
      const rm = new RolloutManager();
      rm.createRollout('r1', { type: 't', target: 't', strategy: 's' });
      rm.createRollout('r2', { type: 't', target: 't', strategy: 's' });
      assert.strictEqual(rm.listRollouts().length, 2);
    });

    it('getLocks returns lock info', function () {
      const dl = new DistributedLocks();
      dl.acquire('l1', 'h1', 30000);
      dl.acquire('l2', 'h2', 30000);
      assert.strictEqual(dl.listLocks().length, 2);
    });

    it('getOverview returns components as map', function () {
      const rm = new RuntimeManager();
      const status = rm.getStatus();
      assert.ok(typeof status.components === 'object');
    });
  });

  describe('Edge Cases', function () {
    it('runtimeManager clear then verify empty', function () {
      const rm = new RuntimeManager();
      rm.registry.register('svc', {});
      rm.storage.set('k', 'v');
      rm.clear();
      assert.strictEqual(rm.registry.count(), 0);
      assert.strictEqual(rm.storage.get('k'), null);
      assert.strictEqual(rm.metrics.getMetricNames().length, 0);
    });

    it('storage cross-namespace isolation', function () {
      const s1 = new RuntimeStorage();
      const s2 = new RuntimeStorage();
      s1.set('shared', 'val1');
      s2.set('shared', 'val2');
      assert.strictEqual(s1.get('shared'), 'val1');
      assert.strictEqual(s2.get('shared'), 'val2');
    });

    it('events fire handler for each emit', function () {
      const ev = new RuntimeEvents();
      const caught = [];
      ev.on('type-a', function (data) { caught.push(data); });
      ev.on('type-b', function (data) { caught.push(data); });
      ev.on('type-c', function (data) { caught.push(data); });
      ev.emit('type-a', { id: 1 });
      ev.emit('type-b', { id: 2 });
      ev.emit('type-c', { id: 3 });
      assert.strictEqual(caught.length, 3);
    });

    it('flags evaluate with null context returns true when no rules', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      reg.register({ key: 'f1', enabled: true });
      const ev = new FeatureFlagEvaluator(reg, tgt);
      assert.strictEqual(ev.isEnabled('f1', null), true);
    });

    it('config resolve with no sources returns undefined', function () {
      const cm = new ConfigurationManager();
      const val = cm.getConfig('nonexistent');
      assert.strictEqual(val, undefined);
    });

    it('secrets get non-existent returns null', function () {
      const sm = new SecretManager();
      const val = sm.getSecret('nonexistent');
      assert.strictEqual(val, null);
    });

    it('locks expire automatically with short ttl', function (done) {
      const dl = new DistributedLocks();
      dl.acquire('exp-lock', 'holder', 1);
      setTimeout(function () {
        assert.strictEqual(dl.isLocked('exp-lock'), false);
        done();
      }, 5);
    });

    it('rollout complete then cancel cycle', function () {
      const rm = new RolloutManager();
      rm.createRollout('r1', { type: 't', target: 't', strategy: 's' });
      rm.startRollout('r1');
      rm.completeRollout('r1');
      assert.strictEqual(rm.getRollout('r1').status, 'completed');
      const result = rm.cancelRollout('r1');
      assert.strictEqual(result, false);
    });

    it('multiple independent RuntimeManager instances', function () {
      const rm1 = new RuntimeManager();
      const rm2 = new RuntimeManager();
      rm1.registry.register('svc1', { name: 'svc1' });
      rm2.registry.register('svc2', { name: 'svc2' });
      assert.strictEqual(rm1.registry.count(), 1);
      assert.strictEqual(rm2.registry.count(), 1);
      assert.strictEqual(rm1.registry.get('svc2'), null);
    });

    it('RuntimeIntegration with many entries', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      for (var i = 0; i < 100; i++) {
        ri.integrateAI({ idx: i });
      }
      const stats = ri.getStats();
      assert.strictEqual(stats.total, 100);
    });

    it('registry register with no name returns false', function () {
      const reg = new RuntimeRegistry();
      assert.strictEqual(reg.register(null, {}), false);
    });

    it('scheduler schedule with invalid args returns null', function () {
      const s = new RuntimeScheduler();
      assert.strictEqual(s.schedule(null, function () {}, 1000), null);
      assert.strictEqual(s.schedule('t', null, 1000), null);
      assert.strictEqual(s.schedule('t', function () {}, -1), null);
    });

    it('feature flag lock evaluate with missing context', function () {
      const reg = new FeatureFlagRegistry();
      const tgt = new FeatureFlagTargeting();
      reg.register({ key: 'f1', enabled: true });
      const ev = new FeatureFlagEvaluator(reg, tgt);
      assert.strictEqual(ev.isEnabled('f1'), true);
    });

    it('config validation with empty rules passes', function () {
      const cv = new ConfigurationValidation();
      const result = cv.validate({}, []);
      assert.strictEqual(result.valid, true);
    });

    it('service discovery round-robin cycles through instances', function () {
      const reg = new ServiceRegistry();
      reg.register({ id: 'a', name: 'api', host: 'h1', port: 1 });
      reg.register({ id: 'b', name: 'api', host: 'h2', port: 2 });
      const sd = new ServiceDiscovery(reg);
      const i1 = sd.getInstance('api');
      const i2 = sd.getInstance('api');
      assert.notStrictEqual(i1.id, i2.id);
    });

    it('emergency controls kill switch integration', function () {
      const ec = new EmergencyControls();
      ec.activateEmergency('Test');
      assert.strictEqual(ec._killSwitch.isActive('global-emergency'), true);
    });

    it('safe mode blocks non-allowed features', function () {
      const sm = new SafeMode();
      sm.enterSafeMode('Lockdown');
      assert.strictEqual(sm.isFeatureAllowed('write'), false);
    });
  });

  describe('Additional — runtimeManager extra', function () {
    it('start sets _startTime', function () {
      const rm = new RuntimeManager();
      rm.start();
      assert.ok(rm._startTime !== null);
    });

    it('stop clears _startTime', function () {
      const rm = new RuntimeManager();
      rm.start();
      rm.stop();
      assert.strictEqual(rm._startTime, null);
    });

    it('getStatus returns components map', function () {
      const rm = new RuntimeManager();
      const status = rm.getStatus();
      assert.ok(typeof status.components === 'object');
      assert.ok('registry' in status.components);
      assert.ok('storage' in status.components);
    });

    it('getStatus returns activeFlags from storage', function () {
      const rm = new RuntimeManager();
      const status = rm.getStatus();
      assert.deepStrictEqual(status.activeFlags, {});
    });
  });

  describe('Additional — feature flags extra', function () {
    it('FeatureFlagRegistry get returns copy not reference', function () {
      const ffr = new FeatureFlagRegistry();
      ffr.register({ key: 'f1', name: 'test' });
      const flag = ffr.get('f1');
      flag.name = 'modified';
      const flag2 = ffr.get('f1');
      assert.strictEqual(flag2.name, 'test');
    });

    it('FeatureFlagTargeting addTargeting throws for invalid operator', function () {
      const t = new FeatureFlagTargeting();
      assert.throws(function () { t.addTargeting('f1', [{ field: 'x', operator: 'bad', value: 1 }]); }, /Invalid operator/);
    });

    it('FeatureFlagRollouts updateRollout throws for unknown', function () {
      const r = new FeatureFlagRollouts();
      assert.throws(function () { r.updateRollout('unknown', 50); }, /not found/);
    });

    it('FeatureFlagRollouts completeRollout throws for unknown', function () {
      const r = new FeatureFlagRollouts();
      assert.throws(function () { r.completeRollout('unknown'); }, /not found/);
    });

    it('FeatureFlagRollouts stopRollout throws for unknown', function () {
      const r = new FeatureFlagRollouts();
      assert.throws(function () { r.stopRollout('unknown'); }, /not found/);
    });
  });

  describe('Additional — config extra', function () {
    it('ConfigurationRegistry get returns copy', function () {
      const cr = new ConfigurationRegistry();
      cr.register('k', { value: 'v' });
      const c = cr.get('k');
      c.value = 'modified';
      assert.strictEqual(cr.get('k').value, 'v');
    });

    it('ConfigurationRegistry list returns copies', function () {
      const cr = new ConfigurationRegistry();
      cr.register('k', { value: 'v' });
      const list = cr.list();
      list[0].value = 'changed';
      assert.strictEqual(cr.get('k').value, 'v');
    });

    it('ConfigurationSources addSource throws without fetcher', function () {
      const cs = new ConfigurationSources();
      assert.throws(function () { cs.addSource('bad', { priority: 1 }); }, /fetcher/);
    });

    it('ConfigurationSources removeSource returns false for unknown', function () {
      const cs = new ConfigurationSources();
      assert.strictEqual(cs.removeSource('unknown'), false);
    });
  });

  describe('Additional — services extra', function () {
    it('ServiceRegistry findByName returns empty for non-existent', function () {
      const sr = new ServiceRegistry();
      assert.deepStrictEqual(sr.findByName('unknown'), []);
    });

    it('ServiceRegistry findByTag returns empty for non-existent', function () {
      const sr = new ServiceRegistry();
      assert.deepStrictEqual(sr.findByTag('unknown'), []);
    });

    it('ServiceResolver resolveUrl returns null for unknown', function () {
      const reg = new ServiceRegistry();
      const resolver = new ServiceResolver(reg);
      assert.strictEqual(resolver.resolveUrl('unknown'), null);
    });

    it('ServiceDiscovery constructor throws without registry', function () {
      assert.throws(function () { new ServiceDiscovery(null); }, /required/);
    });

    it('ServiceResolver constructor throws without registry', function () {
      assert.throws(function () { new ServiceResolver(null); }, /required/);
    });
  });

  describe('Additional — coordination extra', function () {
    it('DistributedLocks acquire returns null for missing args', function () {
      const dl = new DistributedLocks();
      assert.strictEqual(dl.acquire(null, 'h', 1000), null);
      assert.strictEqual(dl.acquire('n', null, 1000), null);
    });

    it('DistributedLocks release returns false for missing args', function () {
      const dl = new DistributedLocks();
      assert.strictEqual(dl.release(null, 'h'), false);
    });

    it('LeaseManager acquireLease returns null for bad args', function () {
      const lm = new LeaseManager();
      assert.strictEqual(lm.acquireLease(null, 'h', 1000), null);
      assert.strictEqual(lm.acquireLease('n', null, 1000), null);
    });

    it('LeaseManager renewLease returns false for expired', function () {
      const lm = new LeaseManager();
      lm.acquireLease('l', 'h', -1);
      assert.strictEqual(lm.renewLease('l', 'h', 1000), false);
    });

    it('LeaderRuntime stepDown returns false for unknown', function () {
      const lr = new LeaderRuntime();
      assert.strictEqual(lr.stepDown('unknown'), false);
    });

    it('CoordinationEngine executeWithLock returns null for bad args', function () {
      const ce = new CoordinationEngine();
      assert.strictEqual(ce.executeWithLock(null, 'h', function () {}), null);
    });
  });

  describe('Additional — policies/constraints/approvals extra', function () {
    it('RuntimePolicies definePolicy returns false for bad args', function () {
      const rp = new RuntimePolicies();
      assert.strictEqual(rp.definePolicy(null, {}), false);
      assert.strictEqual(rp.definePolicy('p', null), false);
    });

    it('RuntimeConstraints addConstraint returns false for bad args', function () {
      const rc = new RuntimeConstraints();
      assert.strictEqual(rc.addConstraint(null, {}), false);
      assert.strictEqual(rc.addConstraint('c', null), false);
    });

    it('RuntimeConstraints removeConstraint returns false for unknown', function () {
      const rc = new RuntimeConstraints();
      assert.strictEqual(rc.removeConstraint('unknown'), false);
    });

    it('RuntimeApprovals reject returns false for unknown', function () {
      const ra = new RuntimeApprovals();
      assert.strictEqual(ra.reject('unknown', 'admin'), false);
    });

    it('RuntimeApprovals approve returns false for unknown', function () {
      const ra = new RuntimeApprovals();
      assert.strictEqual(ra.approve('unknown', 'admin'), false);
    });
  });

  describe('Additional — rollout extra', function () {
    it('RolloutManager startRollout returns false for unknown', function () {
      const rm = new RolloutManager();
      assert.strictEqual(rm.startRollout('unknown'), false);
    });

    it('RolloutManager pauseRollout returns false for unknown', function () {
      const rm = new RolloutManager();
      assert.strictEqual(rm.pauseRollout('unknown'), false);
    });

    it('RolloutManager resumeRollout returns false for unknown', function () {
      const rm = new RolloutManager();
      assert.strictEqual(rm.resumeRollout('unknown'), false);
    });

    it('RolloutManager completeRollout returns false for unknown', function () {
      const rm = new RolloutManager();
      assert.strictEqual(rm.completeRollout('unknown'), false);
    });

    it('RolloutManager cancelRollout returns false for unknown', function () {
      const rm = new RolloutManager();
      assert.strictEqual(rm.cancelRollout('unknown'), false);
    });

    it('CanaryRollout startCanary returns null for missing args', function () {
      const cr = new CanaryRollout();
      assert.strictEqual(cr.startCanary(null), null);
    });

    it('CanaryRollout promoteCanary returns false for unknown', function () {
      const cr = new CanaryRollout();
      assert.strictEqual(cr.promoteCanary('unknown'), false);
    });

    it('ProgressiveRollout advancePhase returns false for unknown', function () {
      const pr = new ProgressiveRollout();
      assert.strictEqual(pr.advancePhase('unknown'), false);
    });

    it('BlueGreenRollout switchToGreen returns false for unknown', function () {
      const bg = new BlueGreenRollout();
      assert.strictEqual(bg.switchToGreen('unknown'), false);
    });
  });

  describe('Additional — emergency/safe extra', function () {
    it('KillSwitchManager activate returns null for missing key', function () {
      const ks = new KillSwitchManager();
      assert.strictEqual(ks.activate(null, 'r'), null);
    });

    it('KillSwitchManager deactivate returns false for unknown', function () {
      const ks = new KillSwitchManager();
      assert.strictEqual(ks.deactivate('unknown'), false);
    });

    it('KillSwitchManager getSwitch returns null for unknown', function () {
      const ks = new KillSwitchManager();
      assert.strictEqual(ks.getSwitch('unknown'), null);
    });

    it('EmergencyControls activateEmergency returns false for missing reason', function () {
      const ec = new EmergencyControls();
      assert.strictEqual(ec.activateEmergency(null), false);
    });

    it('EmergencyControls executeAction returns false for invalid action', function () {
      const ec = new EmergencyControls();
      ec.activateEmergency('R');
      assert.strictEqual(ec.executeAction('invalid', 't'), false);
    });

    it('SafeMode enterSafeMode returns false for missing reason', function () {
      const sm = new SafeMode();
      assert.strictEqual(sm.enterSafeMode(null), false);
    });

    it('SafeMode addSafeFeature returns false for missing feature', function () {
      const sm = new SafeMode();
      assert.strictEqual(sm.addSafeFeature(null), false);
    });
  });

  describe('Additional — secrets extra', function () {
    it('SecretRotation scheduleRotation throws for bad interval', function () {
      const sr = new SecretRotation();
      assert.throws(function () { sr.scheduleRotation('k', -1); }, /positive/);
    });

    it('SecretVersioning createVersion throws for missing args', function () {
      const sv = new SecretVersioning();
      assert.throws(function () { sv.createVersion(null, 'v'); }, /required/);
    });

    it('SecretAudit recordAccess throws for invalid action', function () {
      const sa = new SecretAudit();
      assert.throws(function () { sa.recordAccess('k', 'bad', 'admin'); }, /action/);
    });

    it('SecretManager getSecret throws for missing key', function () {
      const sm = new SecretManager();
      assert.throws(function () { sm.getSecret(null); }, /required/);
    });
  });

  describe('Additional — runtimeHistory/reporter extra', function () {
    it('RuntimeHistory query with since and limit combined', function () {
      const h = new RuntimeHistory();
      h.record({ type: 'a', source: 's', action: 'c' });
      h.record({ type: 'a', source: 's', action: 'u' });
      h.record({ type: 'b', source: 's', action: 'c' });
      const results = h.query({ type: 'a', limit: 1 });
      assert.strictEqual(results.length, 1);
    });

    it('RuntimeReporter generateReport with empty data', function () {
      const r = new RuntimeReporter();
      const report = r.generateReport({});
      assert.strictEqual(report.sections.length, 0);
    });
  });

  describe('Additional — runtimeIntegration extra', function () {
    it('RuntimeIntegration disable returns null from integrates', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      ri.disable();
      assert.strictEqual(ri.integrateAI({}), null);
    });

    it('RuntimeIntegration getLog with limit param', function () {
      const rm = new RuntimeManager();
      const ri = new RuntimeIntegration(rm);
      ri.integrateAI({ a: 1 });
      ri.integrateAI({ a: 2 });
      ri.integrateAI({ a: 3 });
      const log = ri.getLog({ limit: 2 });
      assert.strictEqual(log.length, 2);
    });
  });

  describe('Additional — runtimeManager operations', function () {
    it('start emits RUNTIME_STARTED once', function () {
      const rm = new RuntimeManager();
      let count = 0;
      rm.events.on(rm.events.constructor.EVENTS.RUNTIME_STARTED, function () { count++; });
      rm.start();
      assert.strictEqual(count, 1);
    });

    it('stop emits RUNTIME_STOPPED', function () {
      const rm = new RuntimeManager();
      let emitted = false;
      rm.events.on(rm.events.constructor.EVENTS.RUNTIME_STOPPED, function () { emitted = true; });
      rm.start();
      rm.stop();
      assert.ok(emitted);
    });

    it('registry sub-component works after clear', function () {
      const rm = new RuntimeManager();
      rm.registry.register('x', {});
      rm.clear();
      rm.registry.register('y', {});
      assert.strictEqual(rm.registry.count(), 1);
    });
  });

  describe('Additional — storage edge cases', function () {
    it('getAll returns empty for empty storage', function () {
      const s = new RuntimeStorage();
      assert.deepStrictEqual(s.getAll(), {});
    });

    it('delete on already deleted key returns false', function () {
      const s = new RuntimeStorage();
      s.set('k', 'v');
      s.delete('k');
      assert.strictEqual(s.delete('k'), false);
    });
  });

  describe('Additional — runtimeEvents edge cases', function () {
    it('on returns false for non-function handler', function () {
      const ev = new RuntimeEvents();
      assert.strictEqual(ev.on('e', null), false);
    });

    it('off on non-existent handler returns false', function () {
      const ev = new RuntimeEvents();
      ev.on('e', function () {});
      assert.strictEqual(ev.off('e', function () {}), false);
    });

    it('emit returns false for event with no listeners', function () {
      const ev = new RuntimeEvents();
      assert.strictEqual(ev.emit('no-listeners'), false);
    });
  });

  describe('Additional — runtimeMetrics edge cases', function () {
    it('query non-existent returns empty', function () {
      const m = new RuntimeMetrics();
      assert.deepStrictEqual(m.query('nonexistent'), []);
    });

    it('aggregate returns null for non-existent metric', function () {
      const m = new RuntimeMetrics();
      assert.strictEqual(m.aggregate('nonexistent', 'count'), null);
    });
  });

  describe('Additional — runtimeScheduler edge cases', function () {
    it('schedule with 0 interval returns null', function () {
      const s = new RuntimeScheduler();
      assert.strictEqual(s.schedule('t', function () {}, 0), null);
    });

    it('tick on empty scheduler returns empty', function () {
      const s = new RuntimeScheduler();
      assert.deepStrictEqual(s.tick(), []);
    });
  });

  describe('Additional — serviceHealth edge cases', function () {
    it('check handles service with no id', function () {
      const sh = new ServiceHealth();
      const result = sh.check({});
      assert.strictEqual(result.status, 'down');
    });

    it('checkAll with empty array returns empty', function () {
      const sh = new ServiceHealth();
      assert.deepStrictEqual(sh.checkAll([]), []);
    });
  });

  describe('Additional — final edge tests', function () {
    it('runtimeHistory record with details', function () {
      const h = new RuntimeHistory();
      const entry = h.record({ type: 't', source: 's', action: 'a', details: { key: 'val' } });
      assert.deepStrictEqual(entry.details, { key: 'val' });
    });

    it('runtimeMetrics record with tags', function () {
      const m = new RuntimeMetrics();
      m.record('r', 42, { env: 'test' });
      const entries = m.query('r');
      assert.deepStrictEqual(entries[0].tags, { env: 'test' });
    });

    it('featureFlagManager evaluate with rollout', function () {
      const fm = new FeatureFlagManager();
      fm.createFlag({ key: 'f1', enabled: true });
      fm.startRollout('f1', 100);
      const result = fm.evaluate('f1', { userId: 'u1' });
      assert.strictEqual(result.key, 'f1');
    });

    it('runtimeManager options in constructor', function () {
      const rm = new RuntimeManager({ debug: true });
      assert.ok(rm);
      assert.strictEqual(rm._options.debug, true);
    });
  });



});
