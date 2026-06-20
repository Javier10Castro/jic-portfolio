class OverageCalculator {
  calculateOverage(usage, plan) {
    const overages = {};
    let totalOverage = 0;
    if (!plan.meteredFeatures) return { overages: {}, total: 0 };
    plan.meteredFeatures.forEach(feature => {
      const used = (usage[feature.key] || 0);
      const included = feature.included || 0;
      const overage = Math.max(0, used - included);
      const cost = overage * (feature.unitPrice || 0);
      if (overage > 0) {
        overages[feature.key] = { used, included, overage, unitPrice: feature.unitPrice || 0, cost };
        totalOverage += cost;
      }
    });
    return { overages, total: Math.round(totalOverage * 100) / 100 };
  }

  estimateOverage(projectedUsage, plan) {
    return this.calculateOverage(projectedUsage, plan);
  }
}

module.exports = { OverageCalculator };
