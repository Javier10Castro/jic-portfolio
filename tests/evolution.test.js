const assert = require('assert');

describe('AI Evolution Platform — Phase 10.3.0', function() {

  describe('EvolutionManager', function() {
    const { EvolutionManager } = require('../lib/evolution/evolutionManager');

    it('should create with empty state', function() {
      const m = new EvolutionManager(); assert.ok(m);
    });

    it('getStatus returns initialized', function() {
      const m = new EvolutionManager(); const s = m.getStatus(); assert.strictEqual(s.initialized, true);
    });

    it('getStatus has 39 submodules', function() {
      const m = new EvolutionManager(); assert.strictEqual(Object.keys(m.getStatus().submodules).length, 39);
    });

    it('clear does not throw', function() {
      const m = new EvolutionManager(); m.clear(); assert.ok(true);
    });

    it('reusable after clear', function() {
      const m = new EvolutionManager(); m.clear(); assert.ok(m.getStatus().initialized);
    });

  });

  describe('SolutionEvolution', function() {
    const { SolutionEvolution } = require('../lib/evolution/solutionEvolution');

    it('should create with empty state', function() {
      const m = new SolutionEvolution(); assert.ok(m);
    });

    it('create stores entry', function() {
      const m = new SolutionEvolution(); const r = m.create('s1', { type: 'refactor' }); assert.ok(r.id); assert.strictEqual(r.solutionId, 's1');
    });

    it('create throws if no solutionId', function() {
      const m = new SolutionEvolution(); assert.throws(() => m.create(null, {}), /solutionId/);
    });

    it('create throws if no plan', function() {
      const m = new SolutionEvolution(); assert.throws(() => m.create('s1'), /plan/);
    });

    it('get returns by id', function() {
      const m = new SolutionEvolution(); const r = m.create('s1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null id', function() {
      const m = new SolutionEvolution(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new SolutionEvolution(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns all', function() {
      const m = new SolutionEvolution(); m.create('s1', {}); m.create('s2', {}); assert.strictEqual(m.list().length, 2);
    });

    it('list filters by solutionId', function() {
      const m = new SolutionEvolution(); m.create('s1', {}); m.create('s2', {}); assert.strictEqual(m.list('s1').length, 1);
    });

    it('update modifies allowed fields', function() {
      const m = new SolutionEvolution(); const r = m.create('s1', {}); m.update(r.id, { status: 'active' }); assert.strictEqual(m.get(r.id).status, 'active');
    });

    it('update returns null for missing', function() {
      const m = new SolutionEvolution(); assert.strictEqual(m.update('none', {}), null);
    });

    it('remove returns true', function() {
      const m = new SolutionEvolution(); const r = m.create('s1', {}); assert.strictEqual(m.remove(r.id), true);
    });

    it('remove returns false for missing', function() {
      const m = new SolutionEvolution(); assert.strictEqual(m.remove('none'), false);
    });

    it('clear resets', function() {
      const m = new SolutionEvolution(); m.create('s1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('EvolutionPlanner', function() {
    const { EvolutionPlanner } = require('../lib/evolution/evolutionPlanner');

    it('should create with empty state', function() {
      const m = new EvolutionPlanner(); assert.ok(m);
    });

    it('createPlan stores plan', function() {
      const m = new EvolutionPlanner(); const r = m.createPlan('e1', 'refactor', ['a1']); assert.ok(r.id); assert.strictEqual(r.type, 'refactor');
    });

    it('createPlan throws for missing args', function() {
      const m = new EvolutionPlanner(); assert.throws(() => m.createPlan(null, 't', []), /evolutionId/);
    });

    it('createPlan throws for non-array actions', function() {
      const m = new EvolutionPlanner(); assert.throws(() => m.createPlan('e1', 't', {}), /array/);
    });

    it('get returns by id', function() {
      const m = new EvolutionPlanner(); const r = m.createPlan('e1', 't', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new EvolutionPlanner(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new EvolutionPlanner(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns all', function() {
      const m = new EvolutionPlanner(); m.createPlan('e1', 't', []); m.createPlan('e2', 't', []); assert.strictEqual(m.list().length, 2);
    });

    it('list filters by evolutionId', function() {
      const m = new EvolutionPlanner(); m.createPlan('e1', 't', []); m.createPlan('e2', 't', []); assert.strictEqual(m.list('e1').length, 1);
    });

    it('updateStatus changes status', function() {
      const m = new EvolutionPlanner(); const r = m.createPlan('e1', 't', []); m.updateStatus(r.id, 'active'); assert.strictEqual(m.get(r.id).status, 'active');
    });

    it('updateStatus returns null for missing', function() {
      const m = new EvolutionPlanner(); assert.strictEqual(m.updateStatus('none', 'x'), null);
    });

    it('clear resets', function() {
      const m = new EvolutionPlanner(); m.createPlan('e1', 't', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('EvolutionEngine', function() {
    const { EvolutionEngine } = require('../lib/evolution/evolutionEngine');

    it('should create with empty state', function() {
      const m = new EvolutionEngine(); assert.ok(m);
    });

    it('execute creates execution', function() {
      const m = new EvolutionEngine(); const r = m.execute('p1', {}); assert.ok(r.id); assert.strictEqual(r.status, 'running');
    });

    it('execute throws for missing args', function() {
      const m = new EvolutionEngine(); assert.throws(() => m.execute(null, {}), /planId/);
    });

    it('execute throws for missing context', function() {
      const m = new EvolutionEngine(); assert.throws(() => m.execute('p1'), /context/);
    });

    it('get returns by id', function() {
      const m = new EvolutionEngine(); const r = m.execute('p1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new EvolutionEngine(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new EvolutionEngine(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns all', function() {
      const m = new EvolutionEngine(); m.execute('p1', {}); m.execute('p2', {}); assert.strictEqual(m.list().length, 2);
    });

    it('list filters by planId', function() {
      const m = new EvolutionEngine(); m.execute('p1', {}); m.execute('p2', {}); assert.strictEqual(m.list('p1').length, 1);
    });

    it('completeStep adds step', function() {
      const m = new EvolutionEngine(); const r = m.execute('p1', {}); m.completeStep(r.id, { status: 'completed' }); assert.strictEqual(m.get(r.id).steps.length, 1);
    });

    it('completeStep returns null for missing', function() {
      const m = new EvolutionEngine(); assert.strictEqual(m.completeStep('none', {}), null);
    });

    it('completeStep completes execution', function() {
      const m = new EvolutionEngine(); const r = m.execute('p1', {}); m.completeStep(r.id, { status: 'completed' }); assert.strictEqual(m.get(r.id).status, 'completed');
    });

    it('clear resets', function() {
      const m = new EvolutionEngine(); m.execute('p1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('EvolutionStorage', function() {
    const { EvolutionStorage } = require('../lib/evolution/evolutionStorage');

    it('should create with empty state', function() {
      const m = new EvolutionStorage(); assert.ok(m);
    });

    it('set/get roundtrip', function() {
      const m = new EvolutionStorage(); m.set('k', 'v'); assert.strictEqual(m.get('k'), 'v');
    });

    it('get returns null for missing', function() {
      const m = new EvolutionStorage(); assert.strictEqual(m.get('none'), null);
    });

    it('get returns null for null', function() {
      const m = new EvolutionStorage(); assert.strictEqual(m.get(null), null);
    });

    it('has returns correct', function() {
      const m = new EvolutionStorage(); m.set('k', 'v'); assert.strictEqual(m.has('k'), true); assert.strictEqual(m.has('none'), false);
    });

    it('delete removes key', function() {
      const m = new EvolutionStorage(); m.set('k', 'v'); assert.strictEqual(m.delete('k'), true);
    });

    it('delete returns false for null', function() {
      const m = new EvolutionStorage(); assert.strictEqual(m.delete(null), false);
    });

    it('getAll returns all', function() {
      const m = new EvolutionStorage(); m.set('a', 1); m.set('b', 2); assert.strictEqual(Object.keys(m.getAll()).length, 2);
    });

    it('set returns this', function() {
      const m = new EvolutionStorage(); assert.strictEqual(m.set('k', 'v'), m);
    });

    it('clear removes all', function() {
      const m = new EvolutionStorage(); m.set('k', 'v'); m.clear(); assert.strictEqual(m.get('k'), null);
    });

  });

  describe('EvolutionEvents', function() {
    const { EvolutionEvents } = require('../lib/evolution/evolutionEvents');

    it('should create with empty state', function() {
      const m = new EvolutionEvents(); assert.ok(m);
    });

    it('EVENTS has 13 constants', function() {
      assert.strictEqual(Object.keys(EvolutionEvents.EVENTS).length, 13);
    });

    it('on registers listener', function() {
      const m = new EvolutionEvents(); const ret = m.on('evt', () => {}); assert.strictEqual(ret, m);
    });

    it('emit triggers listener', function() {
      const m = new EvolutionEvents(); let called = false; m.on('evt', () => { called = true; }); m.emit('evt'); assert.ok(called);
    });

    it('emit returns false for unknown', function() {
      const m = new EvolutionEvents(); assert.strictEqual(m.emit('unknown'), false);
    });

    it('emit throws for null event', function() {
      const m = new EvolutionEvents(); assert.throws(() => m.emit(null), /event/);
    });

    it('on throws for bad args', function() {
      const m = new EvolutionEvents(); assert.throws(() => m.on('', () => {}), /event/); assert.throws(() => m.on('e', null), /function/);
    });

    it('off removes listener', function() {
      const m = new EvolutionEvents(); const fn = () => {}; m.on('evt', fn); m.off('evt', fn); assert.strictEqual(m.emit('evt'), false);
    });

    it('listEvents returns registered', function() {
      const m = new EvolutionEvents(); m.on('a', () => {}); m.on('b', () => {}); assert.strictEqual(m.listEvents().length, 2);
    });

    it('clear removes all', function() {
      const m = new EvolutionEvents(); m.on('a', () => {}); m.clear(); assert.strictEqual(m.listEvents().length, 0);
    });

  });

  describe('EvolutionMetrics', function() {
    const { EvolutionMetrics } = require('../lib/evolution/evolutionMetrics');

    it('should create with empty state', function() {
      const m = new EvolutionMetrics(); assert.ok(m);
    });

    it('record creates entry', function() {
      const m = new EvolutionMetrics(); const r = m.record('cpu', 50); assert.strictEqual(r.name, 'cpu');
    });

    it('record throws for null name', function() {
      const m = new EvolutionMetrics(); assert.throws(() => m.record(null, 1), /name/);
    });

    it('record throws for null value', function() {
      const m = new EvolutionMetrics(); assert.throws(() => m.record('cpu'), /value/);
    });

    it('query filters by name', function() {
      const m = new EvolutionMetrics(); m.record('cpu', 1); m.record('mem', 2); assert.strictEqual(m.query('cpu').length, 1);
    });

    it('query returns empty for unknown', function() {
      const m = new EvolutionMetrics(); assert.strictEqual(m.query('none').length, 0);
    });

    it('aggregate sum', function() {
      const m = new EvolutionMetrics(); m.record('cpu', 1); m.record('cpu', 2); assert.strictEqual(m.aggregate('cpu'), 3);
    });

    it('aggregate returns null for unknown', function() {
      const m = new EvolutionMetrics(); assert.strictEqual(m.aggregate('none'), null);
    });

    it('clear resets', function() {
      const m = new EvolutionMetrics(); m.record('cpu', 1); m.clear(); assert.strictEqual(m.query('cpu').length, 0);
    });

  });

  describe('EvolutionReporter', function() {
    const { EvolutionReporter } = require('../lib/evolution/evolutionReporter');

    it('should create with empty state', function() {
      const m = new EvolutionReporter(); assert.ok(m);
    });

    it('generateReport creates report', function() {
      const m = new EvolutionReporter(); const r = m.generateReport('e1', {}); assert.ok(r.id);
    });

    it('generateReport throws for null', function() {
      const m = new EvolutionReporter(); assert.throws(() => m.generateReport(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new EvolutionReporter(); const r = m.generateReport('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new EvolutionReporter(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new EvolutionReporter(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns all', function() {
      const m = new EvolutionReporter(); m.generateReport('e1', {}); m.generateReport('e2', {}); assert.strictEqual(m.list().length, 2);
    });

    it('list filters by evolutionId', function() {
      const m = new EvolutionReporter(); m.generateReport('e1', {}); m.generateReport('e2', {}); assert.strictEqual(m.list('e1').length, 1);
    });

    it('clear resets', function() {
      const m = new EvolutionReporter(); m.generateReport('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('ArchitectureAnalyzer', function() {
    const { ArchitectureAnalyzer } = require('../lib/evolution/architectureAnalyzer');

    it('should create with empty state', function() {
      const m = new ArchitectureAnalyzer(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new ArchitectureAnalyzer(); const r = m.analyze('e1', {}); assert.ok(r.id); assert.strictEqual(r.evolutionId, 'e1');
    });

    it('analyze throws for null evolutionId', function() {
      const m = new ArchitectureAnalyzer(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new ArchitectureAnalyzer(); const r = m.analyze('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new ArchitectureAnalyzer(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new ArchitectureAnalyzer(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new ArchitectureAnalyzer(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new ArchitectureAnalyzer(); m.analyze('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('DependencyAnalyzer', function() {
    const { DependencyAnalyzer } = require('../lib/evolution/dependencyAnalyzer');

    it('should create with empty state', function() {
      const m = new DependencyAnalyzer(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new DependencyAnalyzer(); const r = m.analyze('e1', {}); assert.ok(r.id); assert.strictEqual(r.evolutionId, 'e1');
    });

    it('analyze throws for null evolutionId', function() {
      const m = new DependencyAnalyzer(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new DependencyAnalyzer(); const r = m.analyze('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new DependencyAnalyzer(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new DependencyAnalyzer(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new DependencyAnalyzer(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new DependencyAnalyzer(); m.analyze('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('ComplexityAnalyzer', function() {
    const { ComplexityAnalyzer } = require('../lib/evolution/complexityAnalyzer');

    it('should create with empty state', function() {
      const m = new ComplexityAnalyzer(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new ComplexityAnalyzer(); const r = m.analyze('e1', {}); assert.ok(r.id); assert.strictEqual(r.evolutionId, 'e1');
    });

    it('analyze throws for null evolutionId', function() {
      const m = new ComplexityAnalyzer(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new ComplexityAnalyzer(); const r = m.analyze('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new ComplexityAnalyzer(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new ComplexityAnalyzer(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new ComplexityAnalyzer(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new ComplexityAnalyzer(); m.analyze('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('PerformanceAnalyzer', function() {
    const { PerformanceAnalyzer } = require('../lib/evolution/performanceAnalyzer');

    it('should create with empty state', function() {
      const m = new PerformanceAnalyzer(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new PerformanceAnalyzer(); const r = m.analyze('e1', {}); assert.ok(r.id); assert.strictEqual(r.evolutionId, 'e1');
    });

    it('analyze throws for null evolutionId', function() {
      const m = new PerformanceAnalyzer(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new PerformanceAnalyzer(); const r = m.analyze('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new PerformanceAnalyzer(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new PerformanceAnalyzer(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new PerformanceAnalyzer(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new PerformanceAnalyzer(); m.analyze('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('SecurityAnalyzer', function() {
    const { SecurityAnalyzer } = require('../lib/evolution/securityAnalyzer');

    it('should create with empty state', function() {
      const m = new SecurityAnalyzer(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new SecurityAnalyzer(); const r = m.analyze('e1', {}); assert.ok(r.id); assert.strictEqual(r.evolutionId, 'e1');
    });

    it('analyze throws for null evolutionId', function() {
      const m = new SecurityAnalyzer(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new SecurityAnalyzer(); const r = m.analyze('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new SecurityAnalyzer(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new SecurityAnalyzer(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new SecurityAnalyzer(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new SecurityAnalyzer(); m.analyze('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('CostAnalyzer', function() {
    const { CostAnalyzer } = require('../lib/evolution/costAnalyzer');

    it('should create with empty state', function() {
      const m = new CostAnalyzer(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new CostAnalyzer(); const r = m.analyze('e1', {}); assert.ok(r.id); assert.strictEqual(r.evolutionId, 'e1');
    });

    it('analyze throws for null evolutionId', function() {
      const m = new CostAnalyzer(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new CostAnalyzer(); const r = m.analyze('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new CostAnalyzer(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new CostAnalyzer(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new CostAnalyzer(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new CostAnalyzer(); m.analyze('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('MaintainabilityAnalyzer', function() {
    const { MaintainabilityAnalyzer } = require('../lib/evolution/maintainabilityAnalyzer');

    it('should create with empty state', function() {
      const m = new MaintainabilityAnalyzer(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new MaintainabilityAnalyzer(); const r = m.analyze('e1', {}); assert.ok(r.id); assert.strictEqual(r.evolutionId, 'e1');
    });

    it('analyze throws for null evolutionId', function() {
      const m = new MaintainabilityAnalyzer(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new MaintainabilityAnalyzer(); const r = m.analyze('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new MaintainabilityAnalyzer(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new MaintainabilityAnalyzer(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new MaintainabilityAnalyzer(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new MaintainabilityAnalyzer(); m.analyze('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('TechnicalDebtAnalyzer', function() {
    const { TechnicalDebtAnalyzer } = require('../lib/evolution/technicalDebtAnalyzer');

    it('should create with empty state', function() {
      const m = new TechnicalDebtAnalyzer(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new TechnicalDebtAnalyzer(); const r = m.analyze('e1', []); assert.ok(r.id);
    });

    it('analyze throws for null evolutionId', function() {
      const m = new TechnicalDebtAnalyzer(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('analyze computes total debt', function() {
      const m = new TechnicalDebtAnalyzer(); const r = m.analyze('e1', [{ estimatedHours: 10 }, { estimatedHours: 20 }]); assert.strictEqual(r.totalDebt, 30);
    });

    it('analyze counts critical items', function() {
      const m = new TechnicalDebtAnalyzer(); const r = m.analyze('e1', [{ estimatedHours: 50, severity: 'critical' }]); assert.strictEqual(r.criticalCount, 1);
    });

    it('get returns by id', function() {
      const m = new TechnicalDebtAnalyzer(); const r = m.analyze('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('clear resets', function() {
      const m = new TechnicalDebtAnalyzer(); m.analyze('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('ScalabilityAnalyzer', function() {
    const { ScalabilityAnalyzer } = require('../lib/evolution/scalabilityAnalyzer');

    it('should create with empty state', function() {
      const m = new ScalabilityAnalyzer(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new ScalabilityAnalyzer(); const r = m.analyze('e1', {}); assert.ok(r.id); assert.strictEqual(r.evolutionId, 'e1');
    });

    it('analyze throws for null evolutionId', function() {
      const m = new ScalabilityAnalyzer(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new ScalabilityAnalyzer(); const r = m.analyze('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new ScalabilityAnalyzer(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new ScalabilityAnalyzer(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new ScalabilityAnalyzer(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new ScalabilityAnalyzer(); m.analyze('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('AvailabilityAnalyzer', function() {
    const { AvailabilityAnalyzer } = require('../lib/evolution/availabilityAnalyzer');

    it('should create with empty state', function() {
      const m = new AvailabilityAnalyzer(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new AvailabilityAnalyzer(); const r = m.analyze('e1', {}); assert.ok(r.id); assert.strictEqual(r.evolutionId, 'e1');
    });

    it('analyze throws for null evolutionId', function() {
      const m = new AvailabilityAnalyzer(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new AvailabilityAnalyzer(); const r = m.analyze('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for null', function() {
      const m = new AvailabilityAnalyzer(); assert.strictEqual(m.get(null), null);
    });

    it('get returns null for missing', function() {
      const m = new AvailabilityAnalyzer(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new AvailabilityAnalyzer(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new AvailabilityAnalyzer(); m.analyze('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('ImprovementPlanner', function() {
    const { ImprovementPlanner } = require('../lib/evolution/improvementPlanner');

    it('should create with empty state', function() {
      const m = new ImprovementPlanner(); assert.ok(m);
    });

    it('create stores plan', function() {
      const m = new ImprovementPlanner(); const r = m.create('e1', [{name: 'fix'}]); assert.ok(r.id);
    });

    it('create throws for null evolutionId', function() {
      const m = new ImprovementPlanner(); assert.throws(() => m.create(null, []), /evolutionId/);
    });

    it('create throws for non-array', function() {
      const m = new ImprovementPlanner(); assert.throws(() => m.create('e1', {}), /array/);
    });

    it('get returns by id', function() {
      const m = new ImprovementPlanner(); const r = m.create('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new ImprovementPlanner(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns all', function() {
      const m = new ImprovementPlanner(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list().length, 2);
    });

    it('list filters by evolutionId', function() {
      const m = new ImprovementPlanner(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list('e1').length, 1);
    });

    it('updateStatus changes status', function() {
      const m = new ImprovementPlanner(); const r = m.create('e1', []); m.updateStatus(r.id, 'active'); assert.strictEqual(m.get(r.id).status, 'active');
    });

    it('updateStatus returns null for missing', function() {
      const m = new ImprovementPlanner(); assert.strictEqual(m.updateStatus('none', 'x'), null);
    });

    it('clear resets', function() {
      const m = new ImprovementPlanner(); m.create('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('MigrationPlanner', function() {
    const { MigrationPlanner } = require('../lib/evolution/migrationPlanner');

    it('should create with empty state', function() {
      const m = new MigrationPlanner(); assert.ok(m);
    });

    it('create stores plan', function() {
      const m = new MigrationPlanner(); const r = m.create('e1', [{name: 'fix'}]); assert.ok(r.id);
    });

    it('create throws for null evolutionId', function() {
      const m = new MigrationPlanner(); assert.throws(() => m.create(null, []), /evolutionId/);
    });

    it('create throws for non-array', function() {
      const m = new MigrationPlanner(); assert.throws(() => m.create('e1', {}), /array/);
    });

    it('get returns by id', function() {
      const m = new MigrationPlanner(); const r = m.create('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new MigrationPlanner(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns all', function() {
      const m = new MigrationPlanner(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list().length, 2);
    });

    it('list filters by evolutionId', function() {
      const m = new MigrationPlanner(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list('e1').length, 1);
    });

    it('updateStatus changes status', function() {
      const m = new MigrationPlanner(); const r = m.create('e1', []); m.updateStatus(r.id, 'active'); assert.strictEqual(m.get(r.id).status, 'active');
    });

    it('updateStatus returns null for missing', function() {
      const m = new MigrationPlanner(); assert.strictEqual(m.updateStatus('none', 'x'), null);
    });

    it('clear resets', function() {
      const m = new MigrationPlanner(); m.create('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('RefactorPlanner', function() {
    const { RefactorPlanner } = require('../lib/evolution/refactorPlanner');

    it('should create with empty state', function() {
      const m = new RefactorPlanner(); assert.ok(m);
    });

    it('create stores plan', function() {
      const m = new RefactorPlanner(); const r = m.create('e1', [{name: 'fix'}]); assert.ok(r.id);
    });

    it('create throws for null evolutionId', function() {
      const m = new RefactorPlanner(); assert.throws(() => m.create(null, []), /evolutionId/);
    });

    it('create throws for non-array', function() {
      const m = new RefactorPlanner(); assert.throws(() => m.create('e1', {}), /array/);
    });

    it('get returns by id', function() {
      const m = new RefactorPlanner(); const r = m.create('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new RefactorPlanner(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns all', function() {
      const m = new RefactorPlanner(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list().length, 2);
    });

    it('list filters by evolutionId', function() {
      const m = new RefactorPlanner(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list('e1').length, 1);
    });

    it('updateStatus changes status', function() {
      const m = new RefactorPlanner(); const r = m.create('e1', []); m.updateStatus(r.id, 'active'); assert.strictEqual(m.get(r.id).status, 'active');
    });

    it('updateStatus returns null for missing', function() {
      const m = new RefactorPlanner(); assert.strictEqual(m.updateStatus('none', 'x'), null);
    });

    it('clear resets', function() {
      const m = new RefactorPlanner(); m.create('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('OptimizationPlanner', function() {
    const { OptimizationPlanner } = require('../lib/evolution/optimizationPlanner');

    it('should create with empty state', function() {
      const m = new OptimizationPlanner(); assert.ok(m);
    });

    it('create stores plan', function() {
      const m = new OptimizationPlanner(); const r = m.create('e1', [{name: 'fix'}]); assert.ok(r.id);
    });

    it('create throws for null evolutionId', function() {
      const m = new OptimizationPlanner(); assert.throws(() => m.create(null, []), /evolutionId/);
    });

    it('create throws for non-array', function() {
      const m = new OptimizationPlanner(); assert.throws(() => m.create('e1', {}), /array/);
    });

    it('get returns by id', function() {
      const m = new OptimizationPlanner(); const r = m.create('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new OptimizationPlanner(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns all', function() {
      const m = new OptimizationPlanner(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list().length, 2);
    });

    it('list filters by evolutionId', function() {
      const m = new OptimizationPlanner(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list('e1').length, 1);
    });

    it('updateStatus changes status', function() {
      const m = new OptimizationPlanner(); const r = m.create('e1', []); m.updateStatus(r.id, 'active'); assert.strictEqual(m.get(r.id).status, 'active');
    });

    it('updateStatus returns null for missing', function() {
      const m = new OptimizationPlanner(); assert.strictEqual(m.updateStatus('none', 'x'), null);
    });

    it('clear resets', function() {
      const m = new OptimizationPlanner(); m.create('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('UpgradePlanner', function() {
    const { UpgradePlanner } = require('../lib/evolution/upgradePlanner');

    it('should create with empty state', function() {
      const m = new UpgradePlanner(); assert.ok(m);
    });

    it('create stores plan', function() {
      const m = new UpgradePlanner(); const r = m.create('e1', [{name: 'fix'}]); assert.ok(r.id);
    });

    it('create throws for null evolutionId', function() {
      const m = new UpgradePlanner(); assert.throws(() => m.create(null, []), /evolutionId/);
    });

    it('create throws for non-array', function() {
      const m = new UpgradePlanner(); assert.throws(() => m.create('e1', {}), /array/);
    });

    it('get returns by id', function() {
      const m = new UpgradePlanner(); const r = m.create('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new UpgradePlanner(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns all', function() {
      const m = new UpgradePlanner(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list().length, 2);
    });

    it('list filters by evolutionId', function() {
      const m = new UpgradePlanner(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list('e1').length, 1);
    });

    it('updateStatus changes status', function() {
      const m = new UpgradePlanner(); const r = m.create('e1', []); m.updateStatus(r.id, 'active'); assert.strictEqual(m.get(r.id).status, 'active');
    });

    it('updateStatus returns null for missing', function() {
      const m = new UpgradePlanner(); assert.strictEqual(m.updateStatus('none', 'x'), null);
    });

    it('clear resets', function() {
      const m = new UpgradePlanner(); m.create('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('ModuleSplit', function() {
    const { ModuleSplit } = require('../lib/evolution/moduleSplit');

    it('should create with empty state', function() {
      const m = new ModuleSplit(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new ModuleSplit(); const r = m.analyze('e1', []); assert.ok(r.id);
    });

    it('analyze throws for null evolutionId', function() {
      const m = new ModuleSplit(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new ModuleSplit(); const r = m.analyze('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new ModuleSplit(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new ModuleSplit(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new ModuleSplit(); m.analyze('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('ModuleMerge', function() {
    const { ModuleMerge } = require('../lib/evolution/moduleMerge');

    it('should create with empty state', function() {
      const m = new ModuleMerge(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new ModuleMerge(); const r = m.analyze('e1', []); assert.ok(r.id);
    });

    it('analyze throws for null evolutionId', function() {
      const m = new ModuleMerge(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new ModuleMerge(); const r = m.analyze('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new ModuleMerge(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new ModuleMerge(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new ModuleMerge(); m.analyze('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('DependencyCleanup', function() {
    const { DependencyCleanup } = require('../lib/evolution/dependencyCleanup');

    it('should create with empty state', function() {
      const m = new DependencyCleanup(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new DependencyCleanup(); const r = m.analyze('e1', []); assert.ok(r.id);
    });

    it('analyze throws for null evolutionId', function() {
      const m = new DependencyCleanup(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new DependencyCleanup(); const r = m.analyze('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new DependencyCleanup(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new DependencyCleanup(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new DependencyCleanup(); m.analyze('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('ArchitectureRefactor', function() {
    const { ArchitectureRefactor } = require('../lib/evolution/architectureRefactor');

    it('should create with empty state', function() {
      const m = new ArchitectureRefactor(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new ArchitectureRefactor(); const r = m.analyze('e1', []); assert.ok(r.id);
    });

    it('analyze throws for null evolutionId', function() {
      const m = new ArchitectureRefactor(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new ArchitectureRefactor(); const r = m.analyze('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new ArchitectureRefactor(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new ArchitectureRefactor(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new ArchitectureRefactor(); m.analyze('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('WorkflowOptimization', function() {
    const { WorkflowOptimization } = require('../lib/evolution/workflowOptimization');

    it('should create with empty state', function() {
      const m = new WorkflowOptimization(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new WorkflowOptimization(); const r = m.analyze('e1', []); assert.ok(r.id);
    });

    it('analyze throws for null evolutionId', function() {
      const m = new WorkflowOptimization(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new WorkflowOptimization(); const r = m.analyze('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new WorkflowOptimization(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new WorkflowOptimization(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new WorkflowOptimization(); m.analyze('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('AgentOptimization', function() {
    const { AgentOptimization } = require('../lib/evolution/agentOptimization');

    it('should create with empty state', function() {
      const m = new AgentOptimization(); assert.ok(m);
    });

    it('analyze creates analysis', function() {
      const m = new AgentOptimization(); const r = m.analyze('e1', []); assert.ok(r.id);
    });

    it('analyze throws for null evolutionId', function() {
      const m = new AgentOptimization(); assert.throws(() => m.analyze(null), /evolutionId/);
    });

    it('get returns by id', function() {
      const m = new AgentOptimization(); const r = m.analyze('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new AgentOptimization(); assert.strictEqual(m.get('none'), null);
    });

    it('list returns array', function() {
      const m = new AgentOptimization(); assert.ok(Array.isArray(m.list()));
    });

    it('clear resets', function() {
      const m = new AgentOptimization(); m.analyze('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('DebtRegistry', function() {
    const { DebtRegistry } = require('../lib/evolution/debtRegistry');

    it('should create with empty state', function() {
      const m = new DebtRegistry(); assert.ok(m);
    });

    it('register stores item', function() {
      const m = new DebtRegistry(); const r = m.register('e1', { type: 'code_quality' }); assert.ok(r.id);
    });

    it('register throws for missing args', function() {
      const m = new DebtRegistry(); assert.throws(() => m.register(null), /evolutionId/); assert.throws(() => m.register('e1'), /required/);
    });

    it('get returns by id', function() {
      const m = new DebtRegistry(); const r = m.register('e1', { type: 'x' }); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new DebtRegistry(); assert.strictEqual(m.get('none'), null);
    });

    it('list filters by evolutionId', function() {
      const m = new DebtRegistry(); m.register('e1', { type: 'x' }); m.register('e2', { type: 'y' }); assert.strictEqual(m.list('e1').length, 1);
    });

    it('updateStatus changes status', function() {
      const m = new DebtRegistry(); const r = m.register('e1', { type: 'x' }); m.updateStatus(r.id, 'resolved'); assert.strictEqual(m.get(r.id).status, 'resolved');
    });

    it('remove returns true', function() {
      const m = new DebtRegistry(); const r = m.register('e1', { type: 'x' }); assert.strictEqual(m.remove(r.id), true);
    });

    it('clear resets', function() {
      const m = new DebtRegistry(); m.register('e1', { type: 'x' }); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('DebtPrioritizer', function() {
    const { DebtPrioritizer } = require('../lib/evolution/debtPrioritizer');

    it('should create with empty state', function() {
      const m = new DebtPrioritizer(); assert.ok(m);
    });

    it('prioritize sorts by score', function() {
      const m = new DebtPrioritizer(); const r = m.prioritize([{ severity: 'critical', estimatedHours: 50 }, { severity: 'low', estimatedHours: 1 }]); assert.strictEqual(r.length, 2); assert.ok(r[0].score >= r[1].score);
    });

    it('prioritize throws for non-array', function() {
      const m = new DebtPrioritizer(); assert.throws(() => m.prioritize(null), /array/);
    });

    it('prioritize handles empty array', function() {
      const m = new DebtPrioritizer(); assert.strictEqual(m.prioritize([]).length, 0);
    });

    it('set/get roundtrip', function() {
      const m = new DebtPrioritizer(); m.set('k', 'high'); assert.strictEqual(m.get('k'), 'high');
    });

    it('get returns null for missing', function() {
      const m = new DebtPrioritizer(); assert.strictEqual(m.get('none'), null);
    });

    it('clear resets', function() {
      const m = new DebtPrioritizer(); m.set('k', 'high'); m.clear(); assert.strictEqual(m.get('k'), null);
    });

  });

  describe('DebtScoring', function() {
    const { DebtScoring } = require('../lib/evolution/debtScoring');

    it('should create with empty state', function() {
      const m = new DebtScoring(); assert.ok(m);
    });

    it('score returns result', function() {
      const m = new DebtScoring(); const r = m.score('e1', []); assert.ok(r.id); assert.ok(r.score >= 0);
    });

    it('score throws for null evolutionId', function() {
      const m = new DebtScoring(); assert.throws(() => m.score(null), /evolutionId/);
    });

    it('score with critical items reduces score', function() {
      const m = new DebtScoring(); const r = m.score('e1', [{ severity: 'critical', estimatedHours: 100 }]); assert.ok(r.score < 100);
    });

    it('score health good for empty', function() {
      const m = new DebtScoring(); const r = m.score('e1', []); assert.strictEqual(r.health, 'good');
    });

    it('get returns by id', function() {
      const m = new DebtScoring(); const r = m.score('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('clear resets', function() {
      const m = new DebtScoring(); m.score('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('DebtReporter', function() {
    const { DebtReporter } = require('../lib/evolution/debtReporter');

    it('should create with empty state', function() {
      const m = new DebtReporter(); assert.ok(m);
    });

    it('generate creates report', function() {
      const m = new DebtReporter(); const r = m.generate('e1', { items: [] }); assert.ok(r.id);
    });

    it('generate throws for null evolutionId', function() {
      const m = new DebtReporter(); assert.throws(() => m.generate(null), /evolutionId/);
    });

    it('generate categorizes items', function() {
      const m = new DebtReporter(); const r = m.generate('e1', { items: [{ category: 'code', estimatedHours: 5 }, { category: 'code', estimatedHours: 3 }] }); assert.strictEqual(r.byCategory.code.count, 2);
    });

    it('get returns by id', function() {
      const m = new DebtReporter(); const r = m.generate('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('clear resets', function() {
      const m = new DebtReporter(); m.generate('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('EvolutionPolicies', function() {
    const { EvolutionPolicies } = require('../lib/evolution/evolutionPolicies');

    it('should create with empty state', function() {
      const m = new EvolutionPolicies(); assert.ok(m);
    });

    it('define stores policy', function() {
      const m = new EvolutionPolicies(); const r = m.define('p1', { rules: [] }); assert.strictEqual(r.id, 'p1');
    });

    it('define throws for missing args', function() {
      const m = new EvolutionPolicies(); assert.throws(() => m.define(null, {}), /id/);
    });

    it('get returns by id', function() {
      const m = new EvolutionPolicies(); m.define('p1', {}); assert.ok(m.get('p1'));
    });

    it('get returns null for missing', function() {
      const m = new EvolutionPolicies(); assert.strictEqual(m.get('none'), null);
    });

    it('enable/disable toggle', function() {
      const m = new EvolutionPolicies(); m.define('p1', {}); m.disable('p1'); assert.strictEqual(m.get('p1').enabled, false); m.enable('p1'); assert.strictEqual(m.get('p1').enabled, true);
    });

    it('remove returns true', function() {
      const m = new EvolutionPolicies(); m.define('p1', {}); assert.strictEqual(m.remove('p1'), true);
    });

    it('clear resets', function() {
      const m = new EvolutionPolicies(); m.define('p1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('EvolutionConstraints', function() {
    const { EvolutionConstraints } = require('../lib/evolution/evolutionConstraints');

    it('should create with empty state', function() {
      const m = new EvolutionConstraints(); assert.ok(m);
    });

    it('add stores constraint', function() {
      const m = new EvolutionConstraints(); const r = m.add('e1', { type: 'maxHours', value: 100 }); assert.ok(r.createdAt);
    });

    it('add throws for missing args', function() {
      const m = new EvolutionConstraints(); assert.throws(() => m.add(null), /id/);
    });

    it('get returns constraints', function() {
      const m = new EvolutionConstraints(); m.add('e1', { type: 'x', value: 1 }); assert.strictEqual(m.get('e1').length, 1);
    });

    it('get returns null for missing', function() {
      const m = new EvolutionConstraints(); assert.strictEqual(m.get('none'), null);
    });

    it('check passes with no constraints', function() {
      const m = new EvolutionConstraints(); assert.strictEqual(m.check('e1', {}).valid, true);
    });

    it('check detects violations', function() {
      const m = new EvolutionConstraints(); m.add('e1', { type: 'maxHours', value: 10 }); assert.strictEqual(m.check('e1', { estimatedHours: 20 }).valid, false);
    });

    it('remove returns true', function() {
      const m = new EvolutionConstraints(); m.add('e1', { type: 'x', value: 1 }); assert.strictEqual(m.remove('e1', 0), true);
    });

    it('clear resets', function() {
      const m = new EvolutionConstraints(); m.add('e1', { type: 'x', value: 1 }); m.clear(); assert.strictEqual(m.get('e1'), null);
    });

  });

  describe('EvolutionSimulation', function() {
    const { EvolutionSimulation } = require('../lib/evolution/evolutionSimulation');

    it('should create with empty state', function() {
      const m = new EvolutionSimulation(); assert.ok(m);
    });

    it('simulate creates result', function() {
      const m = new EvolutionSimulation(); const r = m.simulate('e1', { actions: [] }); assert.ok(r.id);
    });

    it('simulate throws for null evolutionId', function() {
      const m = new EvolutionSimulation(); assert.throws(() => m.simulate(null), /evolutionId/);
    });

    it('simulate computes risk level', function() {
      const m = new EvolutionSimulation(); const r = m.simulate('e1', { actions: [{ estimatedHours: 5 }] }); assert.ok(r.riskLevel);
    });

    it('simulate computes success probability', function() {
      const m = new EvolutionSimulation(); const r = m.simulate('e1', { actions: [] }); assert.ok(r.successProbability > 0);
    });

    it('get returns by id', function() {
      const m = new EvolutionSimulation(); const r = m.simulate('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('clear resets', function() {
      const m = new EvolutionSimulation(); m.simulate('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('EvolutionValidator', function() {
    const { EvolutionValidator } = require('../lib/evolution/evolutionValidator');

    it('should create with empty state', function() {
      const m = new EvolutionValidator(); assert.ok(m);
    });

    it('validate validates plan', function() {
      const m = new EvolutionValidator(); const r = m.validate('e1', { type: 'refactor', estimatedHours: 10 }); assert.ok(r.id);
    });

    it('validate throws for null evolutionId', function() {
      const m = new EvolutionValidator(); assert.throws(() => m.validate(null), /evolutionId/);
    });

    it('validate detects missing plan', function() {
      const m = new EvolutionValidator(); const r = m.validate('e1', null); assert.strictEqual(r.valid, false);
    });

    it('validate warns for large plan', function() {
      const m = new EvolutionValidator(); const r = m.validate('e1', { type: 'refactor', estimatedHours: 1500 }); assert.ok(r.warnings.length > 0);
    });

    it('get returns by id', function() {
      const m = new EvolutionValidator(); const r = m.validate('e1', { type: 'x' }); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('clear resets', function() {
      const m = new EvolutionValidator(); m.validate('e1', { type: 'x' }); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('RoadmapBuilder', function() {
    const { RoadmapBuilder } = require('../lib/evolution/roadmapBuilder');

    it('should create with empty state', function() {
      const m = new RoadmapBuilder(); assert.ok(m);
    });

    it('build creates roadmap', function() {
      const m = new RoadmapBuilder(); const r = m.build('e1', [{ name: 'phase1', estimatedHours: 10 }]); assert.ok(r.id);
    });

    it('build throws for null evolutionId', function() {
      const m = new RoadmapBuilder(); assert.throws(() => m.build(null, []), /evolutionId/);
    });

    it('build throws for non-array', function() {
      const m = new RoadmapBuilder(); assert.throws(() => m.build('e1', {}), /array/);
    });

    it('get returns by id', function() {
      const m = new RoadmapBuilder(); const r = m.build('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('updateStatus changes status', function() {
      const m = new RoadmapBuilder(); const r = m.build('e1', []); m.updateStatus(r.id, 'active'); assert.strictEqual(m.get(r.id).status, 'active');
    });

    it('list returns all', function() {
      const m = new RoadmapBuilder(); m.build('e1', []); m.build('e2', []); assert.strictEqual(m.list().length, 2);
    });

    it('clear resets', function() {
      const m = new RoadmapBuilder(); m.build('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('ReleaseRecommendations', function() {
    const { ReleaseRecommendations } = require('../lib/evolution/releaseRecommendations');

    it('should create with empty state', function() {
      const m = new ReleaseRecommendations(); assert.ok(m);
    });

    it('generate creates recommendations', function() {
      const m = new ReleaseRecommendations(); const r = m.generate('e1', {}); assert.ok(r.id);
    });

    it('generate throws for null evolutionId', function() {
      const m = new ReleaseRecommendations(); assert.throws(() => m.generate(null), /evolutionId/);
    });

    it('generate with critical debt', function() {
      const m = new ReleaseRecommendations(); const r = m.generate('e1', { criticalDebt: 3 }); assert.ok(r.recommendations.length > 0);
    });

    it('generate with security findings', function() {
      const m = new ReleaseRecommendations(); const r = m.generate('e1', { securityFindings: 2 }); assert.ok(r.recommendations.some(x => x.type === 'security_fix'));
    });

    it('get returns by id', function() {
      const m = new ReleaseRecommendations(); const r = m.generate('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('clear resets', function() {
      const m = new ReleaseRecommendations(); m.generate('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  describe('ArchitectureTimeline', function() {
    const { ArchitectureTimeline } = require('../lib/evolution/architectureTimeline');

    it('should create with empty state', function() {
      const m = new ArchitectureTimeline(); assert.ok(m);
    });

    it('create stores timeline', function() {
      const m = new ArchitectureTimeline(); const r = m.create('e1', [{ order: 1, name: 'm1' }]); assert.ok(r.id);
    });

    it('create throws for null evolutionId', function() {
      const m = new ArchitectureTimeline(); assert.throws(() => m.create(null, []), /evolutionId/);
    });

    it('create throws for non-array', function() {
      const m = new ArchitectureTimeline(); assert.throws(() => m.create('e1', {}), /array/);
    });

    it('create sorts by order', function() {
      const m = new ArchitectureTimeline(); const r = m.create('e1', [{ order: 2, name: 'b' }, { order: 1, name: 'a' }]); assert.strictEqual(r.milestones[0].name, 'a');
    });

    it('get returns by id', function() {
      const m = new ArchitectureTimeline(); const r = m.create('e1', []); assert.strictEqual(m.get(r.id).id, r.id);
    });

    it('get returns null for missing', function() {
      const m = new ArchitectureTimeline(); assert.strictEqual(m.get('none'), null);
    });

    it('updateMilestone modifies milestone', function() {
      const m = new ArchitectureTimeline(); const r = m.create('e1', [{ order: 1, name: 'm1' }]); m.updateMilestone(r.id, 0, { name: 'updated' }); assert.strictEqual(m.get(r.id).milestones[0].name, 'updated');
    });

    it('clear resets', function() {
      const m = new ArchitectureTimeline(); m.create('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);
    });

  });

  /* ─── Plugin SDK Evolution Modules ─── */
  describe('EvolutionAnalyzer (SDK)', function() {
    const { EvolutionAnalyzer } = require('../lib/plugin-sdk/EvolutionAnalyzer');
    it('constructor sets name', function() { const e = new EvolutionAnalyzer('test'); assert.strictEqual(e.name, 'test'); });
    it('registerAnalyzer chains', function() { const e = new EvolutionAnalyzer(); const ret = e.registerAnalyzer(() => {}); assert.strictEqual(ret, e); });
    it('analyze returns results', function() { const e = new EvolutionAnalyzer(); e.registerAnalyzer((id) => ({ id })); const r = e.analyze('e1', {}); assert.strictEqual(r.length, 1); });
    it('analyze returns null for null', function() { const e = new EvolutionAnalyzer(); assert.strictEqual(e.analyze(null), null); });
    it('registerAnalyzer throws for non-function', function() { const e = new EvolutionAnalyzer(); assert.throws(() => e.registerAnalyzer(null), /function/); });
  });

  describe('OptimizationPlanner (SDK)', function() {
    const { OptimizationPlanner } = require('../lib/plugin-sdk/OptimizationPlanner');
    it('constructor sets name', function() { const o = new OptimizationPlanner('test'); assert.strictEqual(o.name, 'test'); });
    it('registerPlanner chains', function() { const o = new OptimizationPlanner(); const ret = o.registerPlanner(() => {}); assert.strictEqual(ret, o); });
    it('plan returns results', function() { const o = new OptimizationPlanner(); o.registerPlanner((id) => ({ id })); const r = o.plan('e1', {}); assert.strictEqual(r.length, 1); });
    it('plan returns null for null', function() { const o = new OptimizationPlanner(); assert.strictEqual(o.plan(null), null); });
  });

  describe('RefactorStrategy (SDK)', function() {
    const { RefactorStrategy } = require('../lib/plugin-sdk/RefactorStrategy');
    it('constructor sets name', function() { const r = new RefactorStrategy('test'); assert.strictEqual(r.name, 'test'); });
    it('addStrategy chains', function() { const r = new RefactorStrategy(); const ret = r.addStrategy('s1', () => {}); assert.strictEqual(ret, r); });
    it('execute runs strategies', function() { const r = new RefactorStrategy(); r.addStrategy('s1', () => 'result'); const res = r.execute('e1', {}); assert.strictEqual(res.length, 1); assert.strictEqual(res[0].strategy, 's1'); });
    it('execute returns empty for null', function() { const r = new RefactorStrategy(); assert.strictEqual(r.execute(null, {}).length, 0); });
    it('getResults returns results', function() { const r = new RefactorStrategy(); r.addStrategy('s1', () => 'x'); r.execute('e1', {}); assert.strictEqual(r.getResults().length, 1); });
    it('addStrategy throws for bad args', function() { const r = new RefactorStrategy(); assert.throws(() => r.addStrategy(null, {}), /function/); });
  });

  describe('DebtAnalyzer (SDK)', function() {
    const { DebtAnalyzer } = require('../lib/plugin-sdk/DebtAnalyzer');
    it('constructor sets name', function() { const d = new DebtAnalyzer('test'); assert.strictEqual(d.name, 'test'); });
    it('registerMetric chains', function() { const d = new DebtAnalyzer(); const ret = d.registerMetric('m1', () => {}); assert.strictEqual(ret, d); });
    it('analyze returns metrics', function() { const d = new DebtAnalyzer(); d.registerMetric('m1', () => 5); const r = d.analyze('e1', []); assert.strictEqual(r.length, 1); assert.strictEqual(r[0].value, 5); });
    it('analyze returns null for null', function() { const d = new DebtAnalyzer(); assert.strictEqual(d.analyze(null), null); });
  });

  describe('RoadmapGenerator (SDK)', function() {
    const { RoadmapGenerator } = require('../lib/plugin-sdk/RoadmapGenerator');
    it('constructor sets name', function() { const r = new RoadmapGenerator('test'); assert.strictEqual(r.name, 'test'); });
    it('registerGenerator chains', function() { const r = new RoadmapGenerator(); const ret = r.registerGenerator(() => {}); assert.strictEqual(ret, r); });
    it('generate returns results', function() { const r = new RoadmapGenerator(); r.registerGenerator((id) => ({ id })); const res = r.generate('e1', {}); assert.strictEqual(res.length, 1); });
    it('generate returns empty for null', function() { const r = new RoadmapGenerator(); assert.strictEqual(r.generate(null, {}).length, 0); });
  });

  describe('Plugin Evolution Methods', function() {
    const { Plugin } = require('../lib/plugin-sdk/Plugin');
    it('registerEvolutionAnalyzer', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); const a = p.registerEvolutionAnalyzer('ea1'); assert.ok(a); assert.strictEqual(p.getEvolutionProviders().analyzers.length, 1); });
    it('registerOptimizationPlanner', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); const o = p.registerOptimizationPlanner('op1'); assert.ok(o); assert.strictEqual(p.getEvolutionProviders().planners.length, 1); });
    it('registerRefactorStrategy', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); const r = p.registerRefactorStrategy('rs1'); assert.ok(r); assert.strictEqual(p.getEvolutionProviders().strategies.length, 1); });
    it('registerDebtAnalyzer', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); const d = p.registerDebtAnalyzer('da1'); assert.ok(d); assert.strictEqual(p.getEvolutionProviders().debtAnalyzers.length, 1); });
    it('registerRoadmapGenerator', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); const r = p.registerRoadmapGenerator('rg1'); assert.ok(r); assert.strictEqual(p.getEvolutionProviders().roadmaps.length, 1); });
    it('getEvolutionProviders returns empty by default', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); assert.deepStrictEqual(p.getEvolutionProviders(), {}); });
  });

  describe('getDefaultEvolutionManager / index.js', function() {
    const evo = require('../lib/evolution/index');
    it('getDefaultEvolutionManager returns EvolutionManager', function() { const m = evo.getDefaultEvolutionManager(); assert.ok(m instanceof evo.EvolutionManager); });
    it('EvolutionManager exported', function() { assert.ok(evo.EvolutionManager); });
    it('SolutionEvolution exported', function() { assert.ok(evo.SolutionEvolution); });
    it('EvolutionPlanner exported', function() { assert.ok(evo.EvolutionPlanner); });
    it('EvolutionEngine exported', function() { assert.ok(evo.EvolutionEngine); });
    it('EvolutionEvents exported', function() { assert.ok(evo.EvolutionEvents); });
    it('ArchitectureAnalyzer exported', function() { assert.ok(evo.ArchitectureAnalyzer); });
    it('DependencyAnalyzer exported', function() { assert.ok(evo.DependencyAnalyzer); });
    it('PerformanceAnalyzer exported', function() { assert.ok(evo.PerformanceAnalyzer); });
    it('DebtRegistry exported', function() { assert.ok(evo.DebtRegistry); });
    it('RoadmapBuilder exported', function() { assert.ok(evo.RoadmapBuilder); });
    it('EvolutionSimulation exported', function() { assert.ok(evo.EvolutionSimulation); });
  });

  describe('Evolution API Controller', function() {
    const { getController } = require('../lib/api/controllers/evolutionController');
    function mockReq(body, query) { return { body: body || {}, query: query || {} }; }
    function mockRes() { let jd = null; return { _json: () => jd, status(s) { return this; }, json(d) { jd = d; }, send() {} }; }

    it('getEvolution returns status', function() { const ctrl = getController(); const res = mockRes(); ctrl.getEvolution(mockReq(), res); assert.ok(res._json().success); });
    it('analyze with valid type', function() { const ctrl = getController(); const res = mockRes(); ctrl.analyze(mockReq({ evolutionId: 'e1', type: 'architecture', data: {} }), res); assert.ok(res._json().success); });
    it('analyze with unknown type returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.analyze(mockReq({ evolutionId: 'e1', type: 'unknown' }), res); assert.strictEqual(res._json().success, false); });
    it('analyze with missing fields returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.analyze(mockReq({}), res); assert.strictEqual(res._json().success, false); });
    it('plan with valid type', function() { const ctrl = getController(); const res = mockRes(); ctrl.plan(mockReq({ evolutionId: 'e1', type: 'improvement', actions: [] }), res); assert.ok(res._json().success); });
    it('plan with unknown type returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.plan(mockReq({ evolutionId: 'e1', type: 'unknown', actions: [] }), res); assert.strictEqual(res._json().success, false); });
    it('plan with missing actions returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.plan(mockReq({ evolutionId: 'e1', type: 'improvement' }), res); assert.strictEqual(res._json().success, false); });
    it('simulate with plan', function() { const ctrl = getController(); const res = mockRes(); ctrl.simulate(mockReq({ evolutionId: 'e1', plan: { actions: [] } }), res); assert.ok(res._json().success); });
    it('simulate with missing plan returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.simulate(mockReq({ evolutionId: 'e1' }), res); assert.strictEqual(res._json().success, false); });
    it('validate with plan', function() { const ctrl = getController(); const res = mockRes(); ctrl.validate(mockReq({ evolutionId: 'e1', plan: { type: 'refactor' } }), res); assert.ok(res._json().success); });
    it('validate with missing plan returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.validate(mockReq({ evolutionId: 'e1' }), res); assert.strictEqual(res._json().success, false); });
    it('exportEvolution with valid evolutionId', function() { const ctrl = getController(); const res = mockRes(); ctrl.exportEvolution(mockReq({ evolutionId: 'e1' }), res); assert.strictEqual(res._json().success, false); }); // missing evolution
    it('exportEvolution with missing id returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.exportEvolution(mockReq({}), res); assert.strictEqual(res._json().success, false); });
    it('getHistory returns history', function() { const ctrl = getController(); const res = mockRes(); ctrl.getHistory(mockReq({}), res); assert.ok(res._json().success); });
    it('getRoadmap returns roadmaps', function() { const ctrl = getController(); const res = mockRes(); ctrl.getRoadmap(mockReq(), res); assert.ok(res._json().success); });
    it('routes defined correctly', function() {
      const { registerEvolutionRoutes } = require('../lib/api/routes/evolutionRoutes');
      const Router = require('express').Router;
      const router = Router();
      assert.doesNotThrow(() => registerEvolutionRoutes(router, getController()));
    });
  });

});
