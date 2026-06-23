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

class KnowledgeManager {
  constructor() {
    this._knowledgeEngine = new KnowledgeEngine();
    this._knowledgeStorage = new KnowledgeStorage();
    this._knowledgeRegistry = new KnowledgeRegistry();
    this._knowledgeEvents = new KnowledgeEvents();
    this._knowledgeMetrics = new KnowledgeMetrics();
    this._knowledgeReporter = new KnowledgeReporter();
    this._knowledgeGraph = new KnowledgeGraph();
    this._entityRegistry = new EntityRegistry();
    this._relationshipManager = new RelationshipManager();
    this._graphTraversal = new GraphTraversal();
    this._graphQueries = new GraphQueries();
    this._graphVersioning = new GraphVersioning();
    this._architectureKnowledge = new ArchitectureKnowledge();
    this._workflowKnowledge = new WorkflowKnowledge();
    this._deploymentKnowledge = new DeploymentKnowledge();
    this._runtimeKnowledge = new RuntimeKnowledge();
    this._securityKnowledge = new SecurityKnowledge();
    this._billingKnowledge = new BillingKnowledge();
    this._governanceKnowledge = new GovernanceKnowledge();
    this._evaluationKnowledge = new EvaluationKnowledge();
    this._telemetryKnowledge = new TelemetryKnowledge();
    this._incidentKnowledge = new IncidentKnowledge();
    this._pluginKnowledge = new PluginKnowledge();
    this._integrationKnowledge = new IntegrationKnowledge();
    this._patternDiscovery = new PatternDiscovery();
    this._patternMining = new PatternMining();
    this._bestPracticeExtractor = new BestPracticeExtractor();
    this._antiPatternDetector = new AntiPatternDetector();
    this._successFactors = new SuccessFactors();
    this._failurePatterns = new FailurePatterns();
    this._recommendationEngine = new RecommendationEngine();
    this._contextMatcher = new ContextMatcher();
    this._similarProjectFinder = new SimilarProjectFinder();
    this._architectureRecommendations = new ArchitectureRecommendations();
    this._workflowRecommendations = new WorkflowRecommendations();
    this._optimizationRecommendations = new OptimizationRecommendations();
    this._caseRegistry = new CaseRegistry();
    this._caseRetriever = new CaseRetriever();
    this._caseSimilarity = new CaseSimilarity();
    this._caseRanking = new CaseRanking();
    this._lessonManager = new LessonManager();
    this._lessonExtractor = new LessonExtractor();
    this._lessonValidator = new LessonValidator();
    this._lessonPublisher = new LessonPublisher();
    this._initializedAt = new Date().toISOString();
  }

  get knowledgeEngine() { return this._knowledgeEngine; }
  get knowledgeStorage() { return this._knowledgeStorage; }
  get knowledgeRegistry() { return this._knowledgeRegistry; }
  get knowledgeEvents() { return this._knowledgeEvents; }
  get knowledgeMetrics() { return this._knowledgeMetrics; }
  get knowledgeReporter() { return this._knowledgeReporter; }
  get knowledgeGraph() { return this._knowledgeGraph; }
  get entityRegistry() { return this._entityRegistry; }
  get relationshipManager() { return this._relationshipManager; }
  get graphTraversal() { return this._graphTraversal; }
  get graphQueries() { return this._graphQueries; }
  get graphVersioning() { return this._graphVersioning; }
  get architectureKnowledge() { return this._architectureKnowledge; }
  get workflowKnowledge() { return this._workflowKnowledge; }
  get deploymentKnowledge() { return this._deploymentKnowledge; }
  get runtimeKnowledge() { return this._runtimeKnowledge; }
  get securityKnowledge() { return this._securityKnowledge; }
  get billingKnowledge() { return this._billingKnowledge; }
  get governanceKnowledge() { return this._governanceKnowledge; }
  get evaluationKnowledge() { return this._evaluationKnowledge; }
  get telemetryKnowledge() { return this._telemetryKnowledge; }
  get incidentKnowledge() { return this._incidentKnowledge; }
  get pluginKnowledge() { return this._pluginKnowledge; }
  get integrationKnowledge() { return this._integrationKnowledge; }
  get patternDiscovery() { return this._patternDiscovery; }
  get patternMining() { return this._patternMining; }
  get bestPracticeExtractor() { return this._bestPracticeExtractor; }
  get antiPatternDetector() { return this._antiPatternDetector; }
  get successFactors() { return this._successFactors; }
  get failurePatterns() { return this._failurePatterns; }
  get recommendationEngine() { return this._recommendationEngine; }
  get contextMatcher() { return this._contextMatcher; }
  get similarProjectFinder() { return this._similarProjectFinder; }
  get architectureRecommendations() { return this._architectureRecommendations; }
  get workflowRecommendations() { return this._workflowRecommendations; }
  get optimizationRecommendations() { return this._optimizationRecommendations; }
  get caseRegistry() { return this._caseRegistry; }
  get caseRetriever() { return this._caseRetriever; }
  get caseSimilarity() { return this._caseSimilarity; }
  get caseRanking() { return this._caseRanking; }
  get lessonManager() { return this._lessonManager; }
  get lessonExtractor() { return this._lessonExtractor; }
  get lessonValidator() { return this._lessonValidator; }
  get lessonPublisher() { return this._lessonPublisher; }

