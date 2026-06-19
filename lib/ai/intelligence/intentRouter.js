const { bestQuality } = require('./qualityRouter');
const { cheapest } = require('./costOptimizer');
const { fastest } = require('./latencyOptimizer');

const ROUTE_STRATEGIES = {
  quality: 'quality',
  cost: 'cost',
  latency: 'latency',
  hybrid: 'hybrid',
};

function routeByIntent(prompt, context = 'chat', options = {}) {
  const strategy = options.strategy || 'hybrid';

  switch (strategy) {
    case 'quality':
      return bestQuality(prompt, context, options);
    case 'cost':
      return cheapest(prompt, { ...options, minQuality: options.minQuality || 'medium' });
    case 'latency':
      return fastest(prompt, options);
    case 'hybrid':
      return hybridRoute(prompt, context, options);
    default:
      return bestQuality(prompt, context, options);
  }
}

function hybridRoute(prompt, context = 'chat', options = {}) {
  const quality = bestQuality(prompt, context, options);
  if (!quality) return cheapest(prompt, options) || fastest(prompt, options);

  if (quality.provider === 'anthropic' && quality.model?.includes('opus')) {
    const cheaper = cheapest(prompt, { ...options, minQuality: 'high' });
    if (cheaper) return { ...cheaper, reason: 'Hybrid: quality target met, cost optimized' };
  }

  return quality;
}

module.exports = { routeByIntent, ROUTE_STRATEGIES };
