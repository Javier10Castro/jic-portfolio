const { PROVIDERS } = require('../providers');

const QUALITY_ORDER = ['very-high', 'high', 'medium', 'low'];

function cheapest(prompt, requirements = {}) {
  const minQuality = requirements.minQuality || 'low';
  const minIdx = QUALITY_ORDER.indexOf(minQuality);
  if (minIdx === -1) return null;

  let best = null;
  let bestCost = Infinity;

  for (const provider of Object.values(PROVIDERS)) {
    for (const model of provider.models()) {
      const qualIdx = QUALITY_ORDER.indexOf(model.quality);
      if (qualIdx > minIdx) continue;
      if (requirements.codeOnly && !model.code) continue;
      if (requirements.contextMin && model.contextWindow < requirements.contextMin) continue;

      const cost = model.costPer1kInput + model.costPer1kOutput;
      if (cost < bestCost) {
        bestCost = cost;
        best = { provider: provider.name, model: model.id };
      }
    }
  }

  return best;
}

function estimateRunCost(modelInfo, inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1000) * (modelInfo.costPer1kInput || 0);
  const outputCost = (outputTokens / 1000) * (modelInfo.costPer1kOutput || 0);
  return { inputCost, outputCost, total: inputCost + outputCost };
}

module.exports = { cheapest, estimateRunCost };
