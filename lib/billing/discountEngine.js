class DiscountEngine {
  constructor() {
    this._coupons = {};
    this._promotions = {};
  }

  createCoupon(code, config) {
    const coupon = {
      code: code.toUpperCase(),
      type: config.type || 'percentage',
      value: config.value || 0,
      maxRedemptions: config.maxRedemptions || null,
      currentRedemptions: 0,
      expiresAt: config.expiresAt || null,
      minAmount: config.minAmount || 0,
      planIds: config.planIds || null,
      duration: config.duration || 'once',
      durationMonths: config.durationMonths || null,
      active: true,
      createdAt: Date.now()
    };
    this._coupons[coupon.code] = coupon;
    return coupon;
  }

  validateCoupon(code, options = {}) {
    const coupon = this._coupons[code.toUpperCase()];
    if (!coupon) return { valid: false, reason: 'not_found' };
    if (!coupon.active) return { valid: false, reason: 'inactive' };
    if (coupon.maxRedemptions && coupon.currentRedemptions >= coupon.maxRedemptions)
      return { valid: false, reason: 'max_redemptions' };
    if (coupon.expiresAt && Date.now() > coupon.expiresAt)
      return { valid: false, reason: 'expired' };
    if (options.amount && coupon.minAmount > options.amount)
      return { valid: false, reason: 'min_amount' };
    if (coupon.planIds && options.planId && !coupon.planIds.includes(options.planId))
      return { valid: false, reason: 'plan_not_eligible' };
    return { valid: true, coupon };
  }

  applyDiscount(amount, code, options = {}) {
    const validation = this.validateCoupon(code, { amount, ...options });
    if (!validation.valid) return { applied: false, reason: validation.reason };
    const coupon = validation.coupon;
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = amount * (coupon.value / 100);
    } else {
      discount = Math.min(coupon.value, amount);
    }
    coupon.currentRedemptions++;
    return {
      applied: true, discount: Math.round(discount * 100) / 100,
      total: Math.round((amount - discount) * 100) / 100,
      coupon: coupon.code, type: coupon.type, value: coupon.value
    };
  }

  createPromotion(id, config) {
    this._promotions[id] = {
      id, type: config.type || 'fixed', value: config.value || 0,
      planIds: config.planIds || null, startsAt: config.startsAt || null,
      endsAt: config.endsAt || null, active: config.active !== false,
      maxApplications: config.maxApplications || null, applications: 0,
      createdAt: Date.now()
    };
    return this._promotions[id];
  }

  getCoupon(code) { return this._coupons[code.toUpperCase()] || null; }
  listCoupons() { return Object.values(this._coupons); }
  getPromotion(id) { return this._promotions[id] || null; }
  listPromotions() { return Object.values(this._promotions); }
  clear() { this._coupons = {}; this._promotions = {}; }
}

module.exports = { DiscountEngine };
