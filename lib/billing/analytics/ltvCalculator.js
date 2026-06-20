class LtvCalculator {
  calculate(arpa, churnRate, options = {}) {
    if (churnRate <= 0) return { ltv: Infinity, arpa, churnRate, months: 'infinite', calculatedAt: Date.now() };
    const avgLifetimeMonths = 1 / churnRate;
    const ltv = arpa * avgLifetimeMonths;
    return {
      ltv: Math.round(ltv * 100) / 100,
      arpa: Math.round(arpa * 100) / 100, churnRate,
      avgLifetimeMonths: Math.round(avgLifetimeMonths * 100) / 100,
      currency: options.currency || 'usd',
      calculatedAt: Date.now()
    };
  }

  calculateFromData(subscriptions, revenue, options = {}) {
    const activeSubs = subscriptions.filter(s => s.status === 'active');
    const totalRevenue = revenue || 0;
    const arpa = activeSubs.length > 0 ? totalRevenue / activeSubs.length / 12 : 0;
    const churned = subscriptions.filter(s => s.status === 'canceled').length;
    const total = subscriptions.length;
    const churnRate = total > 0 ? churned / total : 0.05;
    return this.calculate(arpa, churnRate || 0.05, options);
  }
}

module.exports = { LtvCalculator };