  getStatus() {
    return {
      initialized: true,
      initializedAt: this._initializedAt,
      submodules: {
        knowledgeEngine: this._knowledgeEngine !== null,
        knowledgeStorage: this._knowledgeStorage !== null,
        knowledgeRegistry: this._knowledgeRegistry !== null,
        knowledgeEvents: this._knowledgeEvents !== null,
        knowledgeMetrics: this._knowledgeMetrics !== null,
        knowledgeReporter: this._knowledgeReporter !== null,
        knowledgeGraph: this._knowledgeGraph !== null,
        entityRegistry: this._entityRegistry !== null,
        relationshipManager: this._relationshipManager !== null,
        graphTraversal: this._graphTraversal !== null,
        graphQueries: this._graphQueries !== null,
        graphVersioning: this._graphVersioning !== null,
        architectureKnowledge: this._architectureKnowledge !== null,
        workflowKnowledge: this._workflowKnowledge !== null,
        deploymentKnowledge: this._deploymentKnowledge !== null,
        runtimeKnowledge: this._runtimeKnowledge !== null,
        securityKnowledge: this._securityKnowledge !== null,
        billingKnowledge: this._billingKnowledge !== null,
        governanceKnowledge: this._governanceKnowledge !== null,
        evaluationKnowledge: this._evaluationKnowledge !== null,
        telemetryKnowledge: this._telemetryKnowledge !== null,
        incidentKnowledge: this._incidentKnowledge !== null,
        pluginKnowledge: this._pluginKnowledge !== null,
        integrationKnowledge: this._integrationKnowledge !== null,
        patternDiscovery: this._patternDiscovery !== null,
        patternMining: this._patternMining !== null,
        bestPracticeExtractor: this._bestPracticeExtractor !== null,
        antiPatternDetector: this._antiPatternDetector !== null,
        successFactors: this._successFactors !== null,
        failurePatterns: this._failurePatterns !== null,
        recommendationEngine: this._recommendationEngine !== null,
        contextMatcher: this._contextMatcher !== null,
        similarProjectFinder: this._similarProjectFinder !== null,
        architectureRecommendations: this._architectureRecommendations !== null,
        workflowRecommendations: this._workflowRecommendations !== null,
        optimizationRecommendations: this._optimizationRecommendations !== null,
        caseRegistry: this._caseRegistry !== null,
        caseRetriever: this._caseRetriever !== null,
        caseSimilarity: this._caseSimilarity !== null,
        caseRanking: this._caseRanking !== null,
        lessonManager: this._lessonManager !== null,
        lessonExtractor: this._lessonExtractor !== null,
        lessonValidator: this._lessonValidator !== null,
        lessonPublisher: this._lessonPublisher !== null
      }
    };
  }

  clear() {
    this._knowledgeEngine.clear();
    this._knowledgeStorage.clear();
    this._knowledgeRegistry.clear();
    this._knowledgeEvents.clear();
    this._knowledgeMetrics.clear();
    this._knowledgeReporter.clear();
    this._knowledgeGraph.clear();
    this._entityRegistry.clear();
    this._relationshipManager.clear();
    this._graphTraversal.clear();
    this._graphQueries.clear();
    this._graphVersioning.clear();
    this._architectureKnowledge.clear();
    this._workflowKnowledge.clear();
    this._deploymentKnowledge.clear();
    this._runtimeKnowledge.clear();
    this._securityKnowledge.clear();
    this._billingKnowledge.clear();
    this._governanceKnowledge.clear();
    this._evaluationKnowledge.clear();
    this._telemetryKnowledge.clear();
    this._incidentKnowledge.clear();
    this._pluginKnowledge.clear();
    this._integrationKnowledge.clear();
    this._patternDiscovery.clear();
    this._patternMining.clear();
    this._bestPracticeExtractor.clear();
    this._antiPatternDetector.clear();
    this._successFactors.clear();
    this._failurePatterns.clear();
    this._recommendationEngine.clear();
    this._contextMatcher.clear();
    this._similarProjectFinder.clear();
    this._architectureRecommendations.clear();
    this._workflowRecommendations.clear();
    this._optimizationRecommendations.clear();
    this._caseRegistry.clear();
    this._caseRetriever.clear();
    this._caseSimilarity.clear();
    this._caseRanking.clear();
    this._lessonManager.clear();
    this._lessonExtractor.clear();
    this._lessonValidator.clear();
    this._lessonPublisher.clear();
  }
}

module.exports = { KnowledgeManager };
