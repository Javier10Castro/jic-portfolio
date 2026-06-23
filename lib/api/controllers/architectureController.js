const { getDefaultArchitect } = require('../../architecture');
const { success, error } = require('../responses/apiResponse');

function getController() {
  const architect = getDefaultArchitect();
  return {
    getArchitecture(req, res) {
      try { success(res, { status: architect.getStatus(), patterns: architect.patternRegistry.list().length, decisions: architect.decisionManager.list().length }); }
      catch (e) { error(res, e.message); }
    },
    design(req, res) {
      try {
        const { definition, options } = req.body;
        if (!definition) return error(res, 'definition required');
        const result = architect.solutionArchitect.design(definition, options || {});
        if (architect.architectureEvents) architect.architectureEvents.emit(architect.architectureEvents.constructor.EVENTS.ARCHITECTURE_CREATED, { id: result.id });
        success(res, { design: result });
      } catch (e) { error(res, e.message); }
    },
    validate(req, res) {
      try {
        const { architecture } = req.body;
        if (!architecture) return error(res, 'architecture required');
        const result = architect.architectureValidator.validate(architecture);
        success(res, { validation: result });
      } catch (e) { error(res, e.message); }
    },
    analyze(req, res) {
      try {
        const { architectureId, type } = req.body;
        if (!architectureId || !type) return error(res, 'architectureId and type required');
        const analyzers = {
          requirements: architect.requirementsAnalyzer,
          constraints: architect.constraintAnalyzer,
          risks: architect.riskAnalyzer,
          tradeoffs: architect.tradeoffAnalyzer,
          quality: architect.qualityAttributeAnalyzer
        };
        const analyzer = analyzers[type];
        if (!analyzer) return error(res, `Unknown type: ${type}. Must be one of: ${Object.keys(analyzers).join(', ')}`);
        const result = analyzer.analyze(architectureId, req.body[type] || []);
        success(res, { analysis: result });
      } catch (e) { error(res, e.message); }
    },
    exportArchitecture(req, res) {
      try {
        const { solutionId, format } = req.body;
        if (!solutionId) return error(res, 'solutionId required');
        const result = architect.solutionBlueprint.export(solutionId, format || 'json');
        success(res, { export: result });
      } catch (e) { error(res, e.message); }
    },
    getPatterns(req, res) {
      try {
        const { DefaultPatterns } = require('../../architecture');
        const defaults = new DefaultPatterns();
        const loaded = defaults.load();
        for (const p of loaded) {
          architect.patternRegistry.register(p);
        }
        const patterns = architect.patternRegistry.list();
        success(res, { patterns });
      } catch (e) { error(res, e.message); }
    },
    getDecisions(req, res) {
      try {
        const decisions = architect.decisionManager.list();
        success(res, { decisions });
      } catch (e) { error(res, e.message); }
    },
    getGraph(req, res) {
      try {
        const { solutionId } = req.query;
        if (!solutionId) return error(res, 'solutionId query parameter required');
        const topology = architect.systemTopology.get(solutionId);
        const layers = architect.systemTopology.getLayered(solutionId);
        success(res, { graph: topology, layers });
      } catch (e) { error(res, e.message); }
    },
  };
}
module.exports = { getController };
