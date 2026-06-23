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

class EvolutionManager {
  constructor() {
    this._solutionEvolution = new SolutionEvolution();
    this._evolutionPlanner = new EvolutionPlanner();
    this._evolutionEngine = new EvolutionEngine();
    this._evolutionStorage = new EvolutionStorage();
    this._evolutionEvents = new EvolutionEvents();
    this._evolutionMetrics = new EvolutionMetrics();
    this._evolutionReporter = new EvolutionReporter();
    this._architectureAnalyzer = new ArchitectureAnalyzer();
    this._dependencyAnalyzer = new DependencyAnalyzer();
    this._complexityAnalyzer = new ComplexityAnalyzer();
    this._performanceAnalyzer = new PerformanceAnalyzer();
    this._securityAnalyzer = new SecurityAnalyzer();
    this._costAnalyzer = new CostAnalyzer();
    this._maintainabilityAnalyzer = new MaintainabilityAnalyzer();
    this._technicalDebtAnalyzer = new TechnicalDebtAnalyzer();
    this._scalabilityAnalyzer = new ScalabilityAnalyzer();
    this._availabilityAnalyzer = new AvailabilityAnalyzer();
    this._improvementPlanner = new ImprovementPlanner();
    this._migrationPlanner = new MigrationPlanner();
    this._refactorPlanner = new RefactorPlanner();
    this._optimizationPlanner = new OptimizationPlanner();
    this._upgradePlanner = new UpgradePlanner();
    this._moduleSplit = new ModuleSplit();
    this._moduleMerge = new ModuleMerge();
    this._dependencyCleanup = new DependencyCleanup();
    this._architectureRefactor = new ArchitectureRefactor();
    this._workflowOptimization = new WorkflowOptimization();
    this._agentOptimization = new AgentOptimization();
    this._debtRegistry = new DebtRegistry();
    this._debtPrioritizer = new DebtPrioritizer();
    this._debtScoring = new DebtScoring();
    this._debtReporter = new DebtReporter();
    this._evolutionPolicies = new EvolutionPolicies();
    this._evolutionConstraints = new EvolutionConstraints();
    this._evolutionSimulation = new EvolutionSimulation();
    this._evolutionValidator = new EvolutionValidator();
    this._roadmapBuilder = new RoadmapBuilder();
    this._releaseRecommendations = new ReleaseRecommendations();
    this._architectureTimeline = new ArchitectureTimeline();
    this._initializedAt = new Date().toISOString();
  }

  get solutionEvolution() { return this._solutionEvolution; }
  get evolutionPlanner() { return this._evolutionPlanner; }
  get evolutionEngine() { return this._evolutionEngine; }
  get evolutionStorage() { return this._evolutionStorage; }
  get evolutionEvents() { return this._evolutionEvents; }
  get evolutionMetrics() { return this._evolutionMetrics; }
  get evolutionReporter() { return this._evolutionReporter; }
  get architectureAnalyzer() { return this._architectureAnalyzer; }
  get dependencyAnalyzer() { return this._dependencyAnalyzer; }
  get complexityAnalyzer() { return this._complexityAnalyzer; }
  get performanceAnalyzer() { return this._performanceAnalyzer; }
  get securityAnalyzer() { return this._securityAnalyzer; }
  get costAnalyzer() { return this._costAnalyzer; }
  get maintainabilityAnalyzer() { return this._maintainabilityAnalyzer; }
  get technicalDebtAnalyzer() { return this._technicalDebtAnalyzer; }
  get scalabilityAnalyzer() { return this._scalabilityAnalyzer; }
  get availabilityAnalyzer() { return this._availabilityAnalyzer; }
  get improvementPlanner() { return this._improvementPlanner; }
  get migrationPlanner() { return this._migrationPlanner; }
  get refactorPlanner() { return this._refactorPlanner; }
  get optimizationPlanner() { return this._optimizationPlanner; }
  get upgradePlanner() { return this._upgradePlanner; }
  get moduleSplit() { return this._moduleSplit; }
  get moduleMerge() { return this._moduleMerge; }
  get dependencyCleanup() { return this._dependencyCleanup; }
  get architectureRefactor() { return this._architectureRefactor; }
  get workflowOptimization() { return this._workflowOptimization; }
  get agentOptimization() { return this._agentOptimization; }
  get debtRegistry() { return this._debtRegistry; }
  get debtPrioritizer() { return this._debtPrioritizer; }
  get debtScoring() { return this._debtScoring; }
  get debtReporter() { return this._debtReporter; }
  get evolutionPolicies() { return this._evolutionPolicies; }
  get evolutionConstraints() { return this._evolutionConstraints; }
  get evolutionSimulation() { return this._evolutionSimulation; }
  get evolutionValidator() { return this._evolutionValidator; }
  get roadmapBuilder() { return this._roadmapBuilder; }
  get releaseRecommendations() { return this._releaseRecommendations; }
  get architectureTimeline() { return this._architectureTimeline; }

