const { Router } = require('express');

const healthRoutes = require('./routes/healthRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const projectRoutes = require('./routes/projectRoutes');
const pipelineRoutes = require('./routes/pipelineRoutes');
const deploymentRoutes = require('./routes/deploymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const apikeyRoutes = require('./routes/apikeyRoutes');
const generationRoutes = require('./routes/generationRoutes');
const contextRoutes = require('./routes/contextRoutes');
const plannerRoutes = require('./routes/plannerRoutes');
const aiRoutes = require('./routes/aiRoutes');
const agentRoutes = require('./routes/agentRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const clusterRoutes = require('./routes/clusterRoutes');
const { createControlPlaneRoutes } = require('./routes/controlPlaneRoutes');
const { createCostRoutes } = require('./routes/costRoutes');
const { createSecurityRoutes } = require('./routes/securityRoutes');

const { errorHandler } = require('./middleware');

function buildRouter() {
  const apiRouter = Router();

  apiRouter.use('/', healthRoutes);
  apiRouter.use('/conversations', conversationRoutes);
  apiRouter.use('/projects', projectRoutes);
  apiRouter.use('/pipeline', pipelineRoutes);
  apiRouter.use('/deploy', deploymentRoutes);
  apiRouter.use('/deployments', deploymentRoutes);
  apiRouter.use('/dashboard', dashboardRoutes);
  apiRouter.use('/workspace', workspaceRoutes);
  apiRouter.use('/apikeys', apikeyRoutes);
  apiRouter.use('/generate', generationRoutes);
  apiRouter.use('/context', contextRoutes);
  apiRouter.use('/planner', plannerRoutes);
  apiRouter.use('/ai', aiRoutes);
  apiRouter.use('/agents', agentRoutes);
  apiRouter.use('/workflows', workflowRoutes);
  apiRouter.use('/telemetry', telemetryRoutes);
  apiRouter.use('/cluster', clusterRoutes);
  apiRouter.use('/control-plane', createControlPlaneRoutes());
  apiRouter.use('/cost', createCostRoutes());
  apiRouter.use('/security', createSecurityRoutes());

  apiRouter.use(errorHandler);

  return apiRouter;
}

module.exports = { buildRouter };
