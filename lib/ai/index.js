const aiRouter = require('./router/aiRouter');
const { PROVIDERS, getProvider, listProviders, healthCheck } = require('./providers');
const normalization = require('./normalization');
const intelligence = require('./intelligence');
const router = require('./router');
const integration = require('./integration');

module.exports = {
  generate: aiRouter.generate,
  stream: aiRouter.stream,
  selectModel: aiRouter.selectModel,
  allModels: aiRouter.allModels,
  listProviders: aiRouter.listProviders,
  healthCheck: aiRouter.healthCheck,
  getMetrics: aiRouter.getMetrics,
  intelligence: aiRouter.intelligence,
  loadBalancer: aiRouter.loadBalancer,
  normalize: aiRouter.normalize,
  estimateTokens: aiRouter.estimateTokens,
  estimateMessages: aiRouter.estimateMessages,
  estimateCost: aiRouter.estimateCost,
  PROVIDERS,
  getProvider,
  normalization,
  intelligence,
  router,
  integration,
};
