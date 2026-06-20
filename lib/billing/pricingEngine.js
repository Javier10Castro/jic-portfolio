class PricingEngine {
  constructor() {
    this._priceOverrides = {};
  }

  calculatePrice(plan, options = {}) {
    const { interval = 'monthly', quantity = 1, seats = 1 } = options;
    const basePrice = plan.prices && plan.prices[interval] ? plan.prices[interval] : (plan.price || 0);
    let total = basePrice;

    if (plan.type === 'per_seat' || plan.billing === 'per_seat') {
      total = basePrice * (seats || 1);
    } else if (plan.type === 'per_unit' || plan.billing === 'per_unit') {
      total = basePrice * (quantity || 1);
    }

    if (interval === 'yearly' && plan.prices && plan.prices.yearly) {
      total = plan.prices.yearly;
    } else if (interval === 'yearly') {
      total = basePrice * 12 * (plan.yearlyDiscount || 0.8);
    }

    return { subtotal: total, currency: plan.currency || 'usd', interval, quantity, seats };
  }

  calculateUsageCost(plan, usage, options = {}) {
    const { meteredFeatures } = plan;
    if (!meteredFeatures || !meteredFeatures.length) return 0;
    let total = 0;
    meteredFeatures.forEach(feature => {
      const used = usage[feature.key] || 0;
      const included = feature.included || 0;
      const overage = Math.max(0, used - included);
      total += overage * (feature.unitPrice || 0);
    });
    return total;
  }

  setPriceOverride(planId, interval, price) {
    if (!this._priceOverrides[planId]) this._priceOverrides[planId] = {};
    this._priceOverrides[planId][interval] = price;
  }

  getPriceOverride(planId, interval) {
    return this._priceOverrides[planId] ? this._priceOverrides[planId][interval] : null;
  }

  clearOverrides() { this._priceOverrides = {}; }
}

module.exports = { PricingEngine };
