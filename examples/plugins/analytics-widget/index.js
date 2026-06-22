const { createPlugin } = require('../../../lib/plugin-sdk');

const manifest = require('./plugin.json');
const plugin = createPlugin(manifest);

plugin.registerWidget('analytics-summary', (data) => {
  const { mrr, arr, users } = data || {};
  return `<div style="padding:16px;background:#14141f;border-radius:8px">
    <h3>Analytics Summary</h3>
    <p>MRR: $${mrr || 0}</p>
    <p>ARR: $${arr || 0}</p>
    <p>Users: ${users || 0}</p>
  </div>`;
}, { title: 'Analytics Summary', width: 2 });

plugin.onLoad = function() { console.log('Analytics Widget loaded'); };

module.exports = plugin;
