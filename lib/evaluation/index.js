const { EvaluationEngine } = require('./evaluationEngine');
const { EvaluationManager, createEngine, getDefaultEngine, EVALUATION_TYPES, METRIC_TYPES } = require('./evaluationManager');
const { EvaluationRegistry } = require('./evaluationRegistry');
const { EvaluationRunner } = require('./evaluationRunner');
const { EvaluationStorage } = require('./evaluationStorage');
const { EvaluationEvents, EVENTS } = require('./evaluationEvents');
const { EvaluationMetrics } = require('./evaluationMetrics');
const { EvaluationScheduler } = require('./evaluationScheduler');
const { EvaluationHistory } = require('./evaluationHistory');
const { EvaluationReports } = require('./evaluationReports');

const { PromptRegistry } = require('./prompts/promptRegistry');
const { PromptVersioning } = require('./prompts/promptVersioning');
const { PromptTemplates } = require('./prompts/promptTemplates');
const { PromptVariables } = require('./prompts/promptVariables');
const { PromptSnapshots } = require('./prompts/promptSnapshots');
const { PromptHistory } = require('./prompts/promptHistory');

const { ExperimentManager } = require('./experiments/experimentManager');
const { ExperimentRunner } = require('./experiments/experimentRunner');
const { ExperimentStorage } = require('./experiments/experimentStorage');
const { ExperimentComparator } = require('./experiments/experimentComparator');
const { ExperimentMetrics } = require('./experiments/experimentMetrics');

const { ABTesting } = require('./abtesting/abTesting');
const { TrafficSplitter } = require('./abtesting/trafficSplitter');
const { ResultAggregator } = require('./abtesting/resultAggregator');
const { WinnerSelector } = require('./abtesting/winnerSelector');

const { BenchmarkManager } = require('./benchmarks/benchmarkManager');
const { BenchmarkSuites } = require('./benchmarks/benchmarkSuites');
const { BenchmarkRunner } = require('./benchmarks/benchmarkRunner');
const { BenchmarkDatasets } = require('./benchmarks/benchmarkDatasets');
const { BenchmarkResults } = require('./benchmarks/benchmarkResults');

const { ModelComparison } = require('./models/modelComparison');
const { QualityScoring } = require('./models/qualityScoring');
const { LatencyScoring } = require('./models/latencyScoring');
const { CostScoring } = require('./models/costScoring');
const { HallucinationDetector } = require('./models/hallucinationDetector');
const { ConsistencyEvaluator } = require('./models/consistencyEvaluator');

const { AgentEvaluator } = require('./agents/agentEvaluator');
const { WorkflowEvaluator } = require('./agents/workflowEvaluator');
const { ConversationEvaluator } = require('./agents/conversationEvaluator');
const { PlannerEvaluator } = require('./agents/plannerEvaluator');
const { GeneratorEvaluator } = require('./agents/generatorEvaluator');

const { JudgeEngine } = require('./judge/judgeEngine');
const { JudgePrompts } = require('./judge/judgePrompts');
const { RubricEngine } = require('./judge/rubricEngine');
const { ScoreNormalizer } = require('./judge/scoreNormalizer');

const { DatasetManager } = require('./datasets/datasetManager');
const { DatasetRegistry } = require('./datasets/datasetRegistry');
const { DatasetImporter } = require('./datasets/datasetImporter');
const { DatasetExporter } = require('./datasets/datasetExporter');
const { DatasetVersioning } = require('./datasets/datasetVersioning');

const { FeedbackCollector } = require('./learning/feedbackCollector');
const { FeedbackAggregator } = require('./learning/feedbackAggregator');
const { RecommendationEngine } = require('./learning/recommendationEngine');
const { ImprovementPlanner } = require('./learning/improvementPlanner');
const { AiEvaluationIntegration } = require('./aiIntegration');

module.exports = {
  EvaluationEngine,
  EvaluationManager,
  createEngine,
  getDefaultEngine,
  EvaluationRegistry,
  EvaluationRunner,
  EvaluationStorage,
  EvaluationEvents,
  EVENTS,
  EvaluationMetrics,
  EvaluationScheduler,
  EvaluationHistory,
  EvaluationReports,
  EVALUATION_TYPES,
  METRIC_TYPES,
  PromptRegistry,
  PromptVersioning,
  PromptTemplates,
  PromptVariables,
  PromptSnapshots,
  PromptHistory,
  ExperimentManager,
  ExperimentRunner,
  ExperimentStorage,
  ExperimentComparator,
  ExperimentMetrics,
  ABTesting,
  TrafficSplitter,
  ResultAggregator,
  WinnerSelector,
  BenchmarkManager,
  BenchmarkSuites,
  BenchmarkRunner,
  BenchmarkDatasets,
  BenchmarkResults,
  ModelComparison,
  QualityScoring,
  LatencyScoring,
  CostScoring,
  HallucinationDetector,
  ConsistencyEvaluator,
  AgentEvaluator,
  WorkflowEvaluator,
  ConversationEvaluator,
  PlannerEvaluator,
  GeneratorEvaluator,
  JudgeEngine,
  JudgePrompts,
  RubricEngine,
  ScoreNormalizer,
  DatasetManager,
  DatasetRegistry,
  DatasetImporter,
  DatasetExporter,
  DatasetVersioning,
  FeedbackCollector,
  FeedbackAggregator,
  RecommendationEngine,
  ImprovementPlanner,
  AiEvaluationIntegration,
};
