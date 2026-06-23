const { Plugin, createPlugin } = require('./Plugin');
const { Hook } = require('./Hook');
const { Command, createCommand } = require('./Command');
const { Widget, createWidget } = require('./Widget');
const { ApiExtension, createApiExtension } = require('./ApiExtension');
const { WorkflowExtension, createWorkflowExtension } = require('./WorkflowExtension');
const { AgentExtension, createAgentExtension } = require('./AgentExtension');
const { GeneratorExtension, createGeneratorExtension } = require('./GeneratorExtension');
const { StorageExtension } = require('./StorageExtension');
const { PluginLogger } = require('./Logger');
const { PluginConfig } = require('./Config');
const { Integration, createIntegration } = require('./Integration');
const { Webhook, createWebhook } = require('./Webhook');
const { OAuthProvider, createOAuthProvider } = require('./OAuthProvider');
const { EvaluationMetric, createEvaluationMetric } = require('./EvaluationMetric');
const { EvaluationExtension, createEvaluationExtension } = require('./EvaluationExtension');
const { PolicyProvider } = require('./PolicyProvider');
const { ComplianceTemplate } = require('./ComplianceTemplate');
const { ApprovalRule } = require('./ApprovalRule');
const { StorageProvider } = require('./StorageProvider');
const { DatabaseProvider } = require('./DatabaseProvider');
const { EmbeddingProvider } = require('./EmbeddingProvider');
const { SearchProvider } = require('./SearchProvider');
const { BackupProvider } = require('./BackupProvider');
const { ConfigurationProvider } = require('./ConfigurationProvider');
const { FeatureFlagProvider } = require('./FeatureFlagProvider');
const { SecretProvider } = require('./SecretProvider');
const { RuntimeHook } = require('./RuntimeHook');
const { RolloutProvider } = require('./RolloutProvider');
const { ProjectTemplate } = require('./ProjectTemplate');
const { LifecycleHook } = require('./LifecycleHook');
const { MigrationProvider } = require('./MigrationProvider');
const { SnapshotProvider } = require('./SnapshotProvider');
const { ReleaseValidator } = require('./ReleaseValidator');
const { AppTemplate } = require('./AppTemplate');
const { ArchitecturePattern } = require('./ArchitecturePattern');
const { BlueprintExporter } = require('./BlueprintExporter');
const { CapabilityProvider } = require('./CapabilityProvider');
const { CompositionRule } = require('./CompositionRule');
const { DecisionValidator } = require('./DecisionValidator');
const { GraphBuilder } = require('./GraphBuilder');
const { QualityAnalyzer } = require('./QualityAnalyzer');
const { TopologyBuilder } = require('./TopologyBuilder');
const { EvolutionAnalyzer } = require('./EvolutionAnalyzer');
const { OptimizationPlanner } = require('./OptimizationPlanner');
const { RefactorStrategy } = require('./RefactorStrategy');
const { DebtAnalyzer } = require('./DebtAnalyzer');
const { RoadmapGenerator } = require('./RoadmapGenerator');
const { KnowledgeProvider } = require('./KnowledgeProvider');
const { KnowledgeExtractor } = require('./KnowledgeExtractor');
const { GraphEnricher } = require('./GraphEnricher');
const { RecommendationProvider } = require('./RecommendationProvider');
const { PatternAnalyzer } = require('./PatternAnalyzer');

module.exports = {
  Plugin, createPlugin,
  Hook,
  Command, createCommand,
  Widget, createWidget,
  ApiExtension, createApiExtension,
  WorkflowExtension, createWorkflowExtension,
  AgentExtension, createAgentExtension,
  GeneratorExtension, createGeneratorExtension,
  StorageExtension,
  PluginLogger,
  PluginConfig,
  Integration, createIntegration,
  Webhook, createWebhook,
  OAuthProvider, createOAuthProvider,
  EvaluationMetric, createEvaluationMetric,
  EvaluationExtension, createEvaluationExtension,
  PolicyProvider,
  ComplianceTemplate,
  ApprovalRule,
  StorageProvider,
  DatabaseProvider,
  EmbeddingProvider,
  SearchProvider,
  BackupProvider,
  ConfigurationProvider,
  FeatureFlagProvider,
  SecretProvider,
  RuntimeHook,
  RolloutProvider,
  ProjectTemplate,
  LifecycleHook,
  MigrationProvider,
  SnapshotProvider,
  ReleaseValidator,
  AppTemplate,
  ArchitecturePattern,
  BlueprintExporter,
  CapabilityProvider,
  CompositionRule,
  DecisionValidator,
  GraphBuilder,
  QualityAnalyzer,
  TopologyBuilder,
  EvolutionAnalyzer,
  OptimizationPlanner,
  RefactorStrategy,
  DebtAnalyzer,
  RoadmapGenerator,
  KnowledgeProvider,
  KnowledgeExtractor,
  GraphEnricher,
  RecommendationProvider,
  PatternAnalyzer,
};
