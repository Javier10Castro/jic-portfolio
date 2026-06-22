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
const { ComposerManager } = require('./composerManager');
const { ApplicationDefinition } = require('./applicationDefinition');
const { ApplicationManifest } = require('./applicationManifest');
const { ApplicationBlueprint } = require('./applicationBlueprint');
const { ApplicationCapabilities } = require('./applicationCapabilities');
const { ApplicationDependencies } = require('./applicationDependencies');
const { ApplicationTopology } = require('./applicationTopology');
const { ExecutionPlanner } = require('./executionPlanner');
const { ResourceAllocator } = require('./resourceAllocator');
const { ServiceComposer } = require('./serviceComposer');

function getDefaultComposer() {
  return new ComposerManager();
}

module.exports = {
  ApplicationComposer,
  CompositionEngine,
  CompositionPlanner,
  CompositionRegistry,
  CompositionValidator,
  CompositionStorage,
  CompositionMetrics,
  CompositionEvents,
  CompositionReporter,
  CapabilityRegistry,
  DependencyResolver,
  CompositionGraph,
  ComposerManager,
  ApplicationDefinition,
  ApplicationManifest,
  ApplicationBlueprint,
  ApplicationCapabilities,
  ApplicationDependencies,
  ApplicationTopology,
  ExecutionPlanner,
  ResourceAllocator,
  ServiceComposer,
  getDefaultComposer
};
