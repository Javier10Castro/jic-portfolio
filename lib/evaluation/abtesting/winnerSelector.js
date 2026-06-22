class WinnerSelector {
  constructor() {
    this._cache = new Map();
  }

  selectWinner(testId, results, options = {}) {
    const metric = options.metric || 'conversionRate';
    const confidenceThreshold = options.confidenceThreshold || 0.95;
    const useBayesian = options.useBayesian !== false;

    const variants = Object.entries(results.variants);
    if (variants.length < 2) return { winner: null, reason: 'Need at least 2 variants' };

    const sorted = variants
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => (b[metric] || 0) - (a[metric] || 0));

    const best = sorted[0];
    const second = sorted[1];

    let confidence = null;
    let significant = false;

    if (useBayesian) {
      const calc = this.calculateConfidence(
        best.conversions, best.impressions,
        second.conversions, second.impressions
      );
      confidence = calc.confidence;
      significant = confidence >= confidenceThreshold;
    }

    return {
      winner: best.name,
      metric,
      confidence,
      significant,
      confidenceThreshold,
      effectSize: second[metric] > 0 ? ((best[metric] - second[metric]) / second[metric]) : Infinity,
      details: { best: best.name, second: second.name },
    };
  }

  calculateConfidence(conversionsA, impressionsA, conversionsB, impressionsB) {
    const rateA = impressionsA > 0 ? conversionsA / impressionsA : 0;
    const rateB = impressionsB > 0 ? conversionsB / impressionsB : 0;

    const alphaA = conversionsA + 1;
    const betaA = impressionsA - conversionsA + 1;
    const alphaB = conversionsB + 1;
    const betaB = impressionsB - conversionsB + 1;

    const samples = 10000;
    let aWins = 0;
    for (let i = 0; i < samples; i++) {
      const sampleA = this._sampleBeta(alphaA, betaA);
      const sampleB = this._sampleBeta(alphaB, betaB);
      if (sampleA > sampleB) aWins++;
    }

    const confidence = aWins / samples;
    const winner = confidence >= 0.5 ? 'A' : 'B';

    return {
      confidence: winner === 'A' ? confidence : 1 - confidence,
      significant: confidence >= 0.95 || (1 - confidence) >= 0.95,
      winner,
    };
  }

  _sampleBeta(alpha, beta) {
    const x = this._sampleGamma(alpha);
    const y = this._sampleGamma(beta);
    return x / (x + y);
  }

  _sampleGamma(shape) {
    if (shape < 1) {
      const u = Math.random();
      return this._sampleGamma(shape + 1) * Math.pow(u, 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x, v;
      do {
        x = this._normalRandom();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  _normalRandom() {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  getRecommendedDuration(currentResults, targetConfidence = 0.95) {
    const variants = Object.values(currentResults.variants);
    if (variants.length < 2) return { recommendedDays: null, reason: 'Need at least 2 variants' };

    const totalSamples = variants.reduce((s, v) => s + v.impressions, 0);
    const dailyRate = totalSamples > 0 ? totalSamples / 1 : 1;

    const minSamples = variants.reduce((s, v) => Math.max(s, v.impressions), 0);
    const estimatedNeeded = Math.ceil(
      (targetConfidence / (1 - targetConfidence)) * 500
    );

    if (minSamples >= estimatedNeeded) {
      return { recommendedDays: 0, reason: 'Sufficient samples collected' };
    }

    const additional = estimatedNeeded - minSamples;
    const days = dailyRate > 0 ? Math.ceil(additional / (dailyRate / variants.length)) : 7;

    return {
      recommendedDays: days,
      currentSamples: minSamples,
      targetSamples: estimatedNeeded,
    };
  }

  validateWinner(testId, options = {}) {
    const { results, ...opts } = options;
    if (!results) throw new Error('Results required for validation');

    const selection = this.selectWinner(testId, results, opts);
    const duration = this.getRecommendedDuration(results, opts.confidenceThreshold || 0.95);

    return {
      ...selection,
      recommendation: selection.significant
        ? 'Winner is statistically significant'
        : 'Test needs more data before declaring a winner',
      duration,
    };
  }

  clear() {
    this._cache.clear();
  }
}

module.exports = { WinnerSelector };
