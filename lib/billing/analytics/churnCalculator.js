class ChurnCalculator {
  calculate(subscriptions, options = {}) {
    const period = options.period || 30 * 86400000;
    const now = Date.now();
    const periodStart = now - period;
    const activeAtStart = subscriptions.filter(s => s.createdAt < periodStart &&
      (s.status === 'active' || s.status === 'trialing'));
    const canceledDuring = subscriptions.filter(s => s.canceledAt &&
      s.canceledAt >= periodStart && s.canceledAt <= now);
    const churnedCount = canceledDuring.length;
    const totalAtRisk = activeAtStart.length;
    const churnRate = totalAtRisk > 0 ? churnedCount / totalAtRisk : 0;
    return {
      churnRate: Math.round(churnRate * 10000) / 100,
      churnedCount, totalAtRisk, period: period / 86400000,
      periodUnit: 'days', calculatedAt: now
    };
  }

  calculateRevenueChurn(subscriptions, options = {}) {
    const period = options.period || 30 * 86400000;
    const now = Date.now();
    const periodStart = now - period;
    let mrrStart = 0;
    let churnedMrr = 0;
    subscriptions.forEach(sub => {
      const price = this._getMonthlyPrice(sub);
      if (sub.createdAt < periodStart && (sub.status === 'active' || sub.status === 'trialing')) {
        mrrStart += price;
      }
      if (sub.canceledAt && sub.canceledAt >= periodStart && sub.canceledAt <= now) {
        churnedMrr += price;
      }
    });
    const revenueChurnRate = mrrStart > 0 ? churnedMrr / mrrStart : 0;
    return {
      revenueChurnRate: Math.round(revenueChurnRate * 10000) / 100,
      churnedMrr: Math.round(churnedMrr * 100) / 100,
      mrrAtStart: Math.round(mrrStart * 100) / 100,
      period: period / 86400000,
      calculatedAt: now
    };
  }

  _getMonthlyPrice(sub) {
    const price = sub.price || (sub.prices && sub.prices[sub.interval]) || 0;
    return sub.interval === 'yearly' ? price / 12 : price;
  }
}

module.exports = { ChurnCalculator };
