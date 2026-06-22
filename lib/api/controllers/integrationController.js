const { getDefaultEngine } = require('../../integrations');
const { success, error } = require('../responses/apiResponse');

const manager = getDefaultEngine();

function listIntegrations(req, res) {
  try {
    const filter = req.query.status ? { status: req.query.status } : undefined;
    const integrations = manager.listIntegrations(filter);
    success(res, { integrations });
  } catch (e) { error(res, e.message); }
}

function listInstalled(req, res) {
  try {
    const integrations = manager.listIntegrations({ status: 'connected' });
    success(res, { integrations });
  } catch (e) { error(res, e.message); }
}

function listProviders(req, res) {
  try {
    const providers = manager.getProviders();
    success(res, { providers });
  } catch (e) { error(res, e.message); }
}

function getProvider(req, res) {
  try {
    const providers = manager.getProviders();
    const provider = providers.find(p => p.id === req.params.provider);
    if (!provider) return error(res, 'Provider not found', 404);
    success(res, { provider });
  } catch (e) { error(res, e.message); }
}

function connectIntegration(req, res) {
  try {
    const { provider, config } = req.body;
    if (!provider) return error(res, 'Provider is required', 400);
    const result = manager.connect(provider, config || {});
    if (!result.success) return error(res, result.error, 400);
    success(res, { integration: result.integration });
  } catch (e) { error(res, e.message); }
}

function disconnectIntegration(req, res) {
  try {
    const provider = req.body.provider || req.params.provider;
    if (!provider) return error(res, 'Provider is required', 400);
    const result = manager.disconnect(provider);
    if (!result.success) return error(res, result.error, 404);
    success(res, { disconnected: true });
  } catch (e) { error(res, e.message); }
}

function syncIntegration(req, res) {
  try {
    const { provider, type } = req.body;
    if (!provider) return error(res, 'Provider is required', 400);
    const result = manager.startSync(provider, type || 'full');
    if (!result.success) return error(res, result.error, 400);
    success(res, { syncId: result.syncId });
  } catch (e) { error(res, e.message); }
}

function processWebhook(req, res) {
  try {
    const { provider, payload, signature } = req.body;
    if (!provider) return error(res, 'Provider is required', 400);
    const result = manager.processIncomingWebhook(provider, payload || {}, signature || '');
    if (!result.success) return error(res, result.error, 400);
    success(res, { processed: true });
  } catch (e) { error(res, e.message); }
}

function getHealth(req, res) {
  try {
    const provider = req.query.provider;
    if (provider) {
      const health = manager.getHealth(provider);
      return success(res, { health });
    }
    const allHealth = manager.getAllHealth();
    success(res, { health: allHealth });
  } catch (e) { error(res, e.message); }
}

function getEvents(req, res) {
  try {
    const filter = req.query.event || undefined;
    const events = manager.getEvents(filter);
    success(res, { events });
  } catch (e) { error(res, e.message); }
}

function getStatus(req, res) {
  try {
    const status = manager.getStatus();
    success(res, { status });
  } catch (e) { error(res, e.message); }
}

module.exports = { listIntegrations, listInstalled, listProviders, getProvider, connectIntegration, disconnectIntegration, syncIntegration, processWebhook, getHealth, getEvents, getStatus };
