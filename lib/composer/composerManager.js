const { ApplicationComposer } = require('./applicationComposer');
const { CompositionEngine } = require('./compositionEngine');
const { CompositionPlanner } = require('./compositionPlanner');
const { CompositionRegistry } = require('./compositionRegistry');
const { CompositionValidator } = require('./compositionValidator');
const { CompositionStorage } = require('./compositionStorage');
const { CompositionMetrics } = require('./compositionMetrics');
const { CompositionEvents } = require('./compositionEvents');
const { CompositionReporter } = require('./compositionReporter');
const { CapabilityRegistry } = require('./capabilityRegistry');
const { DependencyResolver } = require('./dependencyResolver');
const { CompositionGraph } = require('./compositionGraph');

class ComposerManager {
  constructor() {
    const { ComposerIntegration } = require('./composerIntegration');
    this._composerIntegration = new ComposerIntegration(this);
    this._applicationComposer = new ApplicationComposer();
    this._compositionEngine = new CompositionEngine();
    this._compositionPlanner = new CompositionPlanner();
    this._compositionRegistry = new CompositionRegistry();
    this._compositionValidator = new CompositionValidator();
    this._compositionStorage = new CompositionStorage();
    this._compositionMetrics = new CompositionMetrics();
    this._compositionEvents = new CompositionEvents();
    this._compositionReporter = new CompositionReporter();
    this._capabilityRegistry = new CapabilityRegistry();
    this._dependencyResolver = new DependencyResolver();
    this._compositionGraph = new CompositionGraph();
    this._initializedAt = new Date().toISOString();
  }

  get applicationComposer() {
    return this._applicationComposer;
  }

  get compositionEngine() {
    return this._compositionEngine;
  }

  get compositionPlanner() {
    return this._compositionPlanner;
  }

  get compositionRegistry() {
    return this._compositionRegistry;
  }

  get compositionValidator() {
    return this._compositionValidator;
  }

  get compositionStorage() {
    return this._compositionStorage;
  }

  get compositionMetrics() {
    return this._compositionMetrics;
  }

  get compositionEvents() {
    return this._compositionEvents;
  }

  get compositionReporter() {
    return this._compositionReporter;
  }

  get capabilityRegistry() {
    return this._capabilityRegistry;
  }

  get dependencyResolver() {
    return this._dependencyResolver;
  }

  get compositionGraph() {
    return this._compositionGraph;
  }

  get composerIntegration() { return this._composerIntegration; }

  getStatus() {
    return {
      initialized: true,
      initializedAt: this._initializedAt,
      submodules: {
        applicationComposer: this._applicationComposer !== null,
        compositionEngine: this._compositionEngine !== null,
        compositionPlanner: this._compositionPlanner !== null,
        compositionRegistry: this._compositionRegistry !== null,
        compositionValidator: this._compositionValidator !== null,
        compositionStorage: this._compositionStorage !== null,
        compositionMetrics: this._compositionMetrics !== null,
        compositionEvents: this._compositionEvents !== null,
        compositionReporter: this._compositionReporter !== null,
        capabilityRegistry: this._capabilityRegistry !== null,
        dependencyResolver: this._dependencyResolver !== null,
        compositionGraph: this._compositionGraph !== null
      }
    };
  }

  clear() {
    this._applicationComposer.clear();
    this._compositionEngine.clear();
    this._compositionPlanner.clear();
    this._compositionRegistry.clear();
    this._compositionValidator.clear();
    this._compositionStorage.clear();
    this._compositionMetrics.clear();
    this._compositionEvents.clear();
    this._compositionReporter.clear();
    this._capabilityRegistry.clear();
    this._dependencyResolver.clear();
    this._compositionGraph.clear();
    this._composerIntegration.clear();
  }
}

module.exports = { ComposerManager };
