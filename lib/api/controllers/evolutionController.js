const { getDefaultEvolutionManager } = require('../../evolution');
const { success, error } = require('../responses/apiResponse');

function getController() {
  const evo = getDefaultEvolutionManager();
  return {
    getEvolution(req, res) {
      try {
        const status = evo.getStatus();
        const history = evo.evolutionReporter.list();
        success(res, { status, history });
      } catch (e) { error(res, e.message); }
    },
    analyze(req, res) {
      try {
        const { evolutionId, type, data } = req.body;
        if (!evolutionId || !type) return error(res, 'evolutionId and type required');
        const analyzers = {
          architecture: evo.architectureAnalyzer,
          dependency: evo.dependencyAnalyzer,
          complexity: evo.complexityAnalyzer,
          performance: evo.performanceAnalyzer,
          security: evo.securityAnalyzer,
          cost: evo.costAnalyzer,
          maintainability: evo.maintainabilityAnalyzer,
          technicalDebt: evo.technicalDebtAnalyzer,
          scalability: evo.scalabilityAnalyzer,
          availability: evo.availabilityAnalyzer
        };
        const analyzer = analyzers[type];
        if (!analyzer) return error(res, `Unknown type: ${type}`);
        const result = analyzer.analyze(evolutionId, data || {});
        if (evo.evolutionEvents) evo.evolutionEvents.emit(evo.evolutionEvents.constructor.EVENTS.EVOLUTION_ANALYZED, { id: result.id, type });
        success(res, { analysis: result });
      } catch (e) { error(res, e.message); }
    },
    plan(req, res) {
      try {
        const { evolutionId, type: planType, actions } = req.body;
        if (!evolutionId || !planType) return error(res, 'evolutionId and type required');
        if (!Array.isArray(actions)) return error(res, 'actions must be an array');
        const planners = {
          improvement: evo.improvementPlanner,
          migration: evo.migrationPlanner,
          refactor: evo.refactorPlanner,
          optimization: evo.optimizationPlanner,
          upgrade: evo.upgradePlanner
        };
        const planner = planners[planType];
        if (!planner) return error(res, `Unknown plan type: ${planType}`);
        const result = planner.create(evolutionId, actions);
        if (evo.evolutionEvents) evo.evolutionEvents.emit(evo.evolutionEvents.constructor.EVENTS.EVOLUTION_PLANNED, { id: result.id });
        success(res, { plan: result });
      } catch (e) { error(res, e.message); }
    },
    simulate(req, res) {
      try {
        const { evolutionId, plan } = req.body;
        if (!evolutionId || !plan) return error(res, 'evolutionId and plan required');
        const result = evo.evolutionSimulation.simulate(evolutionId, plan);
        success(res, { simulation: result });
      } catch (e) { error(res, e.message); }
    },
    validate(req, res) {
      try {
        const { evolutionId, plan } = req.body;
        if (!evolutionId || !plan) return error(res, 'evolutionId and plan required');
        const result = evo.evolutionValidator.validate(evolutionId, plan);
        success(res, { validation: result });
      } catch (e) { error(res, e.message); }
    },
    exportEvolution(req, res) {
      try {
        const { evolutionId, format } = req.body;
        if (!evolutionId) return error(res, 'evolutionId required');
        const evolution = evo.solutionEvolution.get(evolutionId);
        if (!evolution) return error(res, 'Evolution not found');
        const plans = evo.evolutionPlanner.list(evolutionId);
        const reports = evo.evolutionReporter.list(evolutionId);
        const data = { evolution, plans, reports };
        if (format === 'yaml') {
          const lines = ['evolutionId: ' + evolutionId, 'status: ' + (evolution ? evolution.status : 'unknown'), 'plans: ' + plans.length, 'reports: ' + reports.length];
          return success(res, { export: { data: lines.join('\n'), format } });
        }
        success(res, { export: { data, format: format || 'json' } });
      } catch (e) { error(res, e.message); }
    },
    getHistory(req, res) {
      try {
        const { evolutionId } = req.query;
        const reports = evo.evolutionReporter.list(evolutionId || undefined);
        success(res, { history: reports });
      } catch (e) { error(res, e.message); }
    },
    getRoadmap(req, res) {
      try {
        const roadmaps = evo.roadmapBuilder.list();
        success(res, { roadmaps });
      } catch (e) { error(res, e.message); }
    }
  };
}

module.exports = { getController };
