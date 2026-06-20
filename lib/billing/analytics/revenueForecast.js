class RevenueForecast {
  forecast(mrr, options = {}) {
    const growthRate = options.growthRate || 0.05;
    const churnRate = options.churnRate || 0.05;
    const months = options.months || 12;
    const projections = [];
    let projectedMrr = mrr;
    for (let i = 1; i <= months; i++) {
      const newRevenue = projectedMrr * growthRate;
      const lostRevenue = projectedMrr * churnRate;
      projectedMrr = projectedMrr + newRevenue - lostRevenue;
      projections.push({
        month: i, projectedMrr: Math.round(projectedMrr * 100) / 100,
        newRevenue: Math.round(newRevenue * 100) / 100,
        lostRevenue: Math.round(lostRevenue * 100) / 100,
        netChange: Math.round((newRevenue - lostRevenue) * 100) / 100
      });
    }
    return {
      currentMrr: mrr, growthRate, churnRate,
      projectedMrrEnd: Math.round(projectedMrr * 100) / 100,
      totalProjectedRevenue: Math.round(projections.reduce((s, p) => s + p.projectedMrr, 0) * 100) / 100,
      projections, currency: options.currency || 'usd',
      calculatedAt: Date.now()
    };
  }

  conservative(mrr, options = {}) {
    return this.forecast(mrr, { ...options, growthRate: (options.growthRate || 0.05) * 0.5, churnRate: (options.churnRate || 0.05) * 1.5 });
  }

  optimistic(mrr, options = {}) {
    return this.forecast(mrr, { ...options, growthRate: (options.growthRate || 0.05) * 1.5, churnRate: (options.churnRate || 0.05) * 0.5 });
  }
}

module.exports = { RevenueForecast };
