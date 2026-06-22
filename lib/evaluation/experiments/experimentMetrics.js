class ExperimentMetrics {
  constructor() {
    this._metrics = new Map();
  }

  recordMetric(experimentId, variantName, name, value) {
    const key = `${experimentId}::${variantName}::${name}`;
    if (!this._metrics.has(key)) {
      this._metrics.set(key, []);
    }
    this._metrics.get(key).push({ experimentId, variantName, name, value, timestamp: new Date() });
  }

  getMetrics(experimentId) {
    const result = [];
    for (const entries of this._metrics.values()) {
      for (const entry of entries) {
        if (entry.experimentId === experimentId) {
          result.push(entry);
        }
      }
    }
    return result;
  }

  getVariantSummary(experimentId, variantName) {
    const entries = [];
    for (const list of this._metrics.values()) {
      for (const entry of list) {
        if (entry.experimentId === experimentId && entry.variantName === variantName) {
          entries.push(entry);
        }
      }
    }
    const grouped = {};
    for (const e of entries) {
      if (!grouped[e.name]) grouped[e.name] = [];
      grouped[e.name].push(e.value);
    }
    const summary = {};
    for (const [name, values] of Object.entries(grouped)) {
      const n = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
      summary[name] = {
        count: n,
        sum,
        mean,
        variance,
        stdDev: Math.sqrt(variance),
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
    return summary;
  }

  compareMetric(experimentId, metricName) {
    const results = [];
    for (const list of this._metrics.values()) {
      for (const entry of list) {
        if (entry.experimentId === experimentId && entry.name === metricName) {
          results.push(entry);
        }
      }
    }
    const grouped = {};
    for (const r of results) {
      if (!grouped[r.variantName]) grouped[r.variantName] = [];
      grouped[r.variantName].push(r.value);
    }
    const comparison = Object.entries(grouped).map(([variantName, values]) => {
      const n = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      return { variantName, values, mean: sum / n, count: n };
    });
    comparison.sort((a, b) => b.mean - a.mean);
    return comparison;
  }

  clear() {
    this._metrics.clear();
  }
}

export default ExperimentMetrics;
export { ExperimentMetrics };
