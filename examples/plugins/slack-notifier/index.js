const { createPlugin } = require('../../../lib/plugin-sdk');

const manifest = require('./plugin.json');
const plugin = createPlugin(manifest);

plugin.registerHook('afterDeployment', (context) => {
  const { project, status, url } = context;
  return { notified: true, channel: '#deployments', message: `Deployed ${project || 'project'} (${status}) to ${url || 'unknown'}` };
});

plugin.registerHook('afterBilling', (context) => {
  const { amount, customer, invoice } = context;
  return { notified: true, channel: '#billing', message: `Invoice ${invoice || 'unknown'}: $${amount || 0} for ${customer || 'unknown'}` };
});

plugin.onLoad = function() { console.log('Slack Notifier loaded'); };

module.exports = plugin;