  getStatus() {
    return {
      initialized: true,
      initializedAt: this._initializedAt,
      submodules: {
        solutionEvolution: this._solutionEvolution !== null,
        evolutionPlanner: this._evolutionPlanner !== null,
        evolutionEngine: this._evolutionEngine !== null,
        evolutionStorage: this._evolutionStorage !== null,
        evolutionEvents: this._evolutionEvents !== null,
        evolutionMetrics: this._evolutionMetrics !== null,
        evolutionReporter: this._evolutionReporter !== null,
        architectureAnalyzer: this._architectureAnalyzer !== null,
        dependencyAnalyzer: this._dependencyAnalyzer !== null,
        complexityAnalyzer: this._complexityAnalyzer !== null,
        performanceAnalyzer: this._performanceAnalyzer !== null,
        securityAnalyzer: this._securityAnalyzer !== null,
        costAnalyzer: this._costAnalyzer !== null,
        maintainabilityAnalyzer: this._maintainabilityAnalyzer !== null,
        technicalDebtAnalyzer: this._technicalDebtAnalyzer !== null,
        scalabilityAnalyzer: this._scalabilityAnalyzer !== null,
        availabilityAnalyzer: this._availabilityAnalyzer !== null,
        improvementPlanner: this._improvementPlanner !== null,
        migrationPlanner: this._migrationPlanner !== null,
        refactorPlanner: this._refactorPlanner !== null,
        optimizationPlanner: this._optimizationPlanner !== null,
        upgradePlanner: this._upgradePlanner !== null,
        moduleSplit: this._moduleSplit !== null,
        moduleMerge: this._moduleMerge !== null,
        dependencyCleanup: this._dependencyCleanup !== null,
        architectureRefactor: this._architectureRefactor !== null,
        workflowOptimization: this._workflowOptimization !== null,
        agentOptimization: this._agentOptimization !== null,
        debtRegistry: this._debtRegistry !== null,
        debtPrioritizer: this._debtPrioritizer !== null,
        debtScoring: this._debtScoring !== null,
        debtReporter: this._debtReporter !== null,
        evolutionPolicies: this._evolutionPolicies !== null,
        evolutionConstraints: this._evolutionConstraints !== null,
        evolutionSimulation: this._evolutionSimulation !== null,
        evolutionValidator: this._evolutionValidator !== null,
        roadmapBuilder: this._roadmapBuilder !== null,
        releaseRecommendations: this._releaseRecommendations !== null,
        architectureTimeline: this._architectureTimeline !== null
      }
    };
  }

  clear() {
    this._solutionEvolution.clear();
    this._evolutionPlanner.clear();
    this._evolutionEngine.clear();
    this._evolutionStorage.clear();
    this._evolutionEvents.clear();
    this._evolutionMetrics.clear();
    this._evolutionReporter.clear();
    this._architectureAnalyzer.clear();
    this._dependencyAnalyzer.clear();
    this._complexityAnalyzer.clear();
    this._performanceAnalyzer.clear();
    this._securityAnalyzer.clear();
    this._costAnalyzer.clear();
    this._maintainabilityAnalyzer.clear();
    this._technicalDebtAnalyzer.clear();
    this._scalabilityAnalyzer.clear();
    this._availabilityAnalyzer.clear();
    this._improvementPlanner.clear();
    this._migrationPlanner.clear();
    this._refactorPlanner.clear();
    this._optimizationPlanner.clear();
    this._upgradePlanner.clear();
    this._moduleSplit.clear();
    this._moduleMerge.clear();
    this._dependencyCleanup.clear();
    this._architectureRefactor.clear();
    this._workflowOptimization.clear();
    this._agentOptimization.clear();
    this._debtRegistry.clear();
    this._debtPrioritizer.clear();
    this._debtScoring.clear();
    this._debtReporter.clear();
    this._evolutionPolicies.clear();
    this._evolutionConstraints.clear();
    this._evolutionSimulation.clear();
    this._evolutionValidator.clear();
    this._roadmapBuilder.clear();
    this._releaseRecommendations.clear();
    this._architectureTimeline.clear();
  }
}

module.exports = { EvolutionManager };
