const RuntimeManager = require('./runtimeManager');
const RuntimeRegistry = require('./runtimeRegistry');
const RuntimeStorage = require('./runtimeStorage');
const RuntimeEvents = require('./runtimeEvents');
const RuntimeMetrics = require('./runtimeMetrics');
const RuntimeHealth = require('./runtimeHealth');
const RuntimeScheduler = require('./runtimeScheduler');
const RuntimeHistory = require('./runtimeHistory');
const RuntimeReporter = require('./runtimeReporter');

function getDefaultRuntime(options) {
  if (!getDefaultRuntime._instance) getDefaultRuntime._instance = new RuntimeManager.RuntimeManager(options);
  return getDefaultRuntime._instance;
}

module.exports = {
  RuntimeManager: require('./runtimeManager').RuntimeManager,
  RuntimeRegistry: require('./runtimeRegistry').RuntimeRegistry,
  RuntimeStorage: require('./runtimeStorage').RuntimeStorage,
  RuntimeEvents: require('./runtimeEvents').RuntimeEvents,
  RuntimeMetrics: require('./runtimeMetrics').RuntimeMetrics,
  RuntimeHealth: require('./runtimeHealth').RuntimeHealth,
  RuntimeScheduler: require('./runtimeScheduler').RuntimeScheduler,
  RuntimeHistory: require('./runtimeHistory').RuntimeHistory,
  RuntimeReporter: require('./runtimeReporter').RuntimeReporter,
  getDefaultRuntime,
};
