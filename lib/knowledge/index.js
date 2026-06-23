const { KnowledgeManager } = require('./knowledgeManager');
const { KnowledgeEngine } = require('./knowledgeEngine');
const { KnowledgeStorage } = require('./knowledgeStorage');
const { KnowledgeRegistry } = require('./knowledgeRegistry');
const { KnowledgeEvents } = require('./knowledgeEvents');
const { KnowledgeMetrics } = require('./knowledgeMetrics');
const { KnowledgeReporter } = require('./knowledgeReporter');
const { KnowledgeGraph } = require('./knowledgeGraph');
const { EntityRegistry } = require('./entityRegistry');
const { RelationshipManager } = require('./relationshipManager');
const { GraphTraversal } = require('./graphTraversal');
const { GraphQueries } = require('./graphQueries');
const { GraphVersioning } = require('./graphVersioning');
const { ArchitectureKnowledge } = require('./architectureKnowledge');
const { WorkflowKnowledge } = require('./workflowKnowledge');
const { DeploymentKnowledge } = require('./deploymentKnowledge');
const { RuntimeKnowledge } = require('./runtimeKnowledge');
const { SecurityKnowledge } = require('./securityKnowledge');
const { BillingKnowledge } = require('./billingKnowledge');
const { GovernanceKnowledge } = require('./governanceKnowledge');
const { EvaluationKnowledge } = require('./evaluationKnowledge');
const { TelemetryKnowledge } = require('./telemetryKnowledge');
const { IncidentKnowledge } = require('./incidentKnowledge');
const { PluginKnowledge } = require('./pluginKnowledge');
const { IntegrationKnowledge } = require('./integrationKnowledge');
const { PatternDiscovery } = require('./patternDiscovery');
const { PatternMining } = require('./patternMining');
const { BestPracticeExtractor } = require('./bestPracticeExtractor');
const { AntiPatternDetector } = require('./antiPatternDetector');
const { SuccessFactors } = require('./successFactors');
const { FailurePatterns } = require('./failurePatterns');
const { RecommendationEngine } = require('./recommendationEngine');
const { ContextMatcher } = require('./contextMatcher');
const { SimilarProjectFinder } = require('./similarProjectFinder');
const { ArchitectureRecommendations } = require('./architectureRecommendations');
const { WorkflowRecommendations } = require('./workflowRecommendations');
const { OptimizationRecommendations } = require('./optimizationRecommendations');
const { CaseRegistry } = require('./caseRegistry');
const { CaseRetriever } = require('./caseRetriever');
const { CaseSimilarity } = require('./caseSimilarity');
const { CaseRanking } = require('./caseRanking');
const { LessonManager } = require('./lessonManager');
const { LessonExtractor } = require('./lessonExtractor');
const { LessonValidator } = require('./lessonValidator');
const { LessonPublisher } = require('./lessonPublisher');

function getDefaultKnowledgeManager() {
  return new KnowledgeManager();
}

module.exports = {
  KnowledgeManager,
  KnowledgeEngine,
  KnowledgeStorage,
  KnowledgeRegistry,
  KnowledgeEvents,
  KnowledgeMetrics,
  KnowledgeReporter,
  KnowledgeGraph,
  EntityRegistry,
  RelationshipManager,
  GraphTraversal,
  GraphQueries,
  GraphVersioning,
  ArchitectureKnowledge,
  WorkflowKnowledge,
  DeploymentKnowledge,
  RuntimeKnowledge,
  SecurityKnowledge,
  BillingKnowledge,
  GovernanceKnowledge,
  EvaluationKnowledge,
  TelemetryKnowledge,
  IncidentKnowledge,
  PluginKnowledge,
  IntegrationKnowledge,
  PatternDiscovery,
  PatternMining,
  BestPracticeExtractor,
  AntiPatternDetector,
  SuccessFactors,
  FailurePatterns,
  RecommendationEngine,
  ContextMatcher,
  SimilarProjectFinder,
  ArchitectureRecommendations,
  WorkflowRecommendations,
  OptimizationRecommendations,
  CaseRegistry,
  CaseRetriever,
  CaseSimilarity,
  CaseRanking,
  LessonManager,
  LessonExtractor,
  LessonValidator,
  LessonPublisher,
  getDefaultKnowledgeManager
};
