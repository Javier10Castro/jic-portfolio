const { PROVIDERS } = require('../providers');
const { routeByIntent } = require('../intelligence/intentRouter');
const { bestQuality } = require('../intelligence/qualityRouter');
const { cheapest } = require('../intelligence/costOptimizer');
const { fastest } = require('../intelligence/latencyOptimizer');
const { estimateTokens } = require('../normalization/tokenEstimator');

function selectModel(prompt, options = {}) {
  const context = options.context || 'chat';
  const strategy = options.strategy || 'hybrid';
  const requirements = {
    minQuality: options.minQuality,
    contextMin: options.contextWindow,
    codeOnly: options.codeOnly,
    preferred: options.preferredProvider,
  };

  let selection;

  switch (strategy) {
    case 'quality':
      selection = bestQuality(prompt, context, requirements);
      break;
    case 'cost':
      selection = cheapest(prompt, requirements);
      break;
    case 'latency':
      selection = fastest(prompt, requirements);
      break;
    default:
      selection = routeByIntent(prompt, context, { ...options, strategy: 'hybrid' });
  }

  if (!selection) {
    const fallbacks = allModels().filter(m => m.provider !== 'ollama' || PROVIDERS.ollama._healthy);
    if (fallbacks.length === 0) return { provider: 'openai', model: 'gpt-3.5-turbo', reason: 'ultimate fallback' };
    const fb = fallbacks[0];
    return { provider: fb.provider, model: fb.id, reason: 'fallback to first available' };
  }

  const inputTokens = estimateTokens(prompt);
  const provider = PROVIDERS[selection.provider];
  const modelInfo = provider?.models().find(m => m.id === selection.model);

  return {
    ...selection,
    estimatedInputTokens: inputTokens,
    estimatedCost: modelInfo ? ((inputTokens / 1000) * (modelInfo.costPer1kInput || 0)).toFixed(6) : 'unknown',
    contextWindow: modelInfo?.contextWindow || 'unknown',
  };
}

function allModels() {
  const models = [];
  for (const provider of Object.values(PROVIDERS)) {
    for (const model of provider.models()) {
      models.push({ ...model, providerName: provider.name });
    }
  }
  return models;
}

module.exports = { selectModel, allModels };
