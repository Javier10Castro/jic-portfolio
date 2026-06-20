class ArrCalculator {
  calculate(mrr, options = {}) {
    const arr = mrr * 12;
    return {
      arr: Math.round(arr * 100) / 100,
      currency: options.currency || 'usd',
      mrrSource: mrr,
      calculatedAt: Date.now()
    };
  }

  calculateFromSubscriptions(subscriptions, options = {}) {
    const activeSubs = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');
    let arr = 0;
    activeSubs.forEach(sub => {
      const price = sub.planId ? (this._getPlanPrice(sub) || 0) : 0;
      arr += sub.interval === 'yearly' ? price : price * 12;
    });
    return {
      arr: Math.round(arr * 100) / 100,
      currency: options.currency || 'usd',
      subscriptionCount: activeSubs.length,
      calculatedAt: Date.now()
    };
  }

  _getPlanPrice(sub) {
    if (!sub._planPrice) sub._planPrice = sub.price || (sub.prices && sub.prices[sub.interval]) || 0;
    return sub._planPrice;
  }
}

module.exports = { ArrCalculator };
