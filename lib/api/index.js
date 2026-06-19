const { createApp, startServer } = require('./server');
const { buildRouter } = require('./router');
const middleware = require('./middleware');
const errors = require('./errors');
const responses = require('./responses');

const controllers = {
  health: require('./controllers/healthController'),
  conversation: require('./controllers/conversationController'),
  project: require('./controllers/projectController'),
  pipeline: require('./controllers/pipelineController'),
  deployment: require('./controllers/deploymentController'),
  dashboard: require('./controllers/dashboardController'),
  workspace: require('./controllers/workspaceController'),
  apikey: require('./controllers/apikeyController'),
  generation: require('./controllers/generationController'),
  context: require('./controllers/contextController'),
  planner: require('./controllers/plannerController'),
  ai: require('./controllers/aiController'),
  agent: require('./controllers/agentController'),
  workflow: require('./controllers/workflowController'),
  telemetry: require('./controllers/telemetryController'),
  cluster: require('./controllers/clusterController'),
};

module.exports = {
  createApp,
  startServer,
  buildRouter,
  middleware,
  errors,
  responses,
  controllers,
};
