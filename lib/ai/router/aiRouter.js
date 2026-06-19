const { executeWithFallback } = require('./fallbackRouter');
const { selectModel, allModels } = require('./modelSelector');
const { roundRobin, latencyBased, costBased, hybrid, getMetrics, resetCounters } = require('./loadBalancer');
const { PROVIDERS, healthCheck } = require('../providers');
const { normalize } = require('../normalization/responseNormalizer');
const { formatForProvider, addSystemPrompt } = require('../normalization/promptFormatter');
const { estimateTokens, estimateMessages, estimateCost } = require('../normalization/tokenEstimator');
const { routeByIntent, ROUTE_STRATEGIES } = require('../intelligence/intentRouter');
const { cheapest } = require('../intelligence/costOptimizer');
const { fastest } = require('../intelligence/latencyOptimizer');
const { bestQuality } = require('../intelligence/qualityRouter');

const events = [];

function _emit(type, data) {
  const entry = { type, timestamp: new Date().toISOString(), data };
  events.push(entry);
}

async function generate(prompt, options = {}) {
  _emit('ai.request.started', { promptLength: typeof prompt === 'string' ? prompt.length : JSON.stringify(prompt).length, options });

  const systemPrompt = options.systemPrompt || null;
  let formattedPrompt = prompt;

  if (options.provider && options.format !== false) {
    formattedPrompt = formatForProvider(prompt, options.provider, { systemPrompt });
  } else if (systemPrompt) {
    formattedPrompt = addSystemPrompt(prompt, systemPrompt);
  }

  const eventEmitter = { emit: _emit };
  const result = await executeWithFallback(formattedPrompt, { ...options, eventEmitter });

  if (result.success) {
    const normalized = normalize(result, result.provider, result.model);
    _emit('ai.request.completed', { provider: result.provider, model: result.model, latency: result.latency });
    return { ...normalized, attempts: result.attempts };
  }

  _emit('ai.request.failed', { error: result.error, attempts: result.attempts });
  throw new Error(result.error || 'AI request failed');
}

async function stream(prompt, options = {}) {
  const providerName = options.provider || 'openai';
  const provider = PROVIDERS[providerName];
  if (!provider) throw new Error(`Provider "${providerName}" not found`);

  const systemPrompt = options.systemPrompt || null;
  const formattedPrompt = systemPrompt ? addSystemPrompt(prompt, systemPrompt) : prompt;

  _emit('ai.request.started', { stream: true, provider: providerName, promptLength: typeof prompt === 'string' ? prompt.length : 0 });

  const result = await provider.stream(formattedPrompt, options);
  _emit('ai.request.completed', { stream: true, provider: providerName, latency: result.latency });

  return result;
}

module.exports = {
  generate,
  stream,
  selectModel,
  allModels,
  healthCheck: () => healthCheck(),
  getMetrics: () => ({ routingEvents: events.slice(-100), loadBalancer: getMetrics(), providers: PROVIDERS }),
  listProviders: () => Object.keys(PROVIDERS).map(name => ({
    name,
    models: PROVIDERS[name].models().map(m => m.id),
    healthy: PROVIDERS[name]._healthy,
  })),
  intelligence: { routeByIntent, cheapest, fastest, bestQuality, ROUTE_STRATEGIES },
  loadBalancer: { roundRobin, latencyBased, costBased, hybrid, getMetrics, resetCounters },
  normalize,
  estimateTokens,
  estimateMessages,
  estimateCost,
};
