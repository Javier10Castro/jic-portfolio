const { PROVIDERS } = require('../providers');

const SPEED_ORDER = ['very-fast', 'fast', 'medium', 'slow'];

function fastest(prompt, requirements = {}) {
  const minQuality = requirements.minQuality || 'low';
  const minIdx = SPEED_ORDER.indexOf('medium');

  let best = null;
  let bestSpeed = Infinity;

  for (const provider of Object.values(PROVIDERS)) {
    for (const model of provider.models()) {
      if (!provider._healthy && provider.name !== 'ollama') continue;
      const speedIdx = SPEED_ORDER.indexOf(model.speed);
      if (speedIdx === -1 || speedIdx > minIdx) continue;
      if (requirements.codeOnly && !model.code) continue;

      if (speedIdx < bestSpeed) {
        bestSpeed = speedIdx;
        best = { provider: provider.name, model: model.id, speed: model.speed };
      }
    }
  }

  return best;
}

function estimateLatency(modelInfo, inputTokens) {
  const baseLatency = { 'very-fast': 300, 'fast': 800, 'medium': 2000, 'slow': 5000 };
  const perToken = { 'very-fast': 5, 'fast': 10, 'medium': 25, 'slow': 50 };
  const base = baseLatency[modelInfo.speed] || 1000;
  const tokenFactor = perToken[modelInfo.speed] || 15;
  return base + (inputTokens * tokenFactor);
}

module.exports = { fastest, estimateLatency };
