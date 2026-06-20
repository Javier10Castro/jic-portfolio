class MrrCalculator {
  calculate(subscriptions, options = {}) {
    const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');
    let mrr = 0;
    const breakdown = {};
    activeSubs.forEach(sub => {
      const price = sub.planId ? (this._getPlanPrice(sub) || 0) : 0;
      const monthly = sub.interval === 'yearly' ? price / 12 : price;
      mrr += monthly;
      if (!breakdown[sub.planId]) breakdown[sub.planId] = { planId: sub.planId, count: 0, revenue: 0 };
      breakdown[sub.planId].count++;
      breakdown[sub.planId].revenue += monthly;
    });
    return {
      mrr: Math.round(mrr * 100) / 100,
      currency: options.currency || 'usd',
      subscriptionCount: activeSubs.length,
      breakdown: Object.values(breakdown).map(b => ({ ...b, revenue: Math.round(b.revenue * 100) / 100 })),
      calculatedAt: Date.now()
    };
  }

  projectMrr(subscriptions, newSubsPerMonth = 0, churnRate = 0.05) {
    const current = this.calculate(subscriptions);
    const projected = current.mrr;
    const monthlyNewRevenue = newSubsPerMonth * (current.subscriptionCount > 0 ? current.mrr / current.subscriptionCount : 100);
    const projectedNextMonth = projected + monthlyNewRevenue - (projected * churnRate);
    return {
      currentMrr: current.mrr,
      projectedNextMonth: Math.round(projectedNextMonth * 100) / 100,
      monthlyNewRevenue,
      churnRate,
      projectionMonths: 1
    };
  }

  _getPlanPrice(sub) {
    if (!sub._planPrice) sub._planPrice = sub.price || (sub.prices && sub.prices[sub.interval]) || 0;
    return sub._planPrice;
  }
}

module.exports = { MrrCalculator };
