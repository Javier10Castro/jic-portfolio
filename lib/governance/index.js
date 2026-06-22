const { GovernanceManager } = require('./governanceManager');
const { PolicyRegistry } = require('./policyRegistry');
const { PolicyCompiler } = require('./policyCompiler');
const { PolicyEvaluator } = require('./policyEvaluator');
const { PolicyExecutor } = require('./policyExecutor');
const { PolicyStorage } = require('./policyStorage');
const { PolicyEvents } = require('./policyEvents');
const { PolicyMetrics } = require('./policyMetrics');
const { PolicyScheduler } = require('./policyScheduler');
const { PolicySimulator } = require('./policySimulator');
const { PolicyReporter } = require('./policyReporter');

module.exports = {
  GovernanceManager,
  PolicyRegistry,
  PolicyCompiler,
  PolicyEvaluator,
  PolicyExecutor,
  PolicyStorage,
  PolicyEvents,
  PolicyMetrics,
  PolicyScheduler,
  PolicySimulator,
  PolicyReporter,
  getDefaultManager: () => new GovernanceManager(),
  createGovernanceManager: () => new GovernanceManager(),
};
