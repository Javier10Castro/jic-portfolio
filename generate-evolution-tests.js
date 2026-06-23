const fs = require('fs');

const modules = [
  // [category, className, filePath, methods]
  ['EvolutionManager', 'EvolutionManager', '../lib/evolution/evolutionManager', ['getStatus', 'clear', 'get solutionEvolution', 'get evolutionPlanner', 'get evolutionEngine', 'get evolutionStorage', 'get evolutionEvents', 'get evolutionMetrics', 'get evolutionReporter']],
  ['SolutionEvolution', 'SolutionEvolution', '../lib/evolution/solutionEvolution', ['create', 'get', 'list', 'update', 'remove', 'clear']],
  ['EvolutionPlanner', 'EvolutionPlanner', '../lib/evolution/evolutionPlanner', ['createPlan', 'get', 'list', 'updateStatus', 'clear']],
  ['EvolutionEngine', 'EvolutionEngine', '../lib/evolution/evolutionEngine', ['execute', 'get', 'list', 'completeStep', 'clear']],
  ['EvolutionStorage', 'EvolutionStorage', '../lib/evolution/evolutionStorage', ['set', 'get', 'has', 'delete', 'getAll', 'clear']],
  ['EvolutionEvents', 'EvolutionEvents', '../lib/evolution/evolutionEvents', ['on', 'off', 'emit', 'listEvents', 'clear']],
  ['EvolutionMetrics', 'EvolutionMetrics', '../lib/evolution/evolutionMetrics', ['record', 'query', 'aggregate', 'getMetricNames', 'clear']],
  ['EvolutionReporter', 'EvolutionReporter', '../lib/evolution/evolutionReporter', ['generateReport', 'get', 'list', 'clear']],
  ['ArchitectureAnalyzer', 'ArchitectureAnalyzer', '../lib/evolution/architectureAnalyzer', ['analyze', 'get', 'list', 'clear']],
  ['DependencyAnalyzer', 'DependencyAnalyzer', '../lib/evolution/dependencyAnalyzer', ['analyze', 'get', 'list', 'clear']],
  ['ComplexityAnalyzer', 'ComplexityAnalyzer', '../lib/evolution/complexityAnalyzer', ['analyze', 'get', 'list', 'clear']],
  ['PerformanceAnalyzer', 'PerformanceAnalyzer', '../lib/evolution/performanceAnalyzer', ['analyze', 'get', 'list', 'clear']],
  ['SecurityAnalyzer', 'SecurityAnalyzer', '../lib/evolution/securityAnalyzer', ['analyze', 'get', 'list', 'clear']],
  ['CostAnalyzer', 'CostAnalyzer', '../lib/evolution/costAnalyzer', ['analyze', 'get', 'list', 'clear']],
  ['MaintainabilityAnalyzer', 'MaintainabilityAnalyzer', '../lib/evolution/maintainabilityAnalyzer', ['analyze', 'get', 'list', 'clear']],
  ['TechnicalDebtAnalyzer', 'TechnicalDebtAnalyzer', '../lib/evolution/technicalDebtAnalyzer', ['analyze', 'get', 'list', 'clear']],
  ['ScalabilityAnalyzer', 'ScalabilityAnalyzer', '../lib/evolution/scalabilityAnalyzer', ['analyze', 'get', 'list', 'clear']],
  ['AvailabilityAnalyzer', 'AvailabilityAnalyzer', '../lib/evolution/availabilityAnalyzer', ['analyze', 'get', 'list', 'clear']],
  ['ImprovementPlanner', 'ImprovementPlanner', '../lib/evolution/improvementPlanner', ['create', 'get', 'list', 'updateStatus', 'clear']],
  ['MigrationPlanner', 'MigrationPlanner', '../lib/evolution/migrationPlanner', ['create', 'get', 'list', 'updateStatus', 'clear']],
  ['RefactorPlanner', 'RefactorPlanner', '../lib/evolution/refactorPlanner', ['create', 'get', 'list', 'updateStatus', 'clear']],
  ['OptimizationPlanner', 'OptimizationPlanner', '../lib/evolution/optimizationPlanner', ['create', 'get', 'list', 'updateStatus', 'clear']],
  ['UpgradePlanner', 'UpgradePlanner', '../lib/evolution/upgradePlanner', ['create', 'get', 'list', 'updateStatus', 'clear']],
  ['ModuleSplit', 'ModuleSplit', '../lib/evolution/moduleSplit', ['analyze', 'get', 'list', 'clear']],
  ['ModuleMerge', 'ModuleMerge', '../lib/evolution/moduleMerge', ['analyze', 'get', 'list', 'clear']],
  ['DependencyCleanup', 'DependencyCleanup', '../lib/evolution/dependencyCleanup', ['analyze', 'get', 'list', 'clear']],
  ['ArchitectureRefactor', 'ArchitectureRefactor', '../lib/evolution/architectureRefactor', ['analyze', 'get', 'list', 'clear']],
  ['WorkflowOptimization', 'WorkflowOptimization', '../lib/evolution/workflowOptimization', ['analyze', 'get', 'list', 'clear']],
  ['AgentOptimization', 'AgentOptimization', '../lib/evolution/agentOptimization', ['analyze', 'get', 'list', 'clear']],
  ['DebtRegistry', 'DebtRegistry', '../lib/evolution/debtRegistry', ['register', 'get', 'list', 'updateStatus', 'remove', 'clear']],
  ['DebtPrioritizer', 'DebtPrioritizer', '../lib/evolution/debtPrioritizer', ['prioritize', 'get', 'set', 'clear']],
  ['DebtScoring', 'DebtScoring', '../lib/evolution/debtScoring', ['score', 'get', 'list', 'clear']],
  ['DebtReporter', 'DebtReporter', '../lib/evolution/debtReporter', ['generate', 'get', 'list', 'clear']],
  ['EvolutionPolicies', 'EvolutionPolicies', '../lib/evolution/evolutionPolicies', ['define', 'get', 'list', 'enable', 'disable', 'remove', 'clear']],
  ['EvolutionConstraints', 'EvolutionConstraints', '../lib/evolution/evolutionConstraints', ['add', 'get', 'list', 'check', 'remove', 'clear']],
  ['EvolutionSimulation', 'EvolutionSimulation', '../lib/evolution/evolutionSimulation', ['simulate', 'get', 'list', 'clear']],
  ['EvolutionValidator', 'EvolutionValidator', '../lib/evolution/evolutionValidator', ['validate', 'get', 'list', 'clear']],
  ['RoadmapBuilder', 'RoadmapBuilder', '../lib/evolution/roadmapBuilder', ['build', 'get', 'list', 'updateStatus', 'clear']],
  ['ReleaseRecommendations', 'ReleaseRecommendations', '../lib/evolution/releaseRecommendations', ['generate', 'get', 'list', 'clear']],
  ['ArchitectureTimeline', 'ArchitectureTimeline', '../lib/evolution/architectureTimeline', ['create', 'get', 'list', 'updateMilestone', 'clear']],
];

