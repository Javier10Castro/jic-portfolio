const { PROVIDERS } = require('../providers');

const COUNTERS = new Map();

function getCounter(key) {
  if (!COUNTERS.has(key)) COUNTERS.set(key, 0);
  return COUNTERS.get(key);
}

function incrCounter(key) {
  COUNTERS.set(key, getCounter(key) + 1);
}

function roundRobin(providers) {
  const key = 'roundRobin';
  const idx = getCounter(key) % providers.length;
  incrCounter(key);
  return providers[idx];
}

function latencyBased(providers) {
  let best = providers[0];
  let bestLatency = Infinity;

  for (const p of providers) {
    const hist = COUNTERS.get(`latency:${p}`) || 0;
    if (hist < bestLatency && hist > 0) {
      bestLatency = hist;
      best = p;
    }
  }

  incrCounter(`selected:${best}`);
  return best;
}

function costBased(providers) {
  let best = providers[0];
  let bestCost = Infinity;

  for (const p of providers) {
    const provider = PROVIDERS[p];
    if (!provider) continue;
    const avgCost = provider.models().reduce((sum, m) => sum + m.costPer1kInput + m.costPer1kOutput, 0) / Math.max(1, provider.models().length);
    if (avgCost < bestCost) {
      bestCost = avgCost;
      best = p;
    }
  }

  incrCounter(`costSelected:${best}`);
  return best;
}

function hybrid(providers) {
  const scores = providers.map(name => {
    const provider = PROVIDERS[name];
    if (!provider || !provider._healthy) return { name, score: -1 };

    const healthScore = 10;
    const avgCost = provider.models().reduce((sum, m) => sum + m.costPer1kInput + m.costPer1kOutput, 0) / Math.max(1, provider.models().length);
    const costScore = Math.max(0, 10 - (avgCost * 100));
    const selectionCount = COUNTERS.get(`selected:${name}`) || 0;
    const fairnessScore = Math.max(0, 5 - selectionCount);

    return { name, score: healthScore + costScore + fairnessScore };
  });

  scores.sort((a, b) => b.score - a.score);
  const selected = scores[0]?.name || providers[0];
  incrCounter(`selected:${selected}`);
  return selected;
}

function getMetrics() {
  const metrics = {};
  for (const [key, value] of COUNTERS) {
    metrics[key] = value;
  }
  return metrics;
}

function resetCounters() {
  COUNTERS.clear();
}

module.exports = { roundRobin, latencyBased, costBased, hybrid, getMetrics, resetCounters };
