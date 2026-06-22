const { createPlugin } = require('../../../lib/plugin-sdk');

const manifest = require('./plugin.json');
const plugin = createPlugin(manifest);

const pendingApprovals = {};

plugin.registerHook('beforeDeployment', (context) => {
  const { project, environment } = context;
  const approvalId = `approval-${Date.now()}`;
  pendingApprovals[approvalId] = { project, environment, status: 'pending', createdAt: Date.now() };
  return { blocked: true, approvalId, message: `Deployment to ${environment || 'production'} requires manual approval` };
});

plugin.extendWorkflow('approval', (context) => {
  const { approvalId, approve } = context;
  if (pendingApprovals[approvalId]) {
    pendingApprovals[approvalId].status = approve ? 'approved' : 'rejected';
    pendingApprovals[approvalId].resolvedAt = Date.now();
  }
  return { approved: approve, approvalId };
});

plugin.getPendingApprovals = () => Object.values(pendingApprovals).filter(a => a.status === 'pending');
plugin.onLoad = function() { console.log('Workflow Approval Gate loaded'); };

module.exports = plugin;