let testCode = `const assert = require('assert');

describe('AI Evolution Platform — Phase 10.3.0', function() {

`;

for (const [name, cls, path, methods] of modules) {
  testCode += `  describe('${name}', function() {\n`;
  testCode += `    const { ${cls} } = require('${path}');\n\n`;

  // Constructor / empty state
  testCode += `    it('should create with empty state', function() {\n`;
  testCode += `      const m = new ${cls}(); assert.ok(m);\n    });\n\n`;

  // Methods
  if (name === 'EvolutionManager') {
    testCode += `    it('getStatus returns initialized', function() {\n`;
    testCode += `      const m = new ${cls}(); const s = m.getStatus(); assert.strictEqual(s.initialized, true);\n    });\n\n`;
    testCode += `    it('getStatus has 39 submodules', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(Object.keys(m.getStatus().submodules).length, 39);\n    });\n\n`;
    testCode += `    it('clear does not throw', function() {\n`;
    testCode += `      const m = new ${cls}(); m.clear(); assert.ok(true);\n    });\n\n`;
    testCode += `    it('reusable after clear', function() {\n`;
    testCode += `      const m = new ${cls}(); m.clear(); assert.ok(m.getStatus().initialized);\n    });\n\n`;
  } else if (name === 'SolutionEvolution') {
    testCode += `    it('create stores entry', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('s1', { type: 'refactor' }); assert.ok(r.id); assert.strictEqual(r.solutionId, 's1');\n    });\n\n`;
    testCode += `    it('create throws if no solutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.create(null, {}), /solutionId/);\n    });\n\n`;
    testCode += `    it('create throws if no plan', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.create('s1'), /plan/);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('s1', {}); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('get returns null for null id', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get(null), null);\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('list returns all', function() {\n`;
    testCode += `      const m = new ${cls}(); m.create('s1', {}); m.create('s2', {}); assert.strictEqual(m.list().length, 2);\n    });\n\n`;
    testCode += `    it('list filters by solutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); m.create('s1', {}); m.create('s2', {}); assert.strictEqual(m.list('s1').length, 1);\n    });\n\n`;
    testCode += `    it('update modifies allowed fields', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('s1', {}); m.update(r.id, { status: 'active' }); assert.strictEqual(m.get(r.id).status, 'active');\n    });\n\n`;
    testCode += `    it('update returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.update('none', {}), null);\n    });\n\n`;
    testCode += `    it('remove returns true', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('s1', {}); assert.strictEqual(m.remove(r.id), true);\n    });\n\n`;
    testCode += `    it('remove returns false for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.remove('none'), false);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.create('s1', {}); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'EvolutionPlanner') {
    testCode += `    it('createPlan stores plan', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.createPlan('e1', 'refactor', ['a1']); assert.ok(r.id); assert.strictEqual(r.type, 'refactor');\n    });\n\n`;
    testCode += `    it('createPlan throws for missing args', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.createPlan(null, 't', []), /evolutionId/);\n    });\n\n`;
    testCode += `    it('createPlan throws for non-array actions', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.createPlan('e1', 't', {}), /array/);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.createPlan('e1', 't', []); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('get returns null for null', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get(null), null);\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('list returns all', function() {\n`;
    testCode += `      const m = new ${cls}(); m.createPlan('e1', 't', []); m.createPlan('e2', 't', []); assert.strictEqual(m.list().length, 2);\n    });\n\n`;
    testCode += `    it('list filters by evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); m.createPlan('e1', 't', []); m.createPlan('e2', 't', []); assert.strictEqual(m.list('e1').length, 1);\n    });\n\n`;
    testCode += `    it('updateStatus changes status', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.createPlan('e1', 't', []); m.updateStatus(r.id, 'active'); assert.strictEqual(m.get(r.id).status, 'active');\n    });\n\n`;
    testCode += `    it('updateStatus returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.updateStatus('none', 'x'), null);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.createPlan('e1', 't', []); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'EvolutionEngine') {
    testCode += `    it('execute creates execution', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.execute('p1', {}); assert.ok(r.id); assert.strictEqual(r.status, 'running');\n    });\n\n`;
    testCode += `    it('execute throws for missing args', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.execute(null, {}), /planId/);\n    });\n\n`;
    testCode += `    it('execute throws for missing context', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.execute('p1'), /context/);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.execute('p1', {}); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('get returns null for null', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get(null), null);\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('list returns all', function() {\n`;
    testCode += `      const m = new ${cls}(); m.execute('p1', {}); m.execute('p2', {}); assert.strictEqual(m.list().length, 2);\n    });\n\n`;
    testCode += `    it('list filters by planId', function() {\n`;
    testCode += `      const m = new ${cls}(); m.execute('p1', {}); m.execute('p2', {}); assert.strictEqual(m.list('p1').length, 1);\n    });\n\n`;
    testCode += `    it('completeStep adds step', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.execute('p1', {}); m.completeStep(r.id, { status: 'completed' }); assert.strictEqual(m.get(r.id).steps.length, 1);\n    });\n\n`;
    testCode += `    it('completeStep returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.completeStep('none', {}), null);\n    });\n\n`;
    testCode += `    it('completeStep completes execution', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.execute('p1', {}); m.completeStep(r.id, { status: 'completed' }); assert.strictEqual(m.get(r.id).status, 'completed');\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.execute('p1', {}); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'EvolutionStorage') {
    testCode += `    it('set/get roundtrip', function() {\n`;
    testCode += `      const m = new ${cls}(); m.set('k', 'v'); assert.strictEqual(m.get('k'), 'v');\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('get returns null for null', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get(null), null);\n    });\n\n`;
    testCode += `    it('has returns correct', function() {\n`;
    testCode += `      const m = new ${cls}(); m.set('k', 'v'); assert.strictEqual(m.has('k'), true); assert.strictEqual(m.has('none'), false);\n    });\n\n`;
    testCode += `    it('delete removes key', function() {\n`;
    testCode += `      const m = new ${cls}(); m.set('k', 'v'); assert.strictEqual(m.delete('k'), true);\n    });\n\n`;
    testCode += `    it('delete returns false for null', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.delete(null), false);\n    });\n\n`;
    testCode += `    it('getAll returns all', function() {\n`;
    testCode += `      const m = new ${cls}(); m.set('a', 1); m.set('b', 2); assert.strictEqual(Object.keys(m.getAll()).length, 2);\n    });\n\n`;
    testCode += `    it('set returns this', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.set('k', 'v'), m);\n    });\n\n`;
    testCode += `    it('clear removes all', function() {\n`;
    testCode += `      const m = new ${cls}(); m.set('k', 'v'); m.clear(); assert.strictEqual(m.get('k'), null);\n    });\n\n`;
  } else if (name === 'EvolutionEvents') {
    testCode += `    it('EVENTS has 13 constants', function() {\n`;
    testCode += `      assert.strictEqual(Object.keys(${cls}.EVENTS).length, 13);\n    });\n\n`;
    testCode += `    it('on registers listener', function() {\n`;
    testCode += `      const m = new ${cls}(); const ret = m.on('evt', () => {}); assert.strictEqual(ret, m);\n    });\n\n`;
    testCode += `    it('emit triggers listener', function() {\n`;
    testCode += `      const m = new ${cls}(); let called = false; m.on('evt', () => { called = true; }); m.emit('evt'); assert.ok(called);\n    });\n\n`;
    testCode += `    it('emit returns false for unknown', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.emit('unknown'), false);\n    });\n\n`;
    testCode += `    it('emit throws for null event', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.emit(null), /event/);\n    });\n\n`;
    testCode += `    it('on throws for bad args', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.on('', () => {}), /event/); assert.throws(() => m.on('e', null), /function/);\n    });\n\n`;
    testCode += `    it('off removes listener', function() {\n`;
    testCode += `      const m = new ${cls}(); const fn = () => {}; m.on('evt', fn); m.off('evt', fn); assert.strictEqual(m.emit('evt'), false);\n    });\n\n`;
    testCode += `    it('listEvents returns registered', function() {\n`;
    testCode += `      const m = new ${cls}(); m.on('a', () => {}); m.on('b', () => {}); assert.strictEqual(m.listEvents().length, 2);\n    });\n\n`;
    testCode += `    it('clear removes all', function() {\n`;
    testCode += `      const m = new ${cls}(); m.on('a', () => {}); m.clear(); assert.strictEqual(m.listEvents().length, 0);\n    });\n\n`;
  } else if (name === 'EvolutionMetrics') {
    testCode += `    it('record creates entry', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.record('cpu', 50); assert.strictEqual(r.name, 'cpu');\n    });\n\n`;
    testCode += `    it('record throws for null name', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.record(null, 1), /name/);\n    });\n\n`;
    testCode += `    it('record throws for null value', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.record('cpu'), /value/);\n    });\n\n`;
    testCode += `    it('query filters by name', function() {\n`;
    testCode += `      const m = new ${cls}(); m.record('cpu', 1); m.record('mem', 2); assert.strictEqual(m.query('cpu').length, 1);\n    });\n\n`;
    testCode += `    it('query returns empty for unknown', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.query('none').length, 0);\n    });\n\n`;
    testCode += `    it('aggregate sum', function() {\n`;
    testCode += `      const m = new ${cls}(); m.record('cpu', 1); m.record('cpu', 2); assert.strictEqual(m.aggregate('cpu'), 3);\n    });\n\n`;
    testCode += `    it('aggregate returns null for unknown', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.aggregate('none'), null);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.record('cpu', 1); m.clear(); assert.strictEqual(m.query('cpu').length, 0);\n    });\n\n`;
  } else if (name === 'EvolutionReporter') {
    testCode += `    it('generateReport creates report', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.generateReport('e1', {}); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('generateReport throws for null', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.generateReport(null), /evolutionId/);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.generateReport('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('get returns null for null', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get(null), null);\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('list returns all', function() {\n`;
    testCode += `      const m = new ${cls}(); m.generateReport('e1', {}); m.generateReport('e2', {}); assert.strictEqual(m.list().length, 2);\n    });\n\n`;
    testCode += `    it('list filters by evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); m.generateReport('e1', {}); m.generateReport('e2', {}); assert.strictEqual(m.list('e1').length, 1);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.generateReport('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name.includes('Analyzer') && name !== 'TechnicalDebtAnalyzer') {
    testCode += `    it('analyze creates analysis', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.analyze('e1', {}); assert.ok(r.id); assert.strictEqual(r.evolutionId, 'e1');\n    });\n\n`;
    testCode += `    it('analyze throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.analyze(null), /evolutionId/);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.analyze('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('get returns null for null', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get(null), null);\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('list returns array', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.ok(Array.isArray(m.list()));\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.analyze('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'TechnicalDebtAnalyzer') {
    testCode += `    it('analyze creates analysis', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.analyze('e1', []); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('analyze throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.analyze(null), /evolutionId/);\n    });\n\n`;
    testCode += `    it('analyze computes total debt', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.analyze('e1', [{ estimatedHours: 10 }, { estimatedHours: 20 }]); assert.strictEqual(r.totalDebt, 30);\n    });\n\n`;
    testCode += `    it('analyze counts critical items', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.analyze('e1', [{ estimatedHours: 50, severity: 'critical' }]); assert.strictEqual(r.criticalCount, 1);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.analyze('e1', []); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.analyze('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name.includes('Planner') && name !== 'EvolutionPlanner') {
    testCode += `    it('create stores plan', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('e1', [{name: 'fix'}]); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('create throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.create(null, []), /evolutionId/);\n    });\n\n`;
    testCode += `    it('create throws for non-array', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.create('e1', {}), /array/);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('e1', []); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('list returns all', function() {\n`;
    testCode += `      const m = new ${cls}(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list().length, 2);\n    });\n\n`;
    testCode += `    it('list filters by evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); m.create('e1', []); m.create('e2', []); assert.strictEqual(m.list('e1').length, 1);\n    });\n\n`;
    testCode += `    it('updateStatus changes status', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('e1', []); m.updateStatus(r.id, 'active'); assert.strictEqual(m.get(r.id).status, 'active');\n    });\n\n`;
    testCode += `    it('updateStatus returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.updateStatus('none', 'x'), null);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.create('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name.includes('Module') || name.includes('DependencyCleanup') || name.includes('ArchitectureRefactor') || name.includes('WorkflowOptimization') || name.includes('AgentOptimization')) {
    testCode += `    it('analyze creates analysis', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.analyze('e1', []); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('analyze throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.analyze(null), /evolutionId/);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.analyze('e1', []); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('list returns array', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.ok(Array.isArray(m.list()));\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.analyze('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'DebtRegistry') {
    testCode += `    it('register stores item', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.register('e1', { type: 'code_quality' }); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('register throws for missing args', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.register(null), /evolutionId/); assert.throws(() => m.register('e1'), /required/);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.register('e1', { type: 'x' }); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('list filters by evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); m.register('e1', { type: 'x' }); m.register('e2', { type: 'y' }); assert.strictEqual(m.list('e1').length, 1);\n    });\n\n`;
    testCode += `    it('updateStatus changes status', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.register('e1', { type: 'x' }); m.updateStatus(r.id, 'resolved'); assert.strictEqual(m.get(r.id).status, 'resolved');\n    });\n\n`;
    testCode += `    it('remove returns true', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.register('e1', { type: 'x' }); assert.strictEqual(m.remove(r.id), true);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.register('e1', { type: 'x' }); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'DebtPrioritizer') {
    testCode += `    it('prioritize sorts by score', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.prioritize([{ severity: 'critical', estimatedHours: 50 }, { severity: 'low', estimatedHours: 1 }]); assert.strictEqual(r.length, 2); assert.ok(r[0].score >= r[1].score);\n    });\n\n`;
    testCode += `    it('prioritize throws for non-array', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.prioritize(null), /array/);\n    });\n\n`;
    testCode += `    it('prioritize handles empty array', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.prioritize([]).length, 0);\n    });\n\n`;
    testCode += `    it('set/get roundtrip', function() {\n`;
    testCode += `      const m = new ${cls}(); m.set('k', 'high'); assert.strictEqual(m.get('k'), 'high');\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.set('k', 'high'); m.clear(); assert.strictEqual(m.get('k'), null);\n    });\n\n`;
  } else if (name === 'DebtScoring') {
    testCode += `    it('score returns result', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.score('e1', []); assert.ok(r.id); assert.ok(r.score >= 0);\n    });\n\n`;
    testCode += `    it('score throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.score(null), /evolutionId/);\n    });\n\n`;
    testCode += `    it('score with critical items reduces score', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.score('e1', [{ severity: 'critical', estimatedHours: 100 }]); assert.ok(r.score < 100);\n    });\n\n`;
    testCode += `    it('score health good for empty', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.score('e1', []); assert.strictEqual(r.health, 'good');\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.score('e1', []); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.score('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'DebtReporter') {
    testCode += `    it('generate creates report', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.generate('e1', { items: [] }); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('generate throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.generate(null), /evolutionId/);\n    });\n\n`;
    testCode += `    it('generate categorizes items', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.generate('e1', { items: [{ category: 'code', estimatedHours: 5 }, { category: 'code', estimatedHours: 3 }] }); assert.strictEqual(r.byCategory.code.count, 2);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.generate('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.generate('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'EvolutionPolicies') {
    testCode += `    it('define stores policy', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.define('p1', { rules: [] }); assert.strictEqual(r.id, 'p1');\n    });\n\n`;
    testCode += `    it('define throws for missing args', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.define(null, {}), /id/);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); m.define('p1', {}); assert.ok(m.get('p1'));\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('enable/disable toggle', function() {\n`;
    testCode += `      const m = new ${cls}(); m.define('p1', {}); m.disable('p1'); assert.strictEqual(m.get('p1').enabled, false); m.enable('p1'); assert.strictEqual(m.get('p1').enabled, true);\n    });\n\n`;
    testCode += `    it('remove returns true', function() {\n`;
    testCode += `      const m = new ${cls}(); m.define('p1', {}); assert.strictEqual(m.remove('p1'), true);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.define('p1', {}); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'EvolutionConstraints') {
    testCode += `    it('add stores constraint', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.add('e1', { type: 'maxHours', value: 100 }); assert.ok(r.createdAt);\n    });\n\n`;
    testCode += `    it('add throws for missing args', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.add(null), /id/);\n    });\n\n`;
    testCode += `    it('get returns constraints', function() {\n`;
    testCode += `      const m = new ${cls}(); m.add('e1', { type: 'x', value: 1 }); assert.strictEqual(m.get('e1').length, 1);\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('check passes with no constraints', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.check('e1', {}).valid, true);\n    });\n\n`;
    testCode += `    it('check detects violations', function() {\n`;
    testCode += `      const m = new ${cls}(); m.add('e1', { type: 'maxHours', value: 10 }); assert.strictEqual(m.check('e1', { estimatedHours: 20 }).valid, false);\n    });\n\n`;
    testCode += `    it('remove returns true', function() {\n`;
    testCode += `      const m = new ${cls}(); m.add('e1', { type: 'x', value: 1 }); assert.strictEqual(m.remove('e1', 0), true);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.add('e1', { type: 'x', value: 1 }); m.clear(); assert.strictEqual(m.get('e1'), null);\n    });\n\n`;
  } else if (name === 'EvolutionSimulation') {
    testCode += `    it('simulate creates result', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.simulate('e1', { actions: [] }); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('simulate throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.simulate(null), /evolutionId/);\n    });\n\n`;
    testCode += `    it('simulate computes risk level', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.simulate('e1', { actions: [{ estimatedHours: 5 }] }); assert.ok(r.riskLevel);\n    });\n\n`;
    testCode += `    it('simulate computes success probability', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.simulate('e1', { actions: [] }); assert.ok(r.successProbability > 0);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.simulate('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.simulate('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'EvolutionValidator') {
    testCode += `    it('validate validates plan', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.validate('e1', { type: 'refactor', estimatedHours: 10 }); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('validate throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.validate(null), /evolutionId/);\n    });\n\n`;
    testCode += `    it('validate detects missing plan', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.validate('e1', null); assert.strictEqual(r.valid, false);\n    });\n\n`;
    testCode += `    it('validate warns for large plan', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.validate('e1', { type: 'refactor', estimatedHours: 1500 }); assert.ok(r.warnings.length > 0);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.validate('e1', { type: 'x' }); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.validate('e1', { type: 'x' }); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'RoadmapBuilder') {
    testCode += `    it('build creates roadmap', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.build('e1', [{ name: 'phase1', estimatedHours: 10 }]); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('build throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.build(null, []), /evolutionId/);\n    });\n\n`;
    testCode += `    it('build throws for non-array', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.build('e1', {}), /array/);\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.build('e1', []); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('updateStatus changes status', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.build('e1', []); m.updateStatus(r.id, 'active'); assert.strictEqual(m.get(r.id).status, 'active');\n    });\n\n`;
    testCode += `    it('list returns all', function() {\n`;
    testCode += `      const m = new ${cls}(); m.build('e1', []); m.build('e2', []); assert.strictEqual(m.list().length, 2);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.build('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'ReleaseRecommendations') {
    testCode += `    it('generate creates recommendations', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.generate('e1', {}); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('generate throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.generate(null), /evolutionId/);\n    });\n\n`;
    testCode += `    it('generate with critical debt', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.generate('e1', { criticalDebt: 3 }); assert.ok(r.recommendations.length > 0);\n    });\n\n`;
    testCode += `    it('generate with security findings', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.generate('e1', { securityFindings: 2 }); assert.ok(r.recommendations.some(x => x.type === 'security_fix'));\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.generate('e1', {}); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.generate('e1', {}); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  } else if (name === 'ArchitectureTimeline') {
    testCode += `    it('create stores timeline', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('e1', [{ order: 1, name: 'm1' }]); assert.ok(r.id);\n    });\n\n`;
    testCode += `    it('create throws for null evolutionId', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.create(null, []), /evolutionId/);\n    });\n\n`;
    testCode += `    it('create throws for non-array', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.throws(() => m.create('e1', {}), /array/);\n    });\n\n`;
    testCode += `    it('create sorts by order', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('e1', [{ order: 2, name: 'b' }, { order: 1, name: 'a' }]); assert.strictEqual(r.milestones[0].name, 'a');\n    });\n\n`;
    testCode += `    it('get returns by id', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('e1', []); assert.strictEqual(m.get(r.id).id, r.id);\n    });\n\n`;
    testCode += `    it('get returns null for missing', function() {\n`;
    testCode += `      const m = new ${cls}(); assert.strictEqual(m.get('none'), null);\n    });\n\n`;
    testCode += `    it('updateMilestone modifies milestone', function() {\n`;
    testCode += `      const m = new ${cls}(); const r = m.create('e1', [{ order: 1, name: 'm1' }]); m.updateMilestone(r.id, 0, { name: 'updated' }); assert.strictEqual(m.get(r.id).milestones[0].name, 'updated');\n    });\n\n`;
    testCode += `    it('clear resets', function() {\n`;
    testCode += `      const m = new ${cls}(); m.create('e1', []); m.clear(); assert.strictEqual(m.list().length, 0);\n    });\n\n`;
  }

  testCode += `  });\n\n`;
}

// Plugin SDK tests
testCode += `  /* ─── Plugin SDK Evolution Modules ─── */\n`;
testCode += `  describe('EvolutionAnalyzer (SDK)', function() {\n`;
testCode += `    const { EvolutionAnalyzer } = require('../lib/plugin-sdk/EvolutionAnalyzer');\n`;
testCode += `    it('constructor sets name', function() { const e = new EvolutionAnalyzer('test'); assert.strictEqual(e.name, 'test'); });\n`;
testCode += `    it('registerAnalyzer chains', function() { const e = new EvolutionAnalyzer(); const ret = e.registerAnalyzer(() => {}); assert.strictEqual(ret, e); });\n`;
testCode += `    it('analyze returns results', function() { const e = new EvolutionAnalyzer(); e.registerAnalyzer((id) => ({ id })); const r = e.analyze('e1', {}); assert.strictEqual(r.length, 1); });\n`;
testCode += `    it('analyze returns null for null', function() { const e = new EvolutionAnalyzer(); assert.strictEqual(e.analyze(null), null); });\n`;
testCode += `    it('registerAnalyzer throws for non-function', function() { const e = new EvolutionAnalyzer(); assert.throws(() => e.registerAnalyzer(null), /function/); });\n`;
testCode += `  });\n\n`;

testCode += `  describe('OptimizationPlanner (SDK)', function() {\n`;
testCode += `    const { OptimizationPlanner } = require('../lib/plugin-sdk/OptimizationPlanner');\n`;
testCode += `    it('constructor sets name', function() { const o = new OptimizationPlanner('test'); assert.strictEqual(o.name, 'test'); });\n`;
testCode += `    it('registerPlanner chains', function() { const o = new OptimizationPlanner(); const ret = o.registerPlanner(() => {}); assert.strictEqual(ret, o); });\n`;
testCode += `    it('plan returns results', function() { const o = new OptimizationPlanner(); o.registerPlanner((id) => ({ id })); const r = o.plan('e1', {}); assert.strictEqual(r.length, 1); });\n`;
testCode += `    it('plan returns null for null', function() { const o = new OptimizationPlanner(); assert.strictEqual(o.plan(null), null); });\n`;
testCode += `  });\n\n`;

testCode += `  describe('RefactorStrategy (SDK)', function() {\n`;
testCode += `    const { RefactorStrategy } = require('../lib/plugin-sdk/RefactorStrategy');\n`;
testCode += `    it('constructor sets name', function() { const r = new RefactorStrategy('test'); assert.strictEqual(r.name, 'test'); });\n`;
testCode += `    it('addStrategy chains', function() { const r = new RefactorStrategy(); const ret = r.addStrategy('s1', () => {}); assert.strictEqual(ret, r); });\n`;
testCode += `    it('execute runs strategies', function() { const r = new RefactorStrategy(); r.addStrategy('s1', () => 'result'); const res = r.execute('e1', {}); assert.strictEqual(res.length, 1); assert.strictEqual(res[0].strategy, 's1'); });\n`;
testCode += `    it('execute returns empty for null', function() { const r = new RefactorStrategy(); assert.strictEqual(r.execute(null, {}).length, 0); });\n`;
testCode += `    it('getResults returns results', function() { const r = new RefactorStrategy(); r.addStrategy('s1', () => 'x'); r.execute('e1', {}); assert.strictEqual(r.getResults().length, 1); });\n`;
testCode += `    it('addStrategy throws for bad args', function() { const r = new RefactorStrategy(); assert.throws(() => r.addStrategy(null, {}), /function/); });\n`;
testCode += `  });\n\n`;

testCode += `  describe('DebtAnalyzer (SDK)', function() {\n`;
testCode += `    const { DebtAnalyzer } = require('../lib/plugin-sdk/DebtAnalyzer');\n`;
testCode += `    it('constructor sets name', function() { const d = new DebtAnalyzer('test'); assert.strictEqual(d.name, 'test'); });\n`;
testCode += `    it('registerMetric chains', function() { const d = new DebtAnalyzer(); const ret = d.registerMetric('m1', () => {}); assert.strictEqual(ret, d); });\n`;
testCode += `    it('analyze returns metrics', function() { const d = new DebtAnalyzer(); d.registerMetric('m1', () => 5); const r = d.analyze('e1', []); assert.strictEqual(r.length, 1); assert.strictEqual(r[0].value, 5); });\n`;
testCode += `    it('analyze returns null for null', function() { const d = new DebtAnalyzer(); assert.strictEqual(d.analyze(null), null); });\n`;
testCode += `  });\n\n`;

testCode += `  describe('RoadmapGenerator (SDK)', function() {\n`;
testCode += `    const { RoadmapGenerator } = require('../lib/plugin-sdk/RoadmapGenerator');\n`;
testCode += `    it('constructor sets name', function() { const r = new RoadmapGenerator('test'); assert.strictEqual(r.name, 'test'); });\n`;
testCode += `    it('registerGenerator chains', function() { const r = new RoadmapGenerator(); const ret = r.registerGenerator(() => {}); assert.strictEqual(ret, r); });\n`;
testCode += `    it('generate returns results', function() { const r = new RoadmapGenerator(); r.registerGenerator((id) => ({ id })); const res = r.generate('e1', {}); assert.strictEqual(res.length, 1); });\n`;
testCode += `    it('generate returns empty for null', function() { const r = new RoadmapGenerator(); assert.strictEqual(r.generate(null, {}).length, 0); });\n`;
testCode += `  });\n\n`;

// Plugin.js tests
testCode += `  describe('Plugin Evolution Methods', function() {\n`;
testCode += `    const { Plugin } = require('../lib/plugin-sdk/Plugin');\n`;
testCode += `    it('registerEvolutionAnalyzer', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); const a = p.registerEvolutionAnalyzer('ea1'); assert.ok(a); assert.strictEqual(p.getEvolutionProviders().analyzers.length, 1); });\n`;
testCode += `    it('registerOptimizationPlanner', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); const o = p.registerOptimizationPlanner('op1'); assert.ok(o); assert.strictEqual(p.getEvolutionProviders().planners.length, 1); });\n`;
testCode += `    it('registerRefactorStrategy', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); const r = p.registerRefactorStrategy('rs1'); assert.ok(r); assert.strictEqual(p.getEvolutionProviders().strategies.length, 1); });\n`;
testCode += `    it('registerDebtAnalyzer', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); const d = p.registerDebtAnalyzer('da1'); assert.ok(d); assert.strictEqual(p.getEvolutionProviders().debtAnalyzers.length, 1); });\n`;
testCode += `    it('registerRoadmapGenerator', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); const r = p.registerRoadmapGenerator('rg1'); assert.ok(r); assert.strictEqual(p.getEvolutionProviders().roadmaps.length, 1); });\n`;
testCode += `    it('getEvolutionProviders returns empty by default', function() { const p = new Plugin({ id: 'p1', name: 't', version: '1' }); assert.deepStrictEqual(p.getEvolutionProviders(), {}); });\n`;
testCode += `  });\n\n`;

// index.js exports
testCode += `  describe('getDefaultEvolutionManager / index.js', function() {\n`;
testCode += `    const evo = require('../lib/evolution/index');\n`;
testCode += `    it('getDefaultEvolutionManager returns EvolutionManager', function() { const m = evo.getDefaultEvolutionManager(); assert.ok(m instanceof evo.EvolutionManager); });\n`;
testCode += `    it('EvolutionManager exported', function() { assert.ok(evo.EvolutionManager); });\n`;
testCode += `    it('SolutionEvolution exported', function() { assert.ok(evo.SolutionEvolution); });\n`;
testCode += `    it('EvolutionPlanner exported', function() { assert.ok(evo.EvolutionPlanner); });\n`;
testCode += `    it('EvolutionEngine exported', function() { assert.ok(evo.EvolutionEngine); });\n`;
testCode += `    it('EvolutionEvents exported', function() { assert.ok(evo.EvolutionEvents); });\n`;
testCode += `    it('ArchitectureAnalyzer exported', function() { assert.ok(evo.ArchitectureAnalyzer); });\n`;
testCode += `    it('DependencyAnalyzer exported', function() { assert.ok(evo.DependencyAnalyzer); });\n`;
testCode += `    it('PerformanceAnalyzer exported', function() { assert.ok(evo.PerformanceAnalyzer); });\n`;
testCode += `    it('DebtRegistry exported', function() { assert.ok(evo.DebtRegistry); });\n`;
testCode += `    it('RoadmapBuilder exported', function() { assert.ok(evo.RoadmapBuilder); });\n`;
testCode += `    it('EvolutionSimulation exported', function() { assert.ok(evo.EvolutionSimulation); });\n`;
testCode += `  });\n\n`;

// API Controller tests
testCode += `  describe('Evolution API Controller', function() {\n`;
testCode += `    const { getController } = require('../lib/api/controllers/evolutionController');\n`;
testCode += `    function mockReq(body, query) { return { body: body || {}, query: query || {} }; }\n`;
testCode += `    function mockRes() { let jd = null; return { _json: () => jd, status(s) { return this; }, json(d) { jd = d; }, send() {} }; }\n\n`;
testCode += `    it('getEvolution returns status', function() { const ctrl = getController(); const res = mockRes(); ctrl.getEvolution(mockReq(), res); assert.ok(res._json().success); });\n`;
testCode += `    it('analyze with valid type', function() { const ctrl = getController(); const res = mockRes(); ctrl.analyze(mockReq({ evolutionId: 'e1', type: 'architecture', data: {} }), res); assert.ok(res._json().success); });\n`;
testCode += `    it('analyze with unknown type returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.analyze(mockReq({ evolutionId: 'e1', type: 'unknown' }), res); assert.strictEqual(res._json().success, false); });\n`;
testCode += `    it('analyze with missing fields returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.analyze(mockReq({}), res); assert.strictEqual(res._json().success, false); });\n`;
testCode += `    it('plan with valid type', function() { const ctrl = getController(); const res = mockRes(); ctrl.plan(mockReq({ evolutionId: 'e1', type: 'improvement', actions: [] }), res); assert.ok(res._json().success); });\n`;
testCode += `    it('plan with unknown type returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.plan(mockReq({ evolutionId: 'e1', type: 'unknown', actions: [] }), res); assert.strictEqual(res._json().success, false); });\n`;
testCode += `    it('plan with missing actions returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.plan(mockReq({ evolutionId: 'e1', type: 'improvement' }), res); assert.strictEqual(res._json().success, false); });\n`;
testCode += `    it('simulate with plan', function() { const ctrl = getController(); const res = mockRes(); ctrl.simulate(mockReq({ evolutionId: 'e1', plan: { actions: [] } }), res); assert.ok(res._json().success); });\n`;
testCode += `    it('simulate with missing plan returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.simulate(mockReq({ evolutionId: 'e1' }), res); assert.strictEqual(res._json().success, false); });\n`;
testCode += `    it('validate with plan', function() { const ctrl = getController(); const res = mockRes(); ctrl.validate(mockReq({ evolutionId: 'e1', plan: { type: 'refactor' } }), res); assert.ok(res._json().success); });\n`;
testCode += `    it('validate with missing plan returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.validate(mockReq({ evolutionId: 'e1' }), res); assert.strictEqual(res._json().success, false); });\n`;
testCode += `    it('exportEvolution with valid evolutionId', function() { const ctrl = getController(); const res = mockRes(); ctrl.exportEvolution(mockReq({ evolutionId: 'e1' }), res); assert.strictEqual(res._json().success, false); }); // missing evolution\n`;
testCode += `    it('exportEvolution with missing id returns error', function() { const ctrl = getController(); const res = mockRes(); ctrl.exportEvolution(mockReq({}), res); assert.strictEqual(res._json().success, false); });\n`;
testCode += `    it('getHistory returns history', function() { const ctrl = getController(); const res = mockRes(); ctrl.getHistory(mockReq({}), res); assert.ok(res._json().success); });\n`;
testCode += `    it('getRoadmap returns roadmaps', function() { const ctrl = getController(); const res = mockRes(); ctrl.getRoadmap(mockReq(), res); assert.ok(res._json().success); });\n`;
testCode += `    it('routes defined correctly', function() {\n`;
testCode += `      const { registerEvolutionRoutes } = require('../lib/api/routes/evolutionRoutes');\n`;
testCode += `      const Router = require('express').Router;\n`;
testCode += `      const router = Router();\n`;
testCode += `      assert.doesNotThrow(() => registerEvolutionRoutes(router, getController()));\n`;
testCode += `    });\n`;
testCode += `  });\n\n`;

testCode += `});\n`;

fs.writeFileSync('tests/evolution.test.js', testCode);
console.log('Written', testCode.split('\n').length, 'lines');
