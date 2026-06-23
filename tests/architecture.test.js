const assert = require('assert');

describe('AI Architecture Platform — Phase 10.2.0', function() {

  /* ─── ArchitectureManager (8 tests) ─── */
  describe('ArchitectureManager', function() {
    const { ArchitectureManager } = require('../lib/architecture/architectureManager');

    it('should create with all sub-modules', function() {
      const m = new ArchitectureManager();
      assert.ok(m.architecturePlanner); assert.ok(m.architectureValidator); assert.ok(m.architectureStorage);
      assert.ok(m.architectureEvents); assert.ok(m.architectureMetrics); assert.ok(m.architectureReporter);
      assert.ok(m.solutionArchitect); assert.ok(m.patternRegistry); assert.ok(m.decisionManager);
      assert.ok(m.qualityAttributeAnalyzer); assert.ok(m.riskAnalyzer); assert.ok(m.tradeoffAnalyzer);
      assert.ok(m.constraintAnalyzer); assert.ok(m.requirementsAnalyzer); assert.ok(m.architectureIntegration);
    });

    it('getStatus returns initialized true', function() {
      const m = new ArchitectureManager(); const s = m.getStatus();
      assert.strictEqual(s.initialized, true); assert.ok(s.initializedAt);
    });

    it('getStatus includes 16 submodules', function() {
      const m = new ArchitectureManager(); const s = m.getStatus();
      assert.strictEqual(Object.keys(s.submodules).length, 16);
      assert.ok(Object.values(s.submodules).every(v => v === true));
    });

    it('clear does not throw', function() {
      const m = new ArchitectureManager(); m.clear(); assert.ok(true);
    });

    it('reusable after clear', function() {
      const m = new ArchitectureManager(); m.clear();
      m.solutionArchitect.design({ name: 'test' });
      assert.strictEqual(m.solutionArchitect.listDesigns().length, 1);
    });

    it('architectureIntegration references manager', function() {
      const m = new ArchitectureManager();
      assert.strictEqual(m.architectureIntegration.manager, m);
    });

    it('independent instances', function() {
      const a = new ArchitectureManager(); const b = new ArchitectureManager();
      a.solutionArchitect.design({ name: 'a' });
      assert.strictEqual(a.solutionArchitect.listDesigns().length, 1);
      assert.strictEqual(b.solutionArchitect.listDesigns().length, 0);
    });

    it('getStatus initializedAt is ISO string', function() {
      const m = new ArchitectureManager();
      assert.strictEqual(typeof m.getStatus().initializedAt, 'string');
      assert.ok(m.getStatus().initializedAt.includes('T'));
    });

  });

  /* ─── SolutionArchitect (10 tests) ─── */
  describe('SolutionArchitect', function() {
    const { SolutionArchitect } = require('../lib/architecture/solutionArchitect');

    it('empty state', function() {
      const sa = new SolutionArchitect(); assert.strictEqual(sa.listDesigns().length, 0);
    });

    it('design creates entry with stages', function() {
      const sa = new SolutionArchitect(); const r = sa.design({ name: 't' }); assert.ok(r.id); assert.ok(Array.isArray(r.stages)); assert.strictEqual(r.status, 'designed');
    });

    it('design throws if no definition', function() {
      const sa = new SolutionArchitect(); assert.throws(() => sa.design(null), /definition is required/);
    });

    it('design uses options', function() {
      const sa = new SolutionArchitect(); const r = sa.design({ name: 't' }, { mode: 'fast' }); assert.strictEqual(r.options.mode, 'fast');
    });

    it('getDesign returns by id', function() {
      const sa = new SolutionArchitect(); const r = sa.design({}); assert.strictEqual(sa.getDesign(r.id).id, r.id);
    });

    it('getDesign returns null for null id', function() {
      const sa = new SolutionArchitect(); assert.strictEqual(sa.getDesign(null), null);
    });

    it('getDesign returns null for missing', function() {
      const sa = new SolutionArchitect(); assert.strictEqual(sa.getDesign('none'), null);
    });

    it('listDesigns returns all', function() {
      const sa = new SolutionArchitect(); sa.design({}); sa.design({}); assert.strictEqual(sa.listDesigns().length, 2);
    });

    it('clear resets', function() {
      const sa = new SolutionArchitect(); sa.design({}); sa.clear(); assert.strictEqual(sa.listDesigns().length, 0);
    });

    it('reuse after clear', function() {
      const sa = new SolutionArchitect(); sa.design({}); sa.clear(); const r = sa.design({}); assert.ok(r.id); assert.strictEqual(sa.listDesigns().length, 1);
    });

  });

  /* ─── ArchitecturePlanner (10 tests) ─── */
  describe('ArchitecturePlanner', function() {
    const { ArchitecturePlanner } = require('../lib/architecture/architecturePlanner');

    it('empty state', function() {
      const ap = new ArchitecturePlanner(); assert.strictEqual(ap.listPlans().length, 0);
    });

    it('createPlan with solutionId', function() {
      const ap = new ArchitecturePlanner(); const r = ap.createPlan('s1', { n: 'v' }); assert.strictEqual(r.id, 's1'); assert.strictEqual(r.status, 'planned');
    });

    it('createPlan throws if no solutionId', function() {
      const ap = new ArchitecturePlanner(); assert.throws(() => ap.createPlan(null, {}), /solutionId and blueprint are required/);
    });

    it('createPlan throws if no blueprint', function() {
      const ap = new ArchitecturePlanner(); assert.throws(() => ap.createPlan('s', null), /solutionId and blueprint are required/);
    });

    it('createPlan has 5 stages', function() {
      const ap = new ArchitecturePlanner(); const r = ap.createPlan('s', {}); assert.strictEqual(r.stages.length, 5);
    });

    it('getPlan returns by id', function() {
      const ap = new ArchitecturePlanner(); ap.createPlan('s', {}); assert.strictEqual(ap.getPlan('s').id, 's');
    });

    it('getPlan returns null for null id', function() {
      const ap = new ArchitecturePlanner(); assert.strictEqual(ap.getPlan(null), null);
    });

    it('getPlan returns null for missing', function() {
      const ap = new ArchitecturePlanner(); assert.strictEqual(ap.getPlan('none'), null);
    });

    it('listPlans returns all', function() {
      const ap = new ArchitecturePlanner(); ap.createPlan('a', {}); ap.createPlan('b', {}); assert.strictEqual(ap.listPlans().length, 2);
    });

    it('clear resets', function() {
      const ap = new ArchitecturePlanner(); ap.createPlan('a', {}); ap.clear(); assert.strictEqual(ap.listPlans().length, 0);
    });

  });

  /* ─── ArchitectureValidator (10 tests) ─── */
  describe('ArchitectureValidator', function() {
    const { ArchitectureValidator } = require('../lib/architecture/architectureValidator');

    it('validate(null) returns invalid', function() {
      const av = new ArchitectureValidator(); const r = av.validate(null); assert.strictEqual(r.valid, false); assert.ok(r.errors.length > 0);
    });

    it('validate missing fields', function() {
      const av = new ArchitectureValidator(); const r = av.validate({}); assert.strictEqual(r.valid, false);
    });

    it('validate valid architecture', function() {
      const av = new ArchitectureValidator(); const r = av.validate({ id: 'a', name: 'n', version: '1', patterns: ['p'], components: ['c'] }); assert.strictEqual(r.valid, true);
    });

    it('validateBlueprint(null)', function() {
      const av = new ArchitectureValidator(); const r = av.validateBlueprint(null); assert.strictEqual(r.valid, false);
    });

    it('validateBlueprint valid', function() {
      const av = new ArchitectureValidator(); const r = av.validateBlueprint({ name: 'n', version: '1', components: [], modules: [] }); assert.strictEqual(r.valid, true);
    });

    it('validateBlueprint checks components array', function() {
      const av = new ArchitectureValidator(); const r = av.validateBlueprint({ name: 'n', version: '1', components: 'bad', modules: [] }); assert.strictEqual(r.valid, false);
    });

    it('validatePattern no patterns', function() {
      const av = new ArchitectureValidator(); const r = av.validatePattern({}, []); assert.strictEqual(r.valid, false);
    });

    it('validatePattern valid', function() {
      const av = new ArchitectureValidator(); const r = av.validatePattern({ patterns: ['Layered'] }, [{ name: 'Layered' }]); assert.strictEqual(r.valid, true);
    });

    it('validatePattern unavailable pattern', function() {
      const av = new ArchitectureValidator(); const r = av.validatePattern({ patterns: ['Unknown'] }, [{ name: 'Layered' }]); assert.strictEqual(r.valid, false);
    });

    it('clear does not throw', function() {
      const av = new ArchitectureValidator(); av.clear(); assert.ok(true);
    });

  });

  /* ─── ArchitectureStorage (12 tests) ─── */
  describe('ArchitectureStorage', function() {
    const { ArchitectureStorage } = require('../lib/architecture/architectureStorage');

    it('set/get roundtrip', function() {
      const s = new ArchitectureStorage(); s.set('k', 'v'); assert.strictEqual(s.get('k'), 'v');
    });

    it('get returns null for missing', function() {
      const s = new ArchitectureStorage(); assert.strictEqual(s.get('none'), null);
    });

    it('get returns null for null key', function() {
      const s = new ArchitectureStorage(); assert.strictEqual(s.get(null), null);
    });

    it('delete removes key', function() {
      const s = new ArchitectureStorage(); s.set('k', 'v'); s.delete('k'); assert.strictEqual(s.get('k'), null);
    });

    it('delete returns false for null key', function() {
      const s = new ArchitectureStorage(); assert.strictEqual(s.delete(null), false);
    });

    it('has returns correct boolean', function() {
      const s = new ArchitectureStorage(); s.set('k', 'v'); assert.ok(s.has('k')); assert.ok(!s.has('none'));
    });

    it('has returns false for null key', function() {
      const s = new ArchitectureStorage(); assert.strictEqual(s.has(null), false);
    });

    it('getAll returns object', function() {
      const s = new ArchitectureStorage(); s.set('a', 1); const all = s.getAll(); assert.strictEqual(all.a, 1);
    });

    it('set returns this', function() {
      const s = new ArchitectureStorage(); assert.strictEqual(s.set('k', 'v'), s);
    });

    it('set with number key', function() {
      const s = new ArchitectureStorage(); s.set(42, 'v'); assert.strictEqual(s.get('42'), 'v');
    });

    it('clear removes all', function() {
      const s = new ArchitectureStorage(); s.set('a', 1); s.clear(); assert.strictEqual(s.get('a'), null);
    });

    it('multiple keys', function() {
      const s = new ArchitectureStorage(); s.set('a', 1); s.set('b', 2); assert.strictEqual(s.get('a'), 1); assert.strictEqual(s.get('b'), 2);
    });

  });

  /* ─── ArchitectureEvents (16 tests) ─── */
  describe('ArchitectureEvents', function() {
    const { ArchitectureEvents } = require('../lib/architecture/architectureEvents');

    it('empty listeners', function() {
      const e = new ArchitectureEvents(); assert.strictEqual(e.listEvents().length, 0);
    });

    it('EVENTS has 13 constants', function() {
      assert.strictEqual(Object.keys(ArchitectureEvents.EVENTS).length, 13);
    });

    it('on registers listener returns this', function() {
      const e = new ArchitectureEvents(); const ret = e.on('evt', () => {}); assert.strictEqual(ret, e);
    });

    it('emit triggers listener', function() {
      const e = new ArchitectureEvents(); let called = false; e.on('evt', () => { called = true; }); e.emit('evt'); assert.ok(called);
    });

    it('emit returns true when listeners exist', function() {
      const e = new ArchitectureEvents(); e.on('evt', () => {}); assert.ok(e.emit('evt'));
    });

    it('emit returns false for unknown', function() {
      const e = new ArchitectureEvents(); assert.strictEqual(e.emit('unknown'), false);
    });

    it('emit passes arguments', function() {
      const e = new ArchitectureEvents(); let args; e.on('evt', (...a) => { args = a; }); e.emit('evt', 1, 2, 3); assert.deepStrictEqual(args, [1, 2, 3]);
    });

    it('emit throws if event is null', function() {
      const e = new ArchitectureEvents(); assert.throws(() => e.emit(null), /event must be a non-empty string/);
    });

    it('on throws if event is empty', function() {
      const e = new ArchitectureEvents(); assert.throws(() => e.on('', () => {}), /event must be a non-empty string/);
    });

    it('on throws if listener not function', function() {
      const e = new ArchitectureEvents(); assert.throws(() => e.on('evt', 'str'), /listener must be a function/);
    });

    it('off removes listener', function() {
      const e = new ArchitectureEvents(); const fn = () => {}; e.on('evt', fn); e.off('evt', fn); assert.strictEqual(e.emit('evt'), false);
    });

    it('off on missing event does nothing', function() {
      const e = new ArchitectureEvents(); e.off('evt', () => {}); assert.ok(true);
    });

    it('listEvents returns registered', function() {
      const e = new ArchitectureEvents(); e.on('a', () => {}); e.on('b', () => {}); assert.strictEqual(e.listEvents().length, 2);
    });

    it('clear removes all', function() {
      const e = new ArchitectureEvents(); e.on('a', () => {}); e.clear(); assert.strictEqual(e.listEvents().length, 0);
    });

    it('emit continues if listener throws', function() {
      const e = new ArchitectureEvents(); let called = false; e.on('evt', () => { throw new Error('oops'); }); e.on('evt', () => { called = true; }); e.emit('evt'); assert.ok(called);
    });

    it('emit multiple args', function() {
      const e = new ArchitectureEvents(); let sum = 0; e.on('add', (a, b) => { sum = a + b; }); e.emit('add', 3, 4); assert.strictEqual(sum, 7);
    });

  });

  /* ─── ArchitectureMetrics (13 tests) ─── */
  describe('ArchitectureMetrics', function() {
    const { ArchitectureMetrics } = require('../lib/architecture/architectureMetrics');

    it('record creates entry', function() {
      const m = new ArchitectureMetrics(); const e = m.record('cpu', 50); assert.strictEqual(e.name, 'cpu'); assert.strictEqual(e.value, 50);
    });

    it('record throws for null name', function() {
      const m = new ArchitectureMetrics(); assert.throws(() => m.record(null, 1));
    });

    it('record throws for null value', function() {
      const m = new ArchitectureMetrics(); assert.throws(() => m.record('cpu', null));
    });

    it('record handles tags', function() {
      const m = new ArchitectureMetrics(); const e = m.record('cpu', 50, { host: 'a' }); assert.strictEqual(e.tags.host, 'a');
    });

    it('query filters by name', function() {
      const m = new ArchitectureMetrics(); m.record('cpu', 1); m.record('mem', 2); assert.strictEqual(m.query('cpu').length, 1);
    });

    it('query returns empty for unknown', function() {
      const m = new ArchitectureMetrics(); assert.strictEqual(m.query('unknown').length, 0);
    });

    it('aggregate count', function() {
      const m = new ArchitectureMetrics(); m.record('cpu', 10); m.record('cpu', 20); assert.strictEqual(m.aggregate('cpu', 'count'), 2);
    });

    it('aggregate avg', function() {
      const m = new ArchitectureMetrics(); m.record('cpu', 10); m.record('cpu', 20); assert.strictEqual(m.aggregate('cpu', 'avg'), 15);
    });

    it('aggregate min/max/sum', function() {
      const m = new ArchitectureMetrics(); m.record('cpu', 10); m.record('cpu', 20); assert.strictEqual(m.aggregate('cpu', 'min'), 10); assert.strictEqual(m.aggregate('cpu', 'max'), 20); assert.strictEqual(m.aggregate('cpu', 'sum'), 30);
    });

    it('aggregate custom fn', function() {
      const m = new ArchitectureMetrics(); m.record('cpu', 10); m.record('cpu', 20); const r = m.aggregate('cpu', vals => vals.reduce((a,b)=>a+b, 0)); assert.strictEqual(r, 30);
    });

    it('aggregate returns null for unknown', function() {
      const m = new ArchitectureMetrics(); assert.strictEqual(m.aggregate('none', 'count'), null);
    });

    it('getMetricNames unique', function() {
      const m = new ArchitectureMetrics(); m.record('cpu', 1); m.record('cpu', 2); m.record('mem', 3); assert.strictEqual(m.getMetricNames().length, 2);
    });

    it('clear resets', function() {
      const m = new ArchitectureMetrics(); m.record('cpu', 1); m.clear(); assert.strictEqual(m.query('cpu').length, 0);
    });

  });

  /* ─── ArchitectureReporter (9 tests) ─── */
  describe('ArchitectureReporter', function() {
    const { ArchitectureReporter } = require('../lib/architecture/architectureReporter');

    it('generateReport creates report', function() {
      const r = new ArchitectureReporter(); const rep = r.generateReport('a1'); assert.strictEqual(rep.architectureId, 'a1');
    });

    it('generateReport throws if no architectureId', function() {
      const r = new ArchitectureReporter(); assert.throws(() => r.generateReport(null), /architectureId is required/);
    });

    it('generateReport computes duration', function() {
      const r = new ArchitectureReporter(); const rep = r.generateReport('a', { startedAt: new Date(Date.now() - 1000).toISOString(), completedAt: new Date().toISOString() }); assert.ok(rep.duration > 0);
    });

    it('generateReport handles missing execution', function() {
      const r = new ArchitectureReporter(); const rep = r.generateReport('a'); assert.strictEqual(rep.status, 'unknown');
    });

    it('generateReport counts stages', function() {
      const r = new ArchitectureReporter(); const rep = r.generateReport('a', { stages: [{ status: 'completed' }, { status: 'completed' }, { status: 'pending' }] }); assert.strictEqual(rep.summary.completedStages, 2); assert.strictEqual(rep.summary.failedStages, 0);
    });

    it('generateSummary empty', function() {
      const r = new ArchitectureReporter(); const s = r.generateSummary([]); assert.strictEqual(s.total, 0); assert.strictEqual(s.completed, 0);
    });

    it('generateSummary aggregates', function() {
      const r = new ArchitectureReporter(); const s = r.generateSummary([{ status: 'completed', duration: 100 }, { status: 'failed', duration: 50 }]); assert.strictEqual(s.total, 2); assert.strictEqual(s.completed, 1); assert.strictEqual(s.failed, 1); assert.strictEqual(s.totalDuration, 150);
    });

    it('clear resets', function() {
      const r = new ArchitectureReporter(); r.generateReport('a'); r.clear(); assert.ok(true);
    });

    it('reuse after clear', function() {
      const r = new ArchitectureReporter(); r.generateReport('a'); r.clear(); const rep = r.generateReport('b'); assert.strictEqual(rep.architectureId, 'b');
    });

  });

  /* ─── ArchitectureIntegration (5 tests) ─── */
  describe('ArchitectureIntegration', function() {
    const { ArchitectureIntegration } = require('../lib/architecture/architectureIntegration');

    it('constructor takes manager', function() {
      const m = {}; const ai = new ArchitectureIntegration(m); assert.strictEqual(ai.manager, m);
    });

    it('clear returns undefined', function() {
      const ai = new ArchitectureIntegration({}); assert.strictEqual(ai.clear(), undefined);
    });

    it('clear does not throw', function() {
      const ai = new ArchitectureIntegration({}); ai.clear(); assert.ok(true);
    });

    it('manager getter is read-only', function() {
      const ai = new ArchitectureIntegration({}); const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ai), 'manager'); assert.strictEqual(typeof desc.get, 'function'); assert.strictEqual(typeof desc.set, 'undefined');
    });

    it('constructor with null manager', function() {
      const ai = new ArchitectureIntegration(null); assert.strictEqual(ai.manager, null);
    });

  });

  /* ─── SolutionDefinition (13 tests) ─── */
  describe('SolutionDefinition', function() {
    const { SolutionDefinition } = require('../lib/architecture/solutionDefinition');

    it('empty state', function() {
      const d = new SolutionDefinition(); assert.strictEqual(d.list().length, 0);
    });

    it('create stores all fields', function() {
      const d = new SolutionDefinition(); const r = d.create('id1', 'Name', '2.0', 'Desc', 'Dom'); assert.strictEqual(r.id, 'id1'); assert.strictEqual(r.name, 'Name'); assert.strictEqual(r.version, '2.0'); assert.strictEqual(r.description, 'Desc'); assert.strictEqual(r.domain, 'Dom');
    });

    it('create throws if no id', function() {
      const d = new SolutionDefinition(); assert.throws(() => d.create(null, 'n'), /id and name are required/);
    });

    it('create throws if no name', function() {
      const d = new SolutionDefinition(); assert.throws(() => d.create('id', null), /id and name are required/);
    });

    it('create defaults', function() {
      const d = new SolutionDefinition(); const r = d.create('id', 'n'); assert.strictEqual(r.version, '1.0.0'); assert.strictEqual(r.description, ''); assert.strictEqual(r.domain, ''); assert.strictEqual(r.status, 'draft');
    });

    it('get returns by id', function() {
      const d = new SolutionDefinition(); d.create('id', 'n'); assert.strictEqual(d.get('id').id, 'id');
    });

    it('get returns null for missing', function() {
      const d = new SolutionDefinition(); assert.strictEqual(d.get('none'), null);
    });

    it('update changes allowed fields', function() {
      const d = new SolutionDefinition(); d.create('id', 'n'); const u = d.update('id', { name: 'new', version: '2.0' }); assert.strictEqual(u.name, 'new'); assert.strictEqual(u.version, '2.0');
    });

    it('update ignores disallowed', function() {
      const d = new SolutionDefinition(); d.create('id', 'n'); const u = d.update('id', { invalid: 'x' }); assert.strictEqual(u.invalid, undefined);
    });

    it('update returns null for missing', function() {
      const d = new SolutionDefinition(); assert.strictEqual(d.update('none', { name: 'x' }), null);
    });

    it('update throws for null args', function() {
      const d = new SolutionDefinition(); d.create('id', 'n'); assert.throws(() => d.update(null, {})); assert.throws(() => d.update('id', null));
    });

    it('list returns all', function() {
      const d = new SolutionDefinition(); d.create('a', 'A'); d.create('b', 'B'); assert.strictEqual(d.list().length, 2);
    });

    it('clear resets', function() {
      const d = new SolutionDefinition(); d.create('a', 'A'); d.clear(); assert.strictEqual(d.list().length, 0);
    });

  });

  /* ─── SolutionBlueprint (12 tests) ─── */
  describe('SolutionBlueprint', function() {
    const { SolutionBlueprint } = require('../lib/architecture/solutionBlueprint');

    it('generate creates blueprint', function() {
      const sb = new SolutionBlueprint(); const r = sb.generate('s1', [], {}); assert.strictEqual(r.solutionId, 's1');
    });

    it('generate throws if no solutionId', function() {
      const sb = new SolutionBlueprint(); assert.throws(() => sb.generate(null, [], {}), /solutionId is required/);
    });

    it('generate handles missing components', function() {
      const sb = new SolutionBlueprint(); const r = sb.generate('s1'); assert.deepStrictEqual(r.components, []);
    });

    it('generate stores topology', function() {
      const sb = new SolutionBlueprint(); const r = sb.generate('s1', ['web'], { nodes: [] }); assert.ok(r.topology);
    });

    it('get returns by solutionId', function() {
      const sb = new SolutionBlueprint(); sb.generate('s1', [], {}); assert.strictEqual(sb.get('s1').solutionId, 's1');
    });

    it('get returns null for null', function() {
      const sb = new SolutionBlueprint(); assert.strictEqual(sb.get(null), null);
    });

    it('get returns null for missing', function() {
      const sb = new SolutionBlueprint(); assert.strictEqual(sb.get('none'), null);
    });

    it('export returns json format', function() {
      const sb = new SolutionBlueprint(); sb.generate('s1', [], {}); const e = sb.export('s1'); assert.strictEqual(e.format, 'json'); assert.ok(e.data);
    });

    it('export returns yaml format', function() {
      const sb = new SolutionBlueprint(); sb.generate('s1', [], {}); const e = sb.export('s1', 'yaml'); assert.strictEqual(e.format, 'yaml'); assert.strictEqual(typeof e.data, 'string');
    });

    it('export returns null for missing', function() {
      const sb = new SolutionBlueprint(); assert.strictEqual(sb.export('none'), null);
    });

    it('clear resets', function() {
      const sb = new SolutionBlueprint(); sb.generate('s1', [], {}); sb.clear(); assert.strictEqual(sb.get('s1'), null);
    });

    it('generate includes default fields', function() {
      const sb = new SolutionBlueprint(); const r = sb.generate('s1', [], {}); assert.deepStrictEqual(r.patterns, []); assert.deepStrictEqual(r.decisions, []); assert.deepStrictEqual(r.estimatedCost, {});
    });

  });

  /* ─── SystemTopology (21 tests) ─── */
  describe('SystemTopology', function() {
    const { SystemTopology } = require('../lib/architecture/systemTopology');

    it('build creates topology', function() {
      const t = new SystemTopology(); const r = t.build('s1', [{ id: 'n1' }], [{ source: 'a', target: 'b' }]); assert.strictEqual(r.solutionId, 's1'); assert.strictEqual(r.nodes.length, 1);
    });

    it('build throws if no solutionId', function() {
      const t = new SystemTopology(); assert.throws(() => t.build(null, [], []), /solutionId is required/);
    });

    it('build assigns node defaults', function() {
      const t = new SystemTopology(); const r = t.build('s1', [{}]); assert.strictEqual(r.nodes[0].type, 'unknown'); assert.strictEqual(r.nodes[0].layer, 'default');
    });

    it('build assigns edge defaults', function() {
      const t = new SystemTopology(); const r = t.build('s1', [], [{}]); assert.strictEqual(r.edges[0].type, 'dependency');
    });

    it('get returns topology', function() {
      const t = new SystemTopology(); t.build('s1', [], []); assert.strictEqual(t.get('s1').solutionId, 's1');
    });

    it('get returns null for null id', function() {
      const t = new SystemTopology(); assert.strictEqual(t.get(null), null);
    });

    it('get returns null for missing', function() {
      const t = new SystemTopology(); assert.strictEqual(t.get('none'), null);
    });

    it('addNode adds entry', function() {
      const t = new SystemTopology(); const n = t.addNode('s1', { type: 'svc' }); assert.ok(n.id); assert.strictEqual(n.type, 'svc');
    });

    it('addNode creates topology if missing', function() {
      const t = new SystemTopology(); t.addNode('new', {}); assert.ok(t.get('new'));
    });

    it('addNode uses provided id', function() {
      const t = new SystemTopology(); const n = t.addNode('s1', { id: 'myid' }); assert.strictEqual(n.id, 'myid');
    });

    it('addNode throws if no args', function() {
      const t = new SystemTopology(); assert.throws(() => t.addNode(null, null));
    });

    it('addEdge adds entry', function() {
      const t = new SystemTopology(); const e = t.addEdge('s1', { source: 'a', target: 'b' }); assert.strictEqual(e.source, 'a'); assert.strictEqual(e.target, 'b');
    });

    it('addEdge creates topology if missing', function() {
      const t = new SystemTopology(); t.addEdge('new', { source: 'a', target: 'b' }); assert.ok(t.get('new'));
    });

    it('addEdge throws if no args', function() {
      const t = new SystemTopology(); assert.throws(() => t.addEdge(null, null));
    });

    it('removeNode removes node', function() {
      const t = new SystemTopology(); t.addNode('s1', { id: 'n1' }); assert.ok(t.removeNode('s1', 'n1')); assert.strictEqual(t.listNodes('s1').length, 0);
    });

    it('removeNode returns false for missing', function() {
      const t = new SystemTopology(); assert.strictEqual(t.removeNode('none', 'n1'), false);
    });

    it('listNodes returns array', function() {
      const t = new SystemTopology(); t.addNode('s1', {}); assert.strictEqual(t.listNodes('s1').length, 1);
    });

    it('listEdges returns array', function() {
      const t = new SystemTopology(); t.addEdge('s1', { source: 'a', target: 'b' }); assert.strictEqual(t.listEdges('s1').length, 1);
    });

    it('getLayered groups by layer', function() {
      const t = new SystemTopology(); t.addNode('s1', { id: 'n1', layer: 'web' }); t.addNode('s1', { id: 'n2', layer: 'data' }); const l = t.getLayered('s1'); assert.strictEqual(l.web.length, 1); assert.strictEqual(l.data.length, 1);
    });

    it('getLayered returns {} for missing', function() {
      const t = new SystemTopology(); assert.deepStrictEqual(t.getLayered('none'), {});
    });

    it('clear resets', function() {
      const t = new SystemTopology(); t.build('s1', [], []); t.clear(); assert.strictEqual(t.get('s1'), null);
    });

  });

  /* ─── BoundedContexts (10 tests) ─── */
  describe('BoundedContexts', function() {
    const { BoundedContexts } = require('../lib/architecture/boundedContexts');

    it('define creates context', function() {
      const bc = new BoundedContexts(); const r = bc.define('s1', { id: 'c1', name: 'Core' }); assert.strictEqual(r.id, 'c1'); assert.strictEqual(r.name, 'Core');
    });

    it('define throws if no solutionId', function() {
      const bc = new BoundedContexts(); assert.throws(() => bc.define(null, {}));
    });

    it('define throws if context missing id/name', function() {
      const bc = new BoundedContexts(); assert.throws(() => bc.define('s1', { name: 'n' })); assert.throws(() => bc.define('s1', { id: 'i' }));
    });

    it('get returns context', function() {
      const bc = new BoundedContexts(); bc.define('s1', { id: 'c1', name: 'C' }); assert.strictEqual(bc.get('s1', 'c1').name, 'C');
    });

    it('get returns null for missing', function() {
      const bc = new BoundedContexts(); assert.strictEqual(bc.get('none', 'c1'), null); assert.strictEqual(bc.get('s1', 'none'), null);
    });

    it('list returns all', function() {
      const bc = new BoundedContexts(); bc.define('s1', { id: 'c1', name: 'A' }); bc.define('s1', { id: 'c2', name: 'B' }); assert.strictEqual(bc.list('s1').length, 2);
    });

    it('update modifies allowed fields', function() {
      const bc = new BoundedContexts(); bc.define('s1', { id: 'c1', name: 'C' }); bc.update('s1', 'c1', { name: 'U' }); assert.strictEqual(bc.get('s1', 'c1').name, 'U');
    });

    it('update returns null for missing', function() {
      const bc = new BoundedContexts(); assert.strictEqual(bc.update('none', 'c1', {}), null);
    });

    it('remove returns true', function() {
      const bc = new BoundedContexts(); bc.define('s1', { id: 'c1', name: 'C' }); assert.ok(bc.remove('s1', 'c1')); assert.strictEqual(bc.list('s1').length, 0);
    });

    it('clear resets', function() {
      const bc = new BoundedContexts(); bc.define('s1', { id: 'c1', name: 'C' }); bc.clear(); assert.strictEqual(bc.list('s1').length, 0);
    });

  });

  /* ─── DomainModel (9 tests) ─── */
  describe('DomainModel', function() {
    const { DomainModel } = require('../lib/architecture/domainModel');

    it('define creates model', function() {
      const dm = new DomainModel(); const r = dm.define('s1', { id: 'm1', name: 'User' }); assert.strictEqual(r.id, 'm1'); assert.strictEqual(r.name, 'User');
    });

    it('define throws if no solutionId', function() {
      const dm = new DomainModel(); assert.throws(() => dm.define(null, {}));
    });

    it('define throws if model missing id/name', function() {
      const dm = new DomainModel(); assert.throws(() => dm.define('s1', { name: 'n' })); assert.throws(() => dm.define('s1', { id: 'i' }));
    });

    it('get returns model', function() {
      const dm = new DomainModel(); dm.define('s1', { id: 'm1', name: 'U' }); assert.strictEqual(dm.get('s1', 'm1').name, 'U');
    });

    it('list returns all', function() {
      const dm = new DomainModel(); dm.define('s1', { id: 'm1', name: 'A' }); dm.define('s1', { id: 'm2', name: 'B' }); assert.strictEqual(dm.list('s1').length, 2);
    });

    it('update modifies fields', function() {
      const dm = new DomainModel(); dm.define('s1', { id: 'm1', name: 'U' }); dm.update('s1', 'm1', { name: 'U2' }); assert.strictEqual(dm.get('s1', 'm1').name, 'U2');
    });

    it('remove returns true', function() {
      const dm = new DomainModel(); dm.define('s1', { id: 'm1', name: 'U' }); assert.ok(dm.remove('s1', 'm1')); assert.strictEqual(dm.list('s1').length, 0);
    });

    it('clear resets', function() {
      const dm = new DomainModel(); dm.define('s1', { id: 'm1', name: 'U' }); dm.clear(); assert.strictEqual(dm.list('s1').length, 0);
    });

    it('define with arrays', function() {
      const dm = new DomainModel(); const r = dm.define('s1', { id: 'm1', name: 'M', entities: ['e1'], valueObjects: ['vo1'], aggregates: ['ag1'], services: ['sv1'], repositories: ['rp1'] }); assert.strictEqual(r.entities.length, 1); assert.strictEqual(r.valueObjects.length, 1);
    });

  });

  /* ─── CapabilityMap (9 tests) ─── */
  describe('CapabilityMap', function() {
    const { CapabilityMap } = require('../lib/architecture/capabilityMap');

    it('map creates entries', function() {
      const cm = new CapabilityMap(); const r = cm.map('s1', [{ id: 'c1', name: 'Auth' }]); assert.strictEqual(r.length, 1); assert.strictEqual(r[0].name, 'Auth');
    });

    it('map throws if not array', function() {
      const cm = new CapabilityMap(); assert.throws(() => cm.map('s1', 'bad'));
    });

    it('get returns array', function() {
      const cm = new CapabilityMap(); cm.map('s1', [{ id: 'c1' }]); assert.strictEqual(cm.get('s1').length, 1);
    });

    it('get returns empty for missing', function() {
      const cm = new CapabilityMap(); assert.deepStrictEqual(cm.get('none'), []);
    });

    it('addCapability adds entry', function() {
      const cm = new CapabilityMap(); const r = cm.addCapability('s1', { name: 'New' }); assert.ok(r.id); assert.strictEqual(r.name, 'New');
    });

    it('addCapability creates map if missing', function() {
      const cm = new CapabilityMap(); cm.addCapability('new', { name: 'X' }); assert.strictEqual(cm.get('new').length, 1);
    });

    it('removeCapability returns true', function() {
      const cm = new CapabilityMap(); cm.addCapability('s1', { id: 'c1', name: 'A' }); assert.ok(cm.removeCapability('s1', 'c1'));
    });

    it('findByCategory filters', function() {
      const cm = new CapabilityMap(); cm.map('s1', [{ id: 'c1', category: 'sec' }, { id: 'c2', category: 'data' }]); assert.strictEqual(cm.findByCategory('s1', 'sec').length, 1);
    });

    it('clear resets', function() {
      const cm = new CapabilityMap(); cm.map('s1', [{ id: 'c1' }]); cm.clear(); assert.strictEqual(cm.get('s1').length, 0);
    });

  });

  /* ─── DependencyMap (10 tests) ─── */
  describe('DependencyMap', function() {
    const { DependencyMap } = require('../lib/architecture/dependencyMap');

    it('map creates entries', function() {
      const dm = new DependencyMap(); const r = dm.map('s1', [{ from: 'A', to: 'B' }]); assert.strictEqual(r.length, 1); assert.strictEqual(r[0].from, 'A'); assert.strictEqual(r[0].to, 'B');
    });

    it('map throws if not array', function() {
      const dm = new DependencyMap(); assert.throws(() => dm.map('s1', 'bad'));
    });

    it('get returns array', function() {
      const dm = new DependencyMap(); dm.map('s1', [{ from: 'A', to: 'B' }]); assert.strictEqual(dm.get('s1').length, 1);
    });

    it('get returns empty for missing', function() {
      const dm = new DependencyMap(); assert.deepStrictEqual(dm.get('none'), []);
    });

    it('addDependency adds entry', function() {
      const dm = new DependencyMap(); const r = dm.addDependency('s1', { from: 'A', to: 'B' }); assert.strictEqual(r.from, 'A'); assert.strictEqual(r.to, 'B');
    });

    it('addDependency creates map if missing', function() {
      const dm = new DependencyMap(); dm.addDependency('new', { from: 'A', to: 'B' }); assert.strictEqual(dm.get('new').length, 1);
    });

    it('removeDependency by index', function() {
      const dm = new DependencyMap(); dm.addDependency('s1', { from: 'A', to: 'B' }); assert.ok(dm.removeDependency('s1', 0)); assert.strictEqual(dm.get('s1').length, 0);
    });

    it('getCritical filters', function() {
      const dm = new DependencyMap(); dm.map('s1', [{ from: 'A', to: 'B', critical: true }, { from: 'C', to: 'D' }]); assert.strictEqual(dm.getCritical('s1').length, 1);
    });

    it('getByType filters', function() {
      const dm = new DependencyMap(); dm.map('s1', [{ from: 'A', to: 'B', type: 'sync' }, { from: 'C', to: 'D', type: 'async' }]); assert.strictEqual(dm.getByType('s1', 'sync').length, 1);
    });

    it('clear resets', function() {
      const dm = new DependencyMap(); dm.map('s1', [{}]); dm.clear(); assert.strictEqual(dm.get('s1').length, 0);
    });

  });

  /* ─── RequirementsAnalyzer (8 tests) ─── */
  describe('RequirementsAnalyzer', function() {
    const { RequirementsAnalyzer } = require('../lib/architecture/requirementsAnalyzer');

    it('empty state', function() {
      const ra = new RequirementsAnalyzer(); assert.deepStrictEqual(ra.list(), []);
    });

    it('analyze creates analysis', function() {
      const ra = new RequirementsAnalyzer(); const r = ra.analyze('a1', ['r1']); assert.ok(r.id); assert.strictEqual(r.architectureId, 'a1'); assert.deepStrictEqual(r.requirements, ['r1']);
    });

    it('analyze throws if no architectureId', function() {
      const ra = new RequirementsAnalyzer(); assert.throws(() => ra.analyze(null, []));
    });

    it('analyze handles missing requirements', function() {
      const ra = new RequirementsAnalyzer(); const r = ra.analyze('a1'); assert.deepStrictEqual(r.requirements, []);
    });

    it('get returns by id', function() {
      const ra = new RequirementsAnalyzer(); const r = ra.analyze('a1', []); assert.strictEqual(ra.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const ra = new RequirementsAnalyzer(); assert.strictEqual(ra.get('none'), null);
    });

    it('list returns all', function() {
      const ra = new RequirementsAnalyzer(); ra.analyze('a', []); ra.analyze('b', []); assert.strictEqual(ra.list().length, 2);
    });

    it('clear resets', function() {
      const ra = new RequirementsAnalyzer(); ra.analyze('a', []); ra.clear(); assert.strictEqual(ra.list().length, 0);
    });

  });

  /* ─── ConstraintAnalyzer (8 tests) ─── */
  describe('ConstraintAnalyzer', function() {
    const { ConstraintAnalyzer } = require('../lib/architecture/constraintAnalyzer');

    it('empty state', function() {
      const ca = new ConstraintAnalyzer(); assert.deepStrictEqual(ca.list(), []);
    });

    it('analyze creates analysis', function() {
      const ca = new ConstraintAnalyzer(); const r = ca.analyze('a1', ['c1']); assert.ok(r.id); assert.strictEqual(r.architectureId, 'a1');
    });

    it('analyze throws if no architectureId', function() {
      const ca = new ConstraintAnalyzer(); assert.throws(() => ca.analyze(null, []));
    });

    it('analyze handles missing constraints', function() {
      const ca = new ConstraintAnalyzer(); const r = ca.analyze('a1'); assert.deepStrictEqual(r.constraints, []);
    });

    it('get returns by id', function() {
      const ca = new ConstraintAnalyzer(); const r = ca.analyze('a1', []); assert.strictEqual(ca.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const ca = new ConstraintAnalyzer(); assert.strictEqual(ca.get('none'), null);
    });

    it('list returns all', function() {
      const ca = new ConstraintAnalyzer(); ca.analyze('a', []); ca.analyze('b', []); assert.strictEqual(ca.list().length, 2);
    });

    it('clear resets', function() {
      const ca = new ConstraintAnalyzer(); ca.analyze('a', []); ca.clear(); assert.strictEqual(ca.list().length, 0);
    });

  });

  /* ─── RiskAnalyzer (8 tests) ─── */
  describe('RiskAnalyzer', function() {
    const { RiskAnalyzer } = require('../lib/architecture/riskAnalyzer');

    it('empty state', function() {
      const ra = new RiskAnalyzer(); assert.deepStrictEqual(ra.list(), []);
    });

    it('analyze creates analysis', function() {
      const ra = new RiskAnalyzer(); const r = ra.analyze('a1', ['r1']); assert.ok(r.id);
    });

    it('analyze throws if no architectureId', function() {
      const ra = new RiskAnalyzer(); assert.throws(() => ra.analyze(null, []));
    });

    it('analyze handles missing risks', function() {
      const ra = new RiskAnalyzer(); const r = ra.analyze('a1'); assert.deepStrictEqual(r.risks, []);
    });

    it('get returns by id', function() {
      const ra = new RiskAnalyzer(); const r = ra.analyze('a1', []); assert.strictEqual(ra.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const ra = new RiskAnalyzer(); assert.strictEqual(ra.get('none'), null);
    });

    it('list returns all', function() {
      const ra = new RiskAnalyzer(); ra.analyze('a', []); ra.analyze('b', []); assert.strictEqual(ra.list().length, 2);
    });

    it('clear resets', function() {
      const ra = new RiskAnalyzer(); ra.analyze('a', []); ra.clear(); assert.strictEqual(ra.list().length, 0);
    });

  });

  /* ─── TradeoffAnalyzer (8 tests) ─── */
  describe('TradeoffAnalyzer', function() {
    const { TradeoffAnalyzer } = require('../lib/architecture/tradeoffAnalyzer');

    it('empty state', function() {
      const ta = new TradeoffAnalyzer(); assert.deepStrictEqual(ta.list(), []);
    });

    it('analyze creates analysis', function() {
      const ta = new TradeoffAnalyzer(); const r = ta.analyze('a1', ['t1']); assert.ok(r.id);
    });

    it('analyze throws if no architectureId', function() {
      const ta = new TradeoffAnalyzer(); assert.throws(() => ta.analyze(null, []));
    });

    it('analyze handles missing tradeoffs', function() {
      const ta = new TradeoffAnalyzer(); const r = ta.analyze('a1'); assert.deepStrictEqual(r.tradeoffs, []);
    });

    it('get returns by id', function() {
      const ta = new TradeoffAnalyzer(); const r = ta.analyze('a1', []); assert.strictEqual(ta.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const ta = new TradeoffAnalyzer(); assert.strictEqual(ta.get('none'), null);
    });

    it('list returns all', function() {
      const ta = new TradeoffAnalyzer(); ta.analyze('a', []); ta.analyze('b', []); assert.strictEqual(ta.list().length, 2);
    });

    it('clear resets', function() {
      const ta = new TradeoffAnalyzer(); ta.analyze('a', []); ta.clear(); assert.strictEqual(ta.list().length, 0);
    });

  });

  /* ─── QualityAttributeAnalyzer (8 tests) ─── */
  describe('QualityAttributeAnalyzer', function() {
    const { QualityAttributeAnalyzer } = require('../lib/architecture/qualityAttributeAnalyzer');

    it('empty state', function() {
      const qa = new QualityAttributeAnalyzer(); assert.deepStrictEqual(qa.list(), []);
    });

    it('analyze creates analysis', function() {
      const qa = new QualityAttributeAnalyzer(); const r = qa.analyze('a1', { perf: 'high' }); assert.ok(r.id); assert.strictEqual(r.attributes.perf, 'high');
    });

    it('analyze throws if no architectureId', function() {
      const qa = new QualityAttributeAnalyzer(); assert.throws(() => qa.analyze(null, { perf: 'high' }));
    });

    it('analyze throws if no attributes', function() {
      const qa = new QualityAttributeAnalyzer(); assert.throws(() => qa.analyze('a1', null));
    });

    it('get returns by id', function() {
      const qa = new QualityAttributeAnalyzer(); const r = qa.analyze('a1', {}); assert.strictEqual(qa.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const qa = new QualityAttributeAnalyzer(); assert.strictEqual(qa.get('none'), null);
    });

    it('list returns all', function() {
      const qa = new QualityAttributeAnalyzer(); qa.analyze('a', {}); qa.analyze('b', {}); assert.strictEqual(qa.list().length, 2);
    });

    it('clear resets', function() {
      const qa = new QualityAttributeAnalyzer(); qa.analyze('a', {}); qa.clear(); assert.strictEqual(qa.list().length, 0);
    });

  });

  /* ─── PatternRegistry (8 tests) ─── */
  describe('PatternRegistry', function() {
    const { PatternRegistry } = require('../lib/architecture/patternRegistry');

    it('empty state', function() {
      const pr = new PatternRegistry(); assert.deepStrictEqual(pr.list(), []);
    });

    it('register stores pattern', function() {
      const pr = new PatternRegistry(); const p = pr.register({ name: 'test' }); assert.ok(p.id); assert.strictEqual(p.name, 'test');
    });

    it('register uses provided id', function() {
      const pr = new PatternRegistry(); const p = pr.register({ id: 'myid', name: 'test' }); assert.strictEqual(p.id, 'myid');
    });

    it('register throws if no name', function() {
      const pr = new PatternRegistry(); assert.throws(() => pr.register({}));
    });

    it('get returns by id', function() {
      const pr = new PatternRegistry(); const p = pr.register({ name: 'test' }); assert.strictEqual(pr.get(p.id).name, 'test');
    });

    it('get returns null for null', function() {
      const pr = new PatternRegistry(); assert.strictEqual(pr.get(null), null);
    });

    it('list returns all', function() {
      const pr = new PatternRegistry(); pr.register({ name: 'a' }); pr.register({ name: 'b' }); assert.strictEqual(pr.list().length, 2);
    });

    it('clear resets', function() {
      const pr = new PatternRegistry(); pr.register({ name: 'a' }); pr.clear(); assert.strictEqual(pr.list().length, 0);
    });

  });

  /* ─── PatternSelector (8 tests) ─── */
  describe('PatternSelector', function() {
    const { PatternSelector } = require('../lib/architecture/patternSelector');

    it('empty state', function() {
      const ps = new PatternSelector(); assert.deepStrictEqual(ps.list(), []);
    });

    it('select creates selection', function() {
      const ps = new PatternSelector(); const r = ps.select('a1', ['Layered']); assert.ok(r.id); assert.strictEqual(r.architectureId, 'a1'); assert.deepStrictEqual(r.patterns, ['Layered']);
    });

    it('select throws if no architectureId', function() {
      const ps = new PatternSelector(); assert.throws(() => ps.select(null, []));
    });

    it('select throws if no patterns', function() {
      const ps = new PatternSelector(); assert.throws(() => ps.select('a1', null));
    });

    it('get returns by id', function() {
      const ps = new PatternSelector(); const r = ps.select('a1', []); assert.strictEqual(ps.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const ps = new PatternSelector(); assert.strictEqual(ps.get('none'), null);
    });

    it('list returns all', function() {
      const ps = new PatternSelector(); ps.select('a', []); ps.select('b', []); assert.strictEqual(ps.list().length, 2);
    });

    it('clear resets', function() {
      const ps = new PatternSelector(); ps.select('a', []); ps.clear(); assert.strictEqual(ps.list().length, 0);
    });

  });

  /* ─── PatternEvaluator (9 tests) ─── */
  describe('PatternEvaluator', function() {
    const { PatternEvaluator } = require('../lib/architecture/patternEvaluator');

    it('empty state', function() {
      const pe = new PatternEvaluator(); assert.deepStrictEqual(pe.list(), []);
    });

    it('evaluate creates evaluation', function() {
      const pe = new PatternEvaluator(); const r = pe.evaluate({ name: 'Layered' }, { domain: 'web' }); assert.ok(r.id); assert.strictEqual(r.pattern.name, 'Layered');
    });

    it('evaluate throws if no pattern', function() {
      const pe = new PatternEvaluator(); assert.throws(() => pe.evaluate(null, {}));
    });

    it('evaluate defaults context', function() {
      const pe = new PatternEvaluator(); const r = pe.evaluate({ name: 'Layered' }); assert.deepStrictEqual(r.context, {});
    });

    it('evaluate sets score to 0', function() {
      const pe = new PatternEvaluator(); const r = pe.evaluate({ name: 'Layered' }); assert.strictEqual(r.score, 0);
    });

    it('get returns by id', function() {
      const pe = new PatternEvaluator(); const r = pe.evaluate({ name: 'Layered' }); assert.strictEqual(pe.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const pe = new PatternEvaluator(); assert.strictEqual(pe.get('none'), null);
    });

    it('list returns all', function() {
      const pe = new PatternEvaluator(); pe.evaluate({ name: 'a' }); pe.evaluate({ name: 'b' }); assert.strictEqual(pe.list().length, 2);
    });

    it('clear resets', function() {
      const pe = new PatternEvaluator(); pe.evaluate({ name: 'a' }); pe.clear(); assert.strictEqual(pe.list().length, 0);
    });

  });

  /* ─── PatternScoring (11 tests) ─── */
  describe('PatternScoring', function() {
    const { PatternScoring } = require('../lib/architecture/patternScoring');

    it('empty state', function() {
      const ps = new PatternScoring(); assert.strictEqual(ps.list().length, 0);
    });

    it('score computes normalized total', function() {
      const ps = new PatternScoring(); const s = ps.score('p1', { weights: { a: 1, b: 1 }, matches: { a: true, b: true } }); assert.strictEqual(s.total, 1);
    });

    it('score throws if no patternId', function() {
      const ps = new PatternScoring(); assert.throws(() => ps.score(null, {}));
    });

    it('score throws if no criteria', function() {
      const ps = new PatternScoring(); assert.throws(() => ps.score('p1', null));
    });

    it('score with no weights returns 0', function() {
      const ps = new PatternScoring(); const s = ps.score('p1', { weights: {}, matches: {} }); assert.strictEqual(s.total, 0);
    });

    it('score with partial matches', function() {
      const ps = new PatternScoring(); const s = ps.score('p1', { weights: { a: 1, b: 1 }, matches: { a: true, b: false } }); assert.strictEqual(s.total, 0.5);
    });

    it('compare returns sorted', function() {
      const ps = new PatternScoring(); const s1 = ps.score('p1', { weights: { a: 1 }, matches: { a: true } }); const s2 = ps.score('p2', { weights: { a: 1 }, matches: { a: false } }); const sorted = ps.compare([s1.id, s2.id]); assert.strictEqual(sorted[0].total, 1); assert.strictEqual(sorted[1].total, 0);
    });

    it('compare filters missing', function() {
      const ps = new PatternScoring(); const s = ps.score('p1', { weights: { a: 1 }, matches: { a: true } }); assert.strictEqual(ps.compare([s.id, 'none']).length, 1);
    });

    it('get returns by id', function() {
      const ps = new PatternScoring(); const s = ps.score('p1', {}); assert.strictEqual(ps.get(s.id).id, s.id);
    });

    it('list returns all', function() {
      const ps = new PatternScoring(); ps.score('p1', {}); ps.score('p2', {}); assert.strictEqual(ps.list().length, 2);
    });

    it('clear resets', function() {
      const ps = new PatternScoring(); ps.score('p1', {}); ps.clear(); assert.strictEqual(ps.list().length, 0);
    });

  });

  /* ─── DefaultPatterns (7 tests) ─── */
  describe('DefaultPatterns', function() {
    const { DefaultPatterns } = require('../lib/architecture/defaultPatterns');

    it('empty state', function() {
      const dp = new DefaultPatterns(); assert.strictEqual(dp.list().length, 0);
    });

    it('load returns 8 patterns', function() {
      const dp = new DefaultPatterns(); const r = dp.load(); assert.strictEqual(r.length, 8);
    });

    it('load returns all named patterns', function() {
      const dp = new DefaultPatterns(); dp.load(); assert.ok(dp.get('Layered')); assert.ok(dp.get('Hexagonal')); assert.ok(dp.get('Event Driven')); assert.ok(dp.get('Microservices')); assert.ok(dp.get('Modular Monolith')); assert.ok(dp.get('Serverless')); assert.ok(dp.get('Pipeline')); assert.ok(dp.get('AI Native'));
    });

    it('list returns loaded patterns', function() {
      const dp = new DefaultPatterns(); dp.load(); assert.strictEqual(dp.list().length, 8);
    });

    it('each pattern has required fields', function() {
      const dp = new DefaultPatterns(); const r = dp.load(); r.forEach(p => { assert.ok(p.name); assert.ok(p.category); assert.ok(p.description); assert.ok(Array.isArray(p.characteristics)); assert.ok(Array.isArray(p.suitable)); });
    });

    it('get returns null for missing', function() {
      const dp = new DefaultPatterns(); dp.load(); assert.strictEqual(dp.get('none'), null);
    });

    it('clear removes all', function() {
      const dp = new DefaultPatterns(); dp.load(); dp.clear(); assert.strictEqual(dp.list().length, 0);
    });

  });

  /* ─── DecisionManager (10 tests) ─── */
  describe('DecisionManager', function() {
    const { DecisionManager } = require('../lib/architecture/decisionManager');

    it('empty state', function() {
      const dm = new DecisionManager(); assert.strictEqual(dm.list().length, 0);
    });

    it('make creates decision', function() {
      const dm = new DecisionManager(); const r = dm.make('a1', { title: 'T' }); assert.ok(r.id); assert.strictEqual(r.architectureId, 'a1'); assert.strictEqual(r.title, 'T');
    });

    it('make throws if no architectureId', function() {
      const dm = new DecisionManager(); assert.throws(() => dm.make(null, {}));
    });

    it('make throws if no decision', function() {
      const dm = new DecisionManager(); assert.throws(() => dm.make('a1', null));
    });

    it('get returns by id', function() {
      const dm = new DecisionManager(); const r = dm.make('a1', {}); assert.strictEqual(dm.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const dm = new DecisionManager(); assert.strictEqual(dm.get('none'), null);
    });

    it('list returns all', function() {
      const dm = new DecisionManager(); dm.make('a', {}); dm.make('b', {}); assert.strictEqual(dm.list().length, 2);
    });

    it('reject sets status', function() {
      const dm = new DecisionManager(); const r = dm.make('a1', {}); dm.reject(r.id, 'bad'); assert.strictEqual(dm.get(r.id).status, 'rejected'); assert.strictEqual(dm.get(r.id).reason, 'bad');
    });

    it('reject returns null for missing', function() {
      const dm = new DecisionManager(); assert.strictEqual(dm.reject('none', 'x'), null);
    });

    it('clear resets', function() {
      const dm = new DecisionManager(); dm.make('a', {}); dm.clear(); assert.strictEqual(dm.list().length, 0);
    });

  });

  /* ─── DecisionLog (8 tests) ─── */
  describe('DecisionLog', function() {
    const { DecisionLog } = require('../lib/architecture/decisionLog');

    it('empty state', function() {
      const dl = new DecisionLog(); assert.strictEqual(dl.list().length, 0);
    });

    it('log creates entry', function() {
      const dl = new DecisionLog(); const r = dl.log('d1', { action: 'approved' }); assert.ok(r.id); assert.strictEqual(r.decisionId, 'd1'); assert.strictEqual(r.action, 'approved');
    });

    it('log throws if no decisionId', function() {
      const dl = new DecisionLog(); assert.throws(() => dl.log(null, {}));
    });

    it('log throws if no entry', function() {
      const dl = new DecisionLog(); assert.throws(() => dl.log('d1', null));
    });

    it('get returns by id', function() {
      const dl = new DecisionLog(); const r = dl.log('d1', {}); assert.strictEqual(dl.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const dl = new DecisionLog(); assert.strictEqual(dl.get('none'), null);
    });

    it('list returns all', function() {
      const dl = new DecisionLog(); dl.log('a', {}); dl.log('b', {}); assert.strictEqual(dl.list().length, 2);
    });

    it('clear resets', function() {
      const dl = new DecisionLog(); dl.log('a', {}); dl.clear(); assert.strictEqual(dl.list().length, 0);
    });

  });

  /* ─── ArchitectureDecisionRecord (13 tests) ─── */
  describe('ArchitectureDecisionRecord', function() {
    const { ArchitectureDecisionRecord } = require('../lib/architecture/architectureDecisionRecord');

    it('empty state', function() {
      const adr = new ArchitectureDecisionRecord(); assert.strictEqual(adr.list().length, 0);
    });

    it('create makes record with proposed status', function() {
      const adr = new ArchitectureDecisionRecord(); const r = adr.create('a1', 'Title', 'ctx', 'dec'); assert.ok(r.id); assert.strictEqual(r.status, 'proposed'); assert.strictEqual(r.title, 'Title');
    });

    it('create throws if no architectureId', function() {
      const adr = new ArchitectureDecisionRecord(); assert.throws(() => adr.create(null, 't'));
    });

    it('create throws if no title', function() {
      const adr = new ArchitectureDecisionRecord(); assert.throws(() => adr.create('a1', null));
    });

    it('accept changes status to accepted', function() {
      const adr = new ArchitectureDecisionRecord(); const r = adr.create('a1', 'T'); adr.accept(r.id); assert.strictEqual(adr.get(r.id).status, 'accepted');
    });

    it('accept returns null for missing', function() {
      const adr = new ArchitectureDecisionRecord(); assert.strictEqual(adr.accept('none'), null);
    });

    it('accept returns null for deprecated', function() {
      const adr = new ArchitectureDecisionRecord(); const r = adr.create('a1', 'T'); adr.deprecate(r.id, 'old'); assert.strictEqual(adr.accept(r.id), null);
    });

    it('deprecate sets status', function() {
      const adr = new ArchitectureDecisionRecord(); const r = adr.create('a1', 'T'); adr.deprecate(r.id, 'reason'); assert.strictEqual(adr.get(r.id).status, 'deprecated'); assert.strictEqual(adr.get(r.id).deprecationReason, 'reason');
    });

    it('supersede sets status', function() {
      const adr = new ArchitectureDecisionRecord(); const r1 = adr.create('a1', 'T1'); const r2 = adr.create('a1', 'T2'); adr.supersede(r1.id, r2.id, 'replaced'); assert.strictEqual(adr.get(r1.id).status, 'superseded'); assert.strictEqual(adr.get(r1.id).supersededBy, r2.id);
    });

    it('get returns null for null id', function() {
      const adr = new ArchitectureDecisionRecord(); assert.strictEqual(adr.get(null), null);
    });

    it('list filters by status', function() {
      const adr = new ArchitectureDecisionRecord(); adr.create('a1', 'T1'); const r2 = adr.create('a1', 'T2'); adr.accept(r2.id); assert.strictEqual(adr.list({ status: 'accepted' }).length, 1); assert.strictEqual(adr.list({ status: 'proposed' }).length, 1);
    });

    it('list filters by architectureId', function() {
      const adr = new ArchitectureDecisionRecord(); adr.create('a', 'T'); adr.create('b', 'T'); assert.strictEqual(adr.list({ architectureId: 'a' }).length, 1);
    });

    it('clear resets', function() {
      const adr = new ArchitectureDecisionRecord(); adr.create('a1', 'T'); adr.clear(); assert.strictEqual(adr.list().length, 0);
    });

  });

  /* ─── Alternatives (8 tests) ─── */
  describe('Alternatives', function() {
    const { Alternatives } = require('../lib/architecture/alternatives');

    it('empty state', function() {
      const a = new Alternatives(); assert.strictEqual(a.list().length, 0);
    });

    it('add creates entry', function() {
      const al = new Alternatives(); const r = al.add('d1', { name: 'opt1' }); assert.ok(r.id); assert.strictEqual(r.decisionId, 'd1'); assert.strictEqual(r.name, 'opt1');
    });

    it('add throws if no decisionId', function() {
      const a = new Alternatives(); assert.throws(() => a.add(null, {}));
    });

    it('add throws if no alternative', function() {
      const a = new Alternatives(); assert.throws(() => a.add('d1', null));
    });

    it('get returns by id', function() {
      const al = new Alternatives(); const r = al.add('d1', {}); assert.strictEqual(al.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const a = new Alternatives(); assert.strictEqual(a.get('none'), null);
    });

    it('list returns all', function() {
      const al = new Alternatives(); al.add('a', {}); al.add('b', {}); assert.strictEqual(al.list().length, 2);
    });

    it('clear resets', function() {
      const al = new Alternatives(); al.add('a', {}); al.clear(); assert.strictEqual(al.list().length, 0);
    });

  });

  /* ─── Rationale (8 tests) ─── */
  describe('Rationale', function() {
    const { Rationale } = require('../lib/architecture/rationale');

    it('empty state', function() {
      const r = new Rationale(); assert.strictEqual(r.list().length, 0);
    });

    it('add creates entry', function() {
      const ra = new Rationale(); const r = ra.add('d1', 'because...'); assert.ok(r.id); assert.strictEqual(r.decisionId, 'd1'); assert.strictEqual(r.text, 'because...');
    });

    it('add throws if no decisionId', function() {
      const r = new Rationale(); assert.throws(() => r.add(null, 'x'));
    });

    it('add throws if no text', function() {
      const r = new Rationale(); assert.throws(() => r.add('d1', null));
    });

    it('get returns by id', function() {
      const ra = new Rationale(); const r = ra.add('d1', 'x'); assert.strictEqual(ra.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const r = new Rationale(); assert.strictEqual(r.get('none'), null);
    });

    it('list returns all', function() {
      const ra = new Rationale(); ra.add('a', 'x'); ra.add('b', 'y'); assert.strictEqual(ra.list().length, 2);
    });

    it('clear resets', function() {
      const ra = new Rationale(); ra.add('a', 'x'); ra.clear(); assert.strictEqual(ra.list().length, 0);
    });

  });

  /* ─── Availability (10 tests) ─── */
  describe('Availability', function() {
    const { Availability } = require('../lib/architecture/availability');

    it('should create with empty state', function() {
      const x = new Availability(); assert.strictEqual(x.list().length, 0);
    });

    it('configure creates entry', function() {
      const x = new Availability(); const r = x.configure('arch1', { val: 'test' });
      assert.ok(r.id); assert.strictEqual(r.architectureId, 'arch1');
    });

    it('configure throws if no architectureId', function() {
      const x = new Availability(); assert.throws(() => x.configure(null, {}));
    });

    it('configure throws if no config', function() {
      const x = new Availability(); assert.throws(() => x.configure('a', null));
    });

    it('get returns entry by id', function() {
      const x = new Availability(); const r = x.configure('a', {});
      assert.strictEqual(x.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const x = new Availability(); assert.strictEqual(x.get('none'), null);
    });

    it('get returns null for null id', function() {
      const x = new Availability(); assert.strictEqual(x.get(null), null);
    });

    it('list returns all', function() {
      const x = new Availability(); x.configure('a', {}); x.configure('b', {});
      assert.strictEqual(x.list().length, 2);
    });

    it('clear resets', function() {
      const x = new Availability(); x.configure('a', {}); x.clear();
      assert.strictEqual(x.list().length, 0);
    });

  });

  /* ─── Security (10 tests) ─── */
  describe('Security', function() {
    const { Security } = require('../lib/architecture/security');

    it('should create with empty state', function() {
      const x = new Security(); assert.strictEqual(x.list().length, 0);
    });

    it('configure creates entry', function() {
      const x = new Security(); const r = x.configure('arch1', { val: 'test' });
      assert.ok(r.id); assert.strictEqual(r.architectureId, 'arch1');
    });

    it('configure throws if no architectureId', function() {
      const x = new Security(); assert.throws(() => x.configure(null, {}));
    });

    it('configure throws if no config', function() {
      const x = new Security(); assert.throws(() => x.configure('a', null));
    });

    it('get returns entry by id', function() {
      const x = new Security(); const r = x.configure('a', {});
      assert.strictEqual(x.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const x = new Security(); assert.strictEqual(x.get('none'), null);
    });

    it('get returns null for null id', function() {
      const x = new Security(); assert.strictEqual(x.get(null), null);
    });

    it('list returns all', function() {
      const x = new Security(); x.configure('a', {}); x.configure('b', {});
      assert.strictEqual(x.list().length, 2);
    });

    it('clear resets', function() {
      const x = new Security(); x.configure('a', {}); x.clear();
      assert.strictEqual(x.list().length, 0);
    });

  });

  /* ─── Performance (10 tests) ─── */
  describe('Performance', function() {
    const { Performance } = require('../lib/architecture/performance');

    it('should create with empty state', function() {
      const x = new Performance(); assert.strictEqual(x.list().length, 0);
    });

    it('configure creates entry', function() {
      const x = new Performance(); const r = x.configure('arch1', { val: 'test' });
      assert.ok(r.id); assert.strictEqual(r.architectureId, 'arch1');
    });

    it('configure throws if no architectureId', function() {
      const x = new Performance(); assert.throws(() => x.configure(null, {}));
    });

    it('configure throws if no config', function() {
      const x = new Performance(); assert.throws(() => x.configure('a', null));
    });

    it('get returns entry by id', function() {
      const x = new Performance(); const r = x.configure('a', {});
      assert.strictEqual(x.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const x = new Performance(); assert.strictEqual(x.get('none'), null);
    });

    it('get returns null for null id', function() {
      const x = new Performance(); assert.strictEqual(x.get(null), null);
    });

    it('list returns all', function() {
      const x = new Performance(); x.configure('a', {}); x.configure('b', {});
      assert.strictEqual(x.list().length, 2);
    });

    it('clear resets', function() {
      const x = new Performance(); x.configure('a', {}); x.clear();
      assert.strictEqual(x.list().length, 0);
    });

  });

  /* ─── Scalability (10 tests) ─── */
  describe('Scalability', function() {
    const { Scalability } = require('../lib/architecture/scalability');

    it('should create with empty state', function() {
      const x = new Scalability(); assert.strictEqual(x.list().length, 0);
    });

    it('configure creates entry', function() {
      const x = new Scalability(); const r = x.configure('arch1', { val: 'test' });
      assert.ok(r.id); assert.strictEqual(r.architectureId, 'arch1');
    });

    it('configure throws if no architectureId', function() {
      const x = new Scalability(); assert.throws(() => x.configure(null, {}));
    });

    it('configure throws if no config', function() {
      const x = new Scalability(); assert.throws(() => x.configure('a', null));
    });

    it('get returns entry by id', function() {
      const x = new Scalability(); const r = x.configure('a', {});
      assert.strictEqual(x.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const x = new Scalability(); assert.strictEqual(x.get('none'), null);
    });

    it('get returns null for null id', function() {
      const x = new Scalability(); assert.strictEqual(x.get(null), null);
    });

    it('list returns all', function() {
      const x = new Scalability(); x.configure('a', {}); x.configure('b', {});
      assert.strictEqual(x.list().length, 2);
    });

    it('clear resets', function() {
      const x = new Scalability(); x.configure('a', {}); x.clear();
      assert.strictEqual(x.list().length, 0);
    });

  });

  /* ─── Maintainability (10 tests) ─── */
  describe('Maintainability', function() {
    const { Maintainability } = require('../lib/architecture/maintainability');

    it('should create with empty state', function() {
      const x = new Maintainability(); assert.strictEqual(x.list().length, 0);
    });

    it('configure creates entry', function() {
      const x = new Maintainability(); const r = x.configure('arch1', { val: 'test' });
      assert.ok(r.id); assert.strictEqual(r.architectureId, 'arch1');
    });

    it('configure throws if no architectureId', function() {
      const x = new Maintainability(); assert.throws(() => x.configure(null, {}));
    });

    it('configure throws if no config', function() {
      const x = new Maintainability(); assert.throws(() => x.configure('a', null));
    });

    it('get returns entry by id', function() {
      const x = new Maintainability(); const r = x.configure('a', {});
      assert.strictEqual(x.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const x = new Maintainability(); assert.strictEqual(x.get('none'), null);
    });

    it('get returns null for null id', function() {
      const x = new Maintainability(); assert.strictEqual(x.get(null), null);
    });

    it('list returns all', function() {
      const x = new Maintainability(); x.configure('a', {}); x.configure('b', {});
      assert.strictEqual(x.list().length, 2);
    });

    it('clear resets', function() {
      const x = new Maintainability(); x.configure('a', {}); x.clear();
      assert.strictEqual(x.list().length, 0);
    });

  });

  /* ─── Cost (10 tests) ─── */
  describe('Cost', function() {
    const { Cost } = require('../lib/architecture/cost');

    it('should create with empty state', function() {
      const x = new Cost(); assert.strictEqual(x.list().length, 0);
    });

    it('estimate creates entry', function() {
      const x = new Cost(); const r = x.estimate('arch1', { val: 'test' });
      assert.ok(r.id); assert.strictEqual(r.architectureId, 'arch1');
    });

    it('estimate throws if no architectureId', function() {
      const x = new Cost(); assert.throws(() => x.estimate(null, {}));
    });

    it('estimate throws if no config', function() {
      const x = new Cost(); assert.throws(() => x.estimate('a', null));
    });

    it('get returns entry by id', function() {
      const x = new Cost(); const r = x.estimate('a', {});
      assert.strictEqual(x.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const x = new Cost(); assert.strictEqual(x.get('none'), null);
    });

    it('get returns null for null id', function() {
      const x = new Cost(); assert.strictEqual(x.get(null), null);
    });

    it('list returns all', function() {
      const x = new Cost(); x.estimate('a', {}); x.estimate('b', {});
      assert.strictEqual(x.list().length, 2);
    });

    it('clear resets', function() {
      const x = new Cost(); x.estimate('a', {}); x.clear();
      assert.strictEqual(x.list().length, 0);
    });

  });

  /* ─── Operability (10 tests) ─── */
  describe('Operability', function() {
    const { Operability } = require('../lib/architecture/operability');

    it('should create with empty state', function() {
      const x = new Operability(); assert.strictEqual(x.list().length, 0);
    });

    it('configure creates entry', function() {
      const x = new Operability(); const r = x.configure('arch1', { val: 'test' });
      assert.ok(r.id); assert.strictEqual(r.architectureId, 'arch1');
    });

    it('configure throws if no architectureId', function() {
      const x = new Operability(); assert.throws(() => x.configure(null, {}));
    });

    it('configure throws if no config', function() {
      const x = new Operability(); assert.throws(() => x.configure('a', null));
    });

    it('get returns entry by id', function() {
      const x = new Operability(); const r = x.configure('a', {});
      assert.strictEqual(x.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const x = new Operability(); assert.strictEqual(x.get('none'), null);
    });

    it('get returns null for null id', function() {
      const x = new Operability(); assert.strictEqual(x.get(null), null);
    });

    it('list returns all', function() {
      const x = new Operability(); x.configure('a', {}); x.configure('b', {});
      assert.strictEqual(x.list().length, 2);
    });

    it('clear resets', function() {
      const x = new Operability(); x.configure('a', {}); x.clear();
      assert.strictEqual(x.list().length, 0);
    });

  });

  /* ─── ArchitecturePattern (SDK) (6 tests) ─── */
  describe('ArchitecturePattern (SDK)', function() {
    const { ArchitecturePattern } = require('../lib/plugin-sdk/ArchitecturePattern');

    it('constructor sets name', function() {
      const p = new ArchitecturePattern('test'); assert.strictEqual(p.name, 'test');
    });

    it('addRule chains', function() {
      const p = new ArchitecturePattern('t'); const ret = p.addRule(() => true); assert.strictEqual(ret, p); assert.strictEqual(p.getRules().length, 1);
    });

    it('evaluate all pass', function() {
      const p = new ArchitecturePattern('t'); p.addRule(() => true); p.addRule(() => true); const r = p.evaluate('ctx'); assert.strictEqual(r.passed, true); assert.strictEqual(r.results.length, 2);
    });

    it('evaluate one fails', function() {
      const p = new ArchitecturePattern('t'); p.addRule(() => true); p.addRule(() => false); const r = p.evaluate('ctx'); assert.strictEqual(r.passed, false);
    });

    it('empty rules passes', function() {
      const p = new ArchitecturePattern('t'); const r = p.evaluate('ctx'); assert.strictEqual(r.passed, true);
    });

    it('evaluate passes context', function() {
      const p = new ArchitecturePattern('t'); let ctx; p.addRule((c) => { ctx = c; return true; }); p.evaluate('myctx'); assert.strictEqual(ctx, 'myctx');
    });

  });

  /* ─── QualityAnalyzer (SDK) (5 tests) ─── */
  describe('QualityAnalyzer (SDK)', function() {
    const { QualityAnalyzer } = require('../lib/plugin-sdk/QualityAnalyzer');

    it('constructor sets name', function() {
      const qa = new QualityAnalyzer('test'); assert.strictEqual(qa.name, 'test');
    });

    it('registerAttribute and analyze', function() {
      const qa = new QualityAnalyzer('t'); qa.registerAttribute('perf', () => 'result'); const r = qa.analyze('perf', 'ctx'); assert.strictEqual(r.result, 'result');
    });

    it('analyze unknown returns null', function() {
      const qa = new QualityAnalyzer('t'); const r = qa.analyze('unknown', 'ctx'); assert.strictEqual(r.attribute, 'unknown'); assert.strictEqual(r.result, null);
    });

    it('analyze passes context', function() {
      const qa = new QualityAnalyzer('t'); let ctx; qa.registerAttribute('perf', (c) => { ctx = c; return 'ok'; }); qa.analyze('perf', 'myctx'); assert.strictEqual(ctx, 'myctx');
    });

    it('multiple attributes', function() {
      const qa = new QualityAnalyzer('t'); qa.registerAttribute('a', () => 1); qa.registerAttribute('b', () => 2); assert.strictEqual(qa.analyze('a', '').result, 1); assert.strictEqual(qa.analyze('b', '').result, 2);
    });

  });

  /* ─── DecisionValidator (SDK) (5 tests) ─── */
  describe('DecisionValidator (SDK)', function() {
    const { DecisionValidator } = require('../lib/plugin-sdk/DecisionValidator');

    it('addValidator chains', function() {
      const dv = new DecisionValidator(); const ret = dv.addValidator(() => true); assert.strictEqual(ret, dv);
    });

    it('validate all pass', function() {
      const dv = new DecisionValidator(); dv.addValidator(() => true); dv.addValidator(() => true); const r = dv.validate('d'); assert.strictEqual(r.valid, true); assert.deepStrictEqual(r.errors, []);
    });

    it('validate one fails', function() {
      const dv = new DecisionValidator(); dv.addValidator(() => true); dv.addValidator(() => 'error'); const r = dv.validate('d'); assert.strictEqual(r.valid, false); assert.strictEqual(r.errors.length, 1);
    });

    it('empty validators valid', function() {
      const dv = new DecisionValidator(); const r = dv.validate('d'); assert.strictEqual(r.valid, true);
    });

    it('validator receives decision', function() {
      const dv = new DecisionValidator(); let d; dv.addValidator((dec) => { d = dec; return true; }); dv.validate('mydec'); assert.strictEqual(d, 'mydec');
    });

  });

  /* ─── TopologyBuilder (SDK) (4 tests) ─── */
  describe('TopologyBuilder (SDK)', function() {
    const { TopologyBuilder } = require('../lib/plugin-sdk/TopologyBuilder');

    it('addBuilder stores function', function() {
      const tb = new TopologyBuilder('t'); tb.addBuilder(() => ({ components: [], connections: [] }));
    });

    it('build returns empty initially', function() {
      const tb = new TopologyBuilder('t'); const r = tb.build('ctx'); assert.deepStrictEqual(r, { components: [], connections: [] });
    });

    it('build aggregates components', function() {
      const tb = new TopologyBuilder('t'); tb.addBuilder(() => ({ components: ['a'], connections: [] })); tb.addBuilder(() => ({ components: ['b'], connections: [] })); const r = tb.build('ctx'); assert.strictEqual(r.components.length, 2);
    });

    it('build passes context', function() {
      const tb = new TopologyBuilder('t'); let ctx; tb.addBuilder((c) => { ctx = c; return { components: [], connections: [] }; }); tb.build('myctx'); assert.strictEqual(ctx, 'myctx');
    });

  });

  /* ─── BlueprintExporter (SDK) (5 tests) ─── */
  describe('BlueprintExporter (SDK)', function() {
    const { BlueprintExporter } = require('../lib/plugin-sdk/BlueprintExporter');

    it('registerFormat and listFormats', function() {
      const be = new BlueprintExporter(); be.registerFormat('json', (bp) => 'out'); assert.ok(be.listFormats().includes('json'));
    });

    it('export returns result', function() {
      const be = new BlueprintExporter(); be.registerFormat('json', (bp) => 'json-out'); assert.strictEqual(be.export({}, 'json'), 'json-out');
    });

    it('export returns null for unknown', function() {
      const be = new BlueprintExporter(); assert.strictEqual(be.export({}, 'unknown'), null);
    });

    it('listFormats returns registered', function() {
      const be = new BlueprintExporter(); be.registerFormat('a', () => {}); be.registerFormat('b', () => {}); assert.strictEqual(be.listFormats().length, 2);
    });

    it('export passes blueprint', function() {
      const be = new BlueprintExporter(); let bp; be.registerFormat('json', (b) => { bp = b; return 'ok'; }); be.export({ data: 1 }, 'json'); assert.strictEqual(bp.data, 1);
    });

  });

  /* ─── Plugin Architecture Methods (5 tests) ─── */
  describe('Plugin Architecture Methods', function() {
    const { Plugin } = require('../lib/plugin-sdk/Plugin');
    const { ArchitecturePattern } = require('../lib/plugin-sdk/ArchitecturePattern');
    const { QualityAnalyzer } = require('../lib/plugin-sdk/QualityAnalyzer');
    const { DecisionValidator } = require('../lib/plugin-sdk/DecisionValidator');
    const { TopologyBuilder } = require('../lib/plugin-sdk/TopologyBuilder');
    const { BlueprintExporter } = require('../lib/plugin-sdk/BlueprintExporter');
    const manifest = { id: 'arch-test', name: 'Arch Test', version: '1.0.0', author: 'T', description: 'T' };

    it('registerArchitecturePattern', function() {
      const p = new Plugin(manifest); const r = p.registerArchitecturePattern('layered');
      assert.ok(r instanceof ArchitecturePattern);
    });

    it('registerQualityAnalyzer', function() {
      const p = new Plugin(manifest); const r = p.registerQualityAnalyzer('perf');
      assert.ok(r instanceof QualityAnalyzer);
    });

    it('registerDecisionValidator', function() {
      const p = new Plugin(manifest); const r = p.registerDecisionValidator();
      assert.ok(r instanceof DecisionValidator);
    });

    it('registerTopologyBuilder', function() {
      const p = new Plugin(manifest); const r = p.registerTopologyBuilder('cloud');
      assert.ok(r instanceof TopologyBuilder);
    });

    it('registerBlueprintExporter', function() {
      const p = new Plugin(manifest); const r = p.registerBlueprintExporter();
      assert.ok(r instanceof BlueprintExporter);
    });

  });

  /* ─── getDefaultArchitect / index.js (10 tests) ─── */
  describe('getDefaultArchitect / index.js', function() {
    const { getDefaultArchitect, ArchitectureManager, ArchitectureEvents, ArchitectureValidator,
      ArchitectureStorage, DefaultPatterns, SystemTopology, BoundedContexts,
      DecisionManager, ArchitectureDecisionRecord } = require('../lib/architecture');

    it('getDefaultArchitect returns ArchitectureManager', function() {
      const m = getDefaultArchitect(); assert.ok(m instanceof ArchitectureManager);
    });

    it('getDefaultArchitect returns fresh instance each call', function() {
      assert.notStrictEqual(getDefaultArchitect(), getDefaultArchitect());
    });

    it('ArchitectureManager exported', function() { assert.strictEqual(typeof ArchitectureManager, 'function'); });
    it('ArchitectureEvents exported', function() { assert.strictEqual(typeof ArchitectureEvents, 'function'); });
    it('ArchitectureValidator exported', function() { assert.strictEqual(typeof ArchitectureValidator, 'function'); });
    it('ArchitectureStorage exported', function() { assert.strictEqual(typeof ArchitectureStorage, 'function'); });
    it('DefaultPatterns exported', function() { assert.strictEqual(typeof DefaultPatterns, 'function'); });
    it('SystemTopology exported', function() { assert.strictEqual(typeof SystemTopology, 'function'); });
    it('BoundedContexts exported', function() { assert.strictEqual(typeof BoundedContexts, 'function'); });
    it('DecisionManager exported', function() { assert.strictEqual(typeof DecisionManager, 'function'); });
  });

  /* ─── Architecture API Controller (14 tests) ─── */
  describe('Architecture API Controller', function() {
    const { getController } = require('../lib/api/controllers/architectureController');

    function mockReq(body, query) { return { body: body || {}, query: query || {} }; }
    function mockRes() { let jd = null; return { _json: () => jd, status(s) { return this; }, json(d) { jd = d; }, send() {} }; }

    it('getArchitecture returns status', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.getArchitecture(mockReq(), res);
      const data = res._json();
      assert.ok(data.success); assert.ok(data.data.status);
      assert.strictEqual(typeof data.data.patterns, 'number');
      assert.strictEqual(typeof data.data.decisions, 'number');
    });

    it('design with valid definition', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.design(mockReq({ definition: { name: 'test' } }), res);
      const data = res._json();
      assert.ok(data.success); assert.ok(data.data.design);
    });

    it('design with missing definition returns error', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.design(mockReq({}), res);
      assert.strictEqual(res._json().success, false);
    });

    it('validate with valid architecture', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.validate(mockReq({ architecture: { id: 'a', name: 'n', version: '1', patterns: ['p'], components: ['c'] } }), res);
      assert.ok(res._json().success); assert.ok(res._json().data.validation.valid);
    });

    it('validate with missing architecture returns error', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.validate(mockReq({}), res);
      assert.strictEqual(res._json().success, false);
    });

    it('analyze with requirements type', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.analyze(mockReq({ architectureId: 'a1', type: 'requirements', requirements: ['r1'] }), res);
      assert.ok(res._json().success);
    });

    it('analyze with unknown type returns error', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.analyze(mockReq({ architectureId: 'a1', type: 'unknown' }), res);
      assert.strictEqual(res._json().success, false);
    });

    it('exportArchitecture exports blueprint', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.exportArchitecture(mockReq({ solutionId: 's1' }), res);
      assert.ok(res._json().success);
    });

    it('exportArchitecture with missing solutionId error', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.exportArchitecture(mockReq({}), res);
      assert.strictEqual(res._json().success, false);
    });

    it('getPatterns returns patterns', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.getPatterns(mockReq(), res);
      const data = res._json();
      assert.ok(data.success); assert.ok(Array.isArray(data.data.patterns));
      assert.ok(data.data.patterns.length > 0);
    });

    it('getDecisions returns decisions array', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.getDecisions(mockReq(), res);
      const data = res._json();
      assert.ok(data.success); assert.ok(Array.isArray(data.data.decisions));
    });

    it('getGraph returns graph and layers', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.getGraph(mockReq({}, { solutionId: 's1' }), res);
      assert.ok(res._json().success);
    });

    it('getGraph with missing solutionId error', function() {
      const ctrl = getController(); const res = mockRes();
      ctrl.getGraph(mockReq({}, {}), res);
      assert.strictEqual(res._json().success, false);
    });

    it('routes defined correctly', function() {
      const { registerArchitectureRoutes } = require('../lib/api/routes/architectureRoutes');
      const Router = require('express').Router;
      const router = Router();
      assert.doesNotThrow(() => registerArchitectureRoutes(router, getController()));
    });

  });

});
