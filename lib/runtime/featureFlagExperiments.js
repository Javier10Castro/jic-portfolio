class FeatureFlagExperiments {
  constructor() {
    this._experiments = new Map();
    this._results = new Map();
  }

  createExperiment(flagKey, variants) {
    if (!flagKey) {
      throw new Error('flagKey is required');
    }
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('variants must be a non-empty array');
    }
    for (const v of variants) {
      if (!v.name || v.weight === undefined) {
        throw new Error('Each variant must have a name and weight');
      }
    }
    const totalWeight = variants.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
    if (totalWeight <= 0) {
      throw new Error('Total variant weight must be greater than 0');
    }
    this._experiments.set(flagKey, {
      flagKey,
      variants: variants.map(v => ({ name: v.name, weight: Number(v.weight) || 0 })),
      createdAt: new Date().toISOString()
    });
  }

  getExperiment(flagKey) {
    if (!flagKey) return null;
    const exp = this._experiments.get(flagKey);
    return exp ? { ...exp, variants: exp.variants.map(v => ({ ...v })) } : null;
  }

  assignVariant(flagKey, context) {
    const exp = this._experiments.get(flagKey);
    if (!exp) return null;
    const ctxId = context && context.userId ? String(context.userId) : (context && context.sessionId ? String(context.sessionId) : Math.random().toString());
    const hash = require('crypto').createHash('md5').update(flagKey + ':' + ctxId).digest('hex');
    const bucket = parseInt(hash.substring(0, 8), 16) % 100;
    let cumulative = 0;
    for (const variant of exp.variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant.name;
      }
    }
    return exp.variants[exp.variants.length - 1].name;
  }

  recordResult(flagKey, variant, result) {
    if (!flagKey || !variant || result === undefined) return;
    if (!this._experiments.has(flagKey)) return;
    const key = flagKey + '::' + variant;
    if (!this._results.has(key)) {
      this._results.set(key, []);
    }
    this._results.get(key).push({
      variant,
      result,
      timestamp: new Date().toISOString()
    });
  }

  getResults(flagKey) {
    if (!flagKey) return [];
    const results = [];
    for (const [key, entries] of this._results) {
      if (key.startsWith(flagKey + '::')) {
        results.push(...entries.map(e => ({ ...e })));
      }
    }
    return results;
  }

  clear() {
    this._experiments.clear();
    this._results.clear();
  }
}

module.exports = { FeatureFlagExperiments };
