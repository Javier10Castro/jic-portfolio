const { ArchitectureManager } = require('./architectureManager');
const { SolutionArchitect } = require('./solutionArchitect');
const { ArchitecturePlanner } = require('./architecturePlanner');
const { ArchitectureValidator } = require('./architectureValidator');
const { ArchitectureStorage } = require('./architectureStorage');
const { ArchitectureEvents } = require('./architectureEvents');
const { ArchitectureMetrics } = require('./architectureMetrics');
const { ArchitectureReporter } = require('./architectureReporter');
const { PatternRegistry } = require('./patternRegistry');
const { PatternSelector } = require('./patternSelector');
const { PatternEvaluator } = require('./patternEvaluator');
const { PatternScoring } = require('./patternScoring');
const { DecisionManager } = require('./decisionManager');
const { DecisionLog } = require('./decisionLog');
const { ArchitectureDecisionRecord } = require('./architectureDecisionRecord');
const { Alternatives } = require('./alternatives');
const { Rationale } = require('./rationale');
const { RequirementsAnalyzer } = require('./requirementsAnalyzer');
const { ConstraintAnalyzer } = require('./constraintAnalyzer');
const { RiskAnalyzer } = require('./riskAnalyzer');
const { TradeoffAnalyzer } = require('./tradeoffAnalyzer');
const { QualityAttributeAnalyzer } = require('./qualityAttributeAnalyzer');
const { SolutionDefinition } = require('./solutionDefinition');
const { SolutionBlueprint } = require('./solutionBlueprint');
const { SystemTopology } = require('./systemTopology');
const { BoundedContexts } = require('./boundedContexts');
const { DomainModel } = require('./domainModel');
const { CapabilityMap } = require('./capabilityMap');
const { DependencyMap } = require('./dependencyMap');
const { Availability } = require('./availability');
const { Security } = require('./security');
const { Performance } = require('./performance');
const { Scalability } = require('./scalability');
const { Maintainability } = require('./maintainability');
const { Cost } = require('./cost');
const { Operability } = require('./operability');
const { DefaultPatterns } = require('./defaultPatterns');

function getDefaultArchitect() {
  return new ArchitectureManager();
}

module.exports = {
  ArchitectureManager,
  SolutionArchitect,
  ArchitecturePlanner,
  ArchitectureValidator,
  ArchitectureStorage,
  ArchitectureEvents,
  ArchitectureMetrics,
  ArchitectureReporter,
  PatternRegistry,
  PatternSelector,
  PatternEvaluator,
  PatternScoring,
  DecisionManager,
  DecisionLog,
  ArchitectureDecisionRecord,
  Alternatives,
  Rationale,
  RequirementsAnalyzer,
  ConstraintAnalyzer,
  RiskAnalyzer,
  TradeoffAnalyzer,
  QualityAttributeAnalyzer,
  SolutionDefinition,
  SolutionBlueprint,
  SystemTopology,
  BoundedContexts,
  DomainModel,
  CapabilityMap,
  DependencyMap,
  Availability,
  Security,
  Performance,
  Scalability,
  Maintainability,
  Cost,
  Operability,
  DefaultPatterns,
  getDefaultArchitect
};
