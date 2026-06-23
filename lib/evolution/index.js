const { EvolutionManager } = require('./evolutionManager');
const { SolutionEvolution } = require('./solutionEvolution');
const { EvolutionPlanner } = require('./evolutionPlanner');
const { EvolutionEngine } = require('./evolutionEngine');
const { EvolutionStorage } = require('./evolutionStorage');
const { EvolutionEvents } = require('./evolutionEvents');
const { EvolutionMetrics } = require('./evolutionMetrics');
const { EvolutionReporter } = require('./evolutionReporter');
const { ArchitectureAnalyzer } = require('./architectureAnalyzer');
const { DependencyAnalyzer } = require('./dependencyAnalyzer');
const { ComplexityAnalyzer } = require('./complexityAnalyzer');
const { PerformanceAnalyzer } = require('./performanceAnalyzer');
const { SecurityAnalyzer } = require('./securityAnalyzer');
const { CostAnalyzer } = require('./costAnalyzer');
const { MaintainabilityAnalyzer } = require('./maintainabilityAnalyzer');
const { TechnicalDebtAnalyzer } = require('./technicalDebtAnalyzer');
const { ScalabilityAnalyzer } = require('./scalabilityAnalyzer');
const { AvailabilityAnalyzer } = require('./availabilityAnalyzer');
const { ImprovementPlanner } = require('./improvementPlanner');
const { MigrationPlanner } = require('./migrationPlanner');
const { RefactorPlanner } = require('./refactorPlanner');
const { OptimizationPlanner } = require('./optimizationPlanner');
const { UpgradePlanner } = require('./upgradePlanner');
const { ModuleSplit } = require('./moduleSplit');
const { ModuleMerge } = require('./moduleMerge');
const { DependencyCleanup } = require('./dependencyCleanup');
const { ArchitectureRefactor } = require('./architectureRefactor');
const { WorkflowOptimization } = require('./workflowOptimization');
const { AgentOptimization } = require('./agentOptimization');
const { DebtRegistry } = require('./debtRegistry');
const { DebtPrioritizer } = require('./debtPrioritizer');
const { DebtScoring } = require('./debtScoring');
const { DebtReporter } = require('./debtReporter');
const { EvolutionPolicies } = require('./evolutionPolicies');
const { EvolutionConstraints } = require('./evolutionConstraints');
const { EvolutionSimulation } = require('./evolutionSimulation');
const { EvolutionValidator } = require('./evolutionValidator');
const { RoadmapBuilder } = require('./roadmapBuilder');
const { ReleaseRecommendations } = require('./releaseRecommendations');
const { ArchitectureTimeline } = require('./architectureTimeline');

function getDefaultEvolutionManager() {
  return new EvolutionManager();
}

module.exports = {
  EvolutionManager,
  SolutionEvolution,
  EvolutionPlanner,
  EvolutionEngine,
  EvolutionStorage,
  EvolutionEvents,
  EvolutionMetrics,
  EvolutionReporter,
  ArchitectureAnalyzer,
  DependencyAnalyzer,
  ComplexityAnalyzer,
  PerformanceAnalyzer,
  SecurityAnalyzer,
  CostAnalyzer,
  MaintainabilityAnalyzer,
  TechnicalDebtAnalyzer,
  ScalabilityAnalyzer,
  AvailabilityAnalyzer,
  ImprovementPlanner,
  MigrationPlanner,
  RefactorPlanner,
  OptimizationPlanner,
  UpgradePlanner,
  ModuleSplit,
  ModuleMerge,
  DependencyCleanup,
  ArchitectureRefactor,
  WorkflowOptimization,
  AgentOptimization,
  DebtRegistry,
  DebtPrioritizer,
  DebtScoring,
  DebtReporter,
  EvolutionPolicies,
  EvolutionConstraints,
  EvolutionSimulation,
  EvolutionValidator,
  RoadmapBuilder,
  ReleaseRecommendations,
  ArchitectureTimeline,
  getDefaultEvolutionManager
};
