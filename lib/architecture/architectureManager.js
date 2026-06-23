const { ArchitecturePlanner } = require('./architecturePlanner');
const { ArchitectureValidator } = require('./architectureValidator');
const { ArchitectureStorage } = require('./architectureStorage');
const { ArchitectureEvents } = require('./architectureEvents');
const { ArchitectureMetrics } = require('./architectureMetrics');
const { ArchitectureReporter } = require('./architectureReporter');
const { SolutionArchitect } = require('./solutionArchitect');
const { PatternRegistry } = require('./patternRegistry');
const { DecisionManager } = require('./decisionManager');
const { QualityAttributeAnalyzer } = require('./qualityAttributeAnalyzer');
const { RiskAnalyzer } = require('./riskAnalyzer');
const { TradeoffAnalyzer } = require('./tradeoffAnalyzer');
const { ConstraintAnalyzer } = require('./constraintAnalyzer');
const { RequirementsAnalyzer } = require('./requirementsAnalyzer');
const { SolutionBlueprint } = require('./solutionBlueprint');
const { SystemTopology } = require('./systemTopology');

class ArchitectureManager {
  constructor() {
    const { ArchitectureIntegration } = require('./architectureIntegration');
    this._architectureIntegration = new ArchitectureIntegration(this);
    this._architecturePlanner = new ArchitecturePlanner();
    this._architectureValidator = new ArchitectureValidator();
    this._architectureStorage = new ArchitectureStorage();
    this._architectureEvents = new ArchitectureEvents();
    this._architectureMetrics = new ArchitectureMetrics();
    this._architectureReporter = new ArchitectureReporter();
    this._solutionArchitect = new SolutionArchitect();
    this._patternRegistry = new PatternRegistry();
    this._decisionManager = new DecisionManager();
    this._qualityAttributeAnalyzer = new QualityAttributeAnalyzer();
    this._riskAnalyzer = new RiskAnalyzer();
    this._tradeoffAnalyzer = new TradeoffAnalyzer();
    this._constraintAnalyzer = new ConstraintAnalyzer();
    this._requirementsAnalyzer = new RequirementsAnalyzer();
    this._solutionBlueprint = new SolutionBlueprint();
    this._systemTopology = new SystemTopology();
    this._initializedAt = new Date().toISOString();
  }

  get architectureIntegration() { return this._architectureIntegration; }
  get architecturePlanner() { return this._architecturePlanner; }
  get architectureValidator() { return this._architectureValidator; }
  get architectureStorage() { return this._architectureStorage; }
  get architectureEvents() { return this._architectureEvents; }
  get architectureMetrics() { return this._architectureMetrics; }
  get architectureReporter() { return this._architectureReporter; }
  get solutionArchitect() { return this._solutionArchitect; }
  get patternRegistry() { return this._patternRegistry; }
  get decisionManager() { return this._decisionManager; }
  get qualityAttributeAnalyzer() { return this._qualityAttributeAnalyzer; }
  get riskAnalyzer() { return this._riskAnalyzer; }
  get tradeoffAnalyzer() { return this._tradeoffAnalyzer; }
  get constraintAnalyzer() { return this._constraintAnalyzer; }
  get requirementsAnalyzer() { return this._requirementsAnalyzer; }
  get solutionBlueprint() { return this._solutionBlueprint; }
  get systemTopology() { return this._systemTopology; }

  getStatus() {
    return {
      initialized: true,
      initializedAt: this._initializedAt,
      submodules: {
        architecturePlanner: this._architecturePlanner !== null,
        architectureValidator: this._architectureValidator !== null,
        architectureStorage: this._architectureStorage !== null,
        architectureEvents: this._architectureEvents !== null,
        architectureMetrics: this._architectureMetrics !== null,
        architectureReporter: this._architectureReporter !== null,
        solutionArchitect: this._solutionArchitect !== null,
        patternRegistry: this._patternRegistry !== null,
        decisionManager: this._decisionManager !== null,
        qualityAttributeAnalyzer: this._qualityAttributeAnalyzer !== null,
        riskAnalyzer: this._riskAnalyzer !== null,
        tradeoffAnalyzer: this._tradeoffAnalyzer !== null,
        constraintAnalyzer: this._constraintAnalyzer !== null,
        requirementsAnalyzer: this._requirementsAnalyzer !== null,
        solutionBlueprint: this._solutionBlueprint !== null,
        systemTopology: this._systemTopology !== null
      }
    };
  }

  clear() {
    this._architecturePlanner.clear();
    this._architectureValidator.clear();
    this._architectureStorage.clear();
    this._architectureEvents.clear();
    this._architectureMetrics.clear();
    this._architectureReporter.clear();
    this._solutionArchitect.clear();
    this._patternRegistry.clear();
    this._decisionManager.clear();
    this._qualityAttributeAnalyzer.clear();
    this._riskAnalyzer.clear();
    this._tradeoffAnalyzer.clear();
    this._constraintAnalyzer.clear();
    this._requirementsAnalyzer.clear();
    this._architectureIntegration.clear();
    this._solutionBlueprint.clear();
    this._systemTopology.clear();
  }
}

module.exports = { ArchitectureManager };
