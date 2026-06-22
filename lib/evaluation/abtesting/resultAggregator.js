class ResultAggregator {
  constructor() {
    this._results = new Map();
  }

  recordResult(testId, variantName, type, value = 1) {
    if (!this._results.has(testId)) {
      this._results.set(testId, { variants: {} });
    }
    const test = this._results.get(testId);
    if (!test.variants[variantName]) {
      test.variants[variantName] = {
        impressions: 0,
        conversions: 0,
        totalValue: 0,
      };
    }
    const v = test.variants[variantName];
    if (type === 'impression') v.impressions += value;
    else if (type === 'conversion') {
      v.conversions += value;
      v.totalValue += value;
    }
  }

  getResults(testId) {
    const test = this._results.get(testId);
    if (!test) return null;

    const variants = {};
    let totalImpressions = 0;
    let totalConversions = 0;
    let totalValue = 0;

    for (const [name, data] of Object.entries(test.variants)) {
      const conversionRate = data.impressions > 0 ? data.conversions / data.impressions : 0;
      const avgValue = data.conversions > 0 ? data.totalValue / data.conversions : 0;
      variants[name] = {
        impressions: data.impressions,
        conversions: data.conversions,
        conversionRate,
        totalValue: data.totalValue,
        avgValue,
      };
      totalImpressions += data.impressions;
      totalConversions += data.conversions;
      totalValue += data.totalValue;
    }

    return {
      variants,
      totals: {
        impressions: totalImpressions,
        conversions: totalConversions,
        conversionRate: totalImpressions > 0 ? totalConversions / totalImpressions : 0,
        totalValue,
      },
    };
  }

  getVariantStats(testId, variantName) {
    const results = this.getResults(testId);
    if (!results) return null;
    return results.variants[variantName] || null;
  }

  compareVariants(testId) {
    const results = this.getResults(testId);
    if (!results) return [];
    return Object.entries(results.variants).map(([name, stats]) => ({
      variant: name,
      ...stats,
    }));
  }

  clear() {
    this._results.clear();
  }
}

module.exports = { ResultAggregator };
