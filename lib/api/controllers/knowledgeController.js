const { getDefaultKnowledgeManager } = require('../../knowledge');
const { success, error } = require('../responses/apiResponse');

function getController() {
  const km = getDefaultKnowledgeManager();
  return {
    getKnowledge(req, res) {
      try {
        const status = km.getStatus();
        const reports = km.knowledgeReporter.list();
        success(res, { status, reports });
      } catch (e) { error(res, e.message); }
    },
    ingest(req, res) {
      try {
        const { sourceType, data } = req.body;
        if (!sourceType) return error(res, 'sourceType is required');
        if (!data) return error(res, 'data is required');
        const result = km.knowledgeEngine.ingest(sourceType, data);
        if (km.knowledgeEvents) km.knowledgeEvents.emit(km.knowledgeEvents.constructor.EVENTS.KNOWLEDGE_INGESTED, { id: result.id, sourceType });
        success(res, { ingestion: result });
      } catch (e) { error(res, e.message); }
    },
    query(req, res) {
      try {
        const { query: queryStr, type, limit } = req.body;
        if (!queryStr) return error(res, 'query is required');
        let results = [];
        if (type === 'graph') {
          const nodes = km.knowledgeGraph.getNodesByType(queryStr);
          results = nodes;
        } else if (type === 'pattern') {
          results = km.patternDiscovery.findByName(queryStr);
        } else if (type === 'case') {
          results = km.caseRetriever.retrieve(queryStr, limit);
        } else if (type === 'lesson') {
          results = km.lessonManager.findByCategory(queryStr);
        } else {
          const graphResults = km.knowledgeGraph.getNodesByType(queryStr);
          const patternResults = km.patternDiscovery.findByName(queryStr);
          const caseResults = km.caseRetriever.retrieve(queryStr, limit);
          results = { graph: graphResults, patterns: patternResults, cases: caseResults };
        }
        if (km.knowledgeEvents) km.knowledgeEvents.emit(km.knowledgeEvents.constructor.EVENTS.KNOWLEDGE_QUERIED, { query: queryStr, type });
        success(res, { results });
      } catch (e) { error(res, e.message); }
    },
    recommend(req, res) {
      try {
        const { context, type } = req.body;
        if (!context) return error(res, 'context is required');
        if (!type) return error(res, 'type is required');
        let recommendations;
        if (type === 'architecture') {
          recommendations = km.architectureRecommendations.findByProject(context);
        } else if (type === 'workflow') {
          recommendations = km.workflowRecommendations.findByProject(context);
        } else if (type === 'optimization') {
          recommendations = km.optimizationRecommendations.findByProject(context);
        } else {
          recommendations = km.recommendationEngine.findByContext(context);
        }
        if (!recommendations || recommendations.length === 0) {
          recommendations = km.recommendationEngine.generate(context, type, []);
        }
        if (km.knowledgeEvents) km.knowledgeEvents.emit(km.knowledgeEvents.constructor.EVENTS.RECOMMENDATION_GENERATED, { context, type });
        success(res, { recommendations: Array.isArray(recommendations) ? recommendations : [recommendations] });
      } catch (e) { error(res, e.message); }
    },
    getGraph(req, res) {
      try {
        const nodes = km.knowledgeGraph.getAllNodes();
        const edges = km.knowledgeGraph.getAllEdges();
        const versions = km.graphVersioning.list();
        success(res, { graph: { nodes, edges, versions } });
      } catch (e) { error(res, e.message); }
    },
    getPatterns(req, res) {
      try {
        const patterns = km.patternDiscovery.list();
        const mined = km.patternMining.list();
        const practices = km.bestPracticeExtractor.list();
        const antiPatterns = km.antiPatternDetector.list();
        success(res, { patterns, mined, bestPractices: practices, antiPatterns });
      } catch (e) { error(res, e.message); }
    },
    getLessons(req, res) {
      try {
        const { category, status } = req.query;
        let lessons;
        if (category) {
          lessons = km.lessonManager.findByCategory(category);
        } else if (status) {
          lessons = km.lessonManager.findByStatus(status);
        } else {
          lessons = km.lessonManager.list();
        }
        success(res, { lessons, total: km.lessonManager.count() });
      } catch (e) { error(res, e.message); }
    },
    getSimilarProjects(req, res) {
      try {
        const { projectId, features } = req.body;
        if (!projectId) return error(res, 'projectId is required');
        if (features) {
          km.similarProjectFinder.index(projectId, features);
        }
        const project = km.similarProjectFinder.get(projectId);
        const similar = project ? km.similarProjectFinder.findSimilar(project.features, 10) : [];
        success(res, { project: project || null, similar });
      } catch (e) { error(res, e.message); }
    }
  };
}

module.exports = { getController };
