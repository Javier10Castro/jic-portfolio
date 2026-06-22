import ExperimentStorage from './experimentStorage.js';
import ExperimentMetrics from './experimentMetrics.js';

class ExperimentComparator {
  constructor(storage, metrics) {
    this._storage = storage || new ExperimentStorage();
    this._metrics = metrics || new ExperimentMetrics();
  }

  compareVariants(experimentId) {
    const experiment = this._storage.getExperiment(experimentId);
    if (!experiment) throw new Error(`Experiment ${experimentId} not found`);

    const variants = experiment.variants;
    const comparisons = [];

    for (let i = 0; i < variants.length; i++) {
      for (let j = i + 1; j < variants.length; j++) {
        const resultsA = this._storage.getVariantData(experimentId, variants[i].name);
        const resultsB = this._storage.getVariantData(experimentId, variants[j].name);
        comparisons.push({
          variantA: variants[i].name,
          variantB: variants[j].name,
          diffs: this._computeDiffs(resultsA, resultsB)
        });
      }
    }

    return { experimentId, comparisons };
  }

  _computeDiffs(resultsA, resultsB) {
    const diffs = {};
    if (resultsA.length === 0 || resultsB.length === 0) return diffs;
    const minLen = Math.min(resultsA.length, resultsB.length);
    const latencyDiffs = [];
    const costDiffs = [];
    for (let i = 0; i < minLen; i++) {
      latencyDiffs.push(resultsA[i].latency - resultsB[i].latency);
      costDiffs.push(resultsA[i].cost - resultsB[i].cost);
    }
    if (latencyDiffs.length) {
      diffs.latency = { mean: latencyDiffs.reduce((a, b) => a + b, 0) / latencyDiffs.length };
    }
    if (costDiffs.length) {
      diffs.cost = { mean: costDiffs.reduce((a, b) => a + b, 0) / costDiffs.length };
    }
    return diffs;
  }

  rankVariants(experimentId, metric) {
    const experiment = this._storage.getExperiment(experimentId);
    if (!experiment) throw new Error(`Experiment ${experimentId} not found`);

    const comparison = this._metrics.compareMetric(experimentId, metric);
    return comparison.map(c => ({
      variantName: c.variantName,
      mean: c.mean,
      count: c.count
    }));
  }

  findWinner(experimentId, metric) {
    const ranked = this.rankVariants(experimentId, metric);
    if (ranked.length === 0) return null;
    return ranked[0];
  }

  statisticalSignificance(resultsA, resultsB) {
    const n1 = resultsA.length;
    const n2 = resultsB.length;
    if (n1 < 2 || n2 < 2) {
      return { significant: false, pValue: 1 };
    }

    const mean1 = resultsA.reduce((a, b) => a + b, 0) / n1;
    const mean2 = resultsB.reduce((a, b) => a + b, 0) / n2;

    const var1 = resultsA.reduce((acc, v) => acc + (v - mean1) ** 2, 0) / (n1 - 1);
    const var2 = resultsB.reduce((acc, v) => acc + (v - mean2) ** 2, 0) / (n2 - 1);

    const pooledSE = Math.sqrt(var1 / n1 + var2 / n2);
    if (pooledSE === 0) {
      return { significant: mean1 !== mean2, pValue: mean1 === mean2 ? 1 : 0 };
    }

    const t = (mean1 - mean2) / pooledSE;
    const df = Math.min(n1 - 1, n2 - 1);
    const pValue = this._approximatePValue(t, df);

    return { significant: pValue < 0.05, pValue };
  }

  _approximatePValue(t, df) {
    const x = df / (df + t * t);
    let p = 1 - 0.5 * (1 + 0.196854 * Math.abs(t) + 0.115194 * t * t + 0.000344 * t * t * t + 0.019527 * t * t * t * t) ** (-4);
    p = Math.min(Math.max(p, 0), 1);
    return Math.round(p * 1e6) / 1e6;
  }

  generateReport(experimentId) {
    const experiment = this._storage.getExperiment(experimentId);
    if (!experiment) throw new Error(`Experiment ${experimentId} not found`);

    const comparisons = this.compareVariants(experimentId);
    const metrics = this._metrics.getMetrics(experimentId);
    const results = this._storage.getResults(experimentId);

    const variantSummaries = {};
    for (const variant of experiment.variants) {
      const variantResults = results.filter(r => r.variant === variant.name);
      const variantMetrics = this._metrics.getVariantSummary(experimentId, variant.name);
      const latencies = variantResults.map(r => r.latency);
      const costs = variantResults.map(r => r.cost);
      variantSummaries[variant.name] = {
        resultCount: variantResults.length,
        latency: latencies.length ? {
          mean: latencies.reduce((a, b) => a + b, 0) / latencies.length,
          min: Math.min(...latencies),
          max: Math.max(...latencies)
        } : null,
        cost: costs.length ? {
          mean: costs.reduce((a, b) => a + b, 0) / costs.length,
          min: Math.min(...costs),
          max: Math.max(...costs)
        } : null,
        metrics: variantMetrics
      };
    }

    return {
      experimentId,
      experimentName: experiment.name,
      status: experiment.status,
      variants: experiment.variants.map(v => v.name),
      comparisons,
      metricCount: metrics.length,
      variantSummaries
    };
  }
}

export default ExperimentComparator;
export { ExperimentComparator };
