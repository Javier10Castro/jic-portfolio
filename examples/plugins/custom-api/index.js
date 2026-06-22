const { createPlugin } = require('../../../lib/plugin-sdk');

const manifest = require('./plugin.json');
const plugin = createPlugin(manifest);

plugin.extendAPI('/api/v1/plugins/:id/health', (req, res) => {
  return { status: 'ok', pluginId: req.params.id, timestamp: Date.now(), uptime: process.uptime() };
}, 'GET');

plugin.extendAPI('/api/v1/plugins/:id/metrics', (req, res) => {
  return { pluginId: req.params.id, metrics: { requests: 1024, latency: 45, errors: 2 } };
}, 'GET');

plugin.onLoad = function() { console.log('Custom Health API loaded'); };

module.exports = plugin;
