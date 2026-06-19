const RemediationEngine = require('./remediationEngine');
const { RemediationActions, ACTIONS } = require('./remediationActions');
const { RemediationPolicies, DEFAULT_POLICIES } = require('./remediationPolicies');
const RemediationStore = require('./remediationStore');
const RemediationAPI = require('./remediationAPI');

let _defaultEngine = null;

function createRemediationEngine(options = {}) {
  return new RemediationEngine(options);
}

function getRemediationEngine() {
  if (!_defaultEngine) _defaultEngine = createRemediationEngine();
  return _defaultEngine;
}

function resetDefaultEngine() {
  _defaultEngine = null;
}

function attachToEventBus(eventBus, engine) {
  const eng = engine || getRemediationEngine();
  const off = eventBus.on('*', (event) => {
    if (!event.type || event.type.startsWith('remediation.')) return;
    if (event.type.startsWith('intelligence.')) {
      eng.ingest(event);
    }
  });
  return off;
}

module.exports = {
  RemediationEngine,
  RemediationActions,
  RemediationPolicies,
  RemediationStore,
  RemediationAPI,
  ACTIONS,
  DEFAULT_POLICIES,
  createRemediationEngine,
  getRemediationEngine,
  resetDefaultEngine,
  attachToEventBus,
};
