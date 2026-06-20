class SubscriptionManager {
  constructor(options = {}) {
    this._storage = options.storage;
    this._events = options.events;
    this._subscriptions = {};
  }

  createSubscription(options = {}) {
    const { customerId, planId, interval = 'monthly', trialDays = 0, coupon, metadata, price, prices } = options;
    const now = Date.now();
    const periodStart = now;
    const periodEnd = this._calcPeriodEnd(periodStart, interval);
    const sub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      customerId, planId, status: trialDays > 0 ? 'trialing' : 'active',
      interval, trialDays, trialStart: trialDays > 0 ? now : null,
      trialEnd: trialDays > 0 ? now + trialDays * 86400000 : null,
      currentPeriodStart: periodStart, currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false, canceledAt: null,
      pausedAt: null, resumeAt: null, coupon: coupon || null,
      quantity: options.quantity || 1, seats: options.seats || 1,
      price: price || 0, prices: prices || { monthly: 0, yearly: 0 },
      metadata: metadata || {}, createdAt: now
    };
    this._subscriptions[sub.id] = sub;
    if (this._storage) this._storage.create('subscriptions', sub.id, sub);
    if (this._events) this._events.emit(trialDays > 0 ? 'trial.started' : 'subscription.created', sub);
    return sub;
  }

  cancelSubscription(id, options = {}) {
    const sub = this._subscriptions[id];
    if (!sub) return null;
    if (options.atPeriodEnd) {
      sub.cancelAtPeriodEnd = true;
    } else {
      sub.status = 'canceled';
      sub.canceledAt = Date.now();
    }
    if (this._storage) this._storage.update('subscriptions', id, sub);
    if (this._events) this._events.emit('subscription.cancelled', { subscriptionId: id, ...sub });
    return { ...sub };
  }

  changePlan(id, newPlanId, options = {}) {
    const sub = this._subscriptions[id];
    if (!sub) return null;
    const oldPlanId = sub.planId;
    sub.planId = newPlanId;
    if (options.prorate) {
      sub.currentPeriodEnd = this._calcPeriodEnd(Date.now(), sub.interval);
    }
    if (this._storage) this._storage.update('subscriptions', id, sub);
    if (this._events) this._events.emit('plan.changed', { subscriptionId: id, oldPlanId, newPlanId, ...sub });
    return { ...sub };
  }

  renewSubscription(id) {
    const sub = this._subscriptions[id];
    if (!sub) return null;
    if (sub.cancelAtPeriodEnd && sub.status === 'active') {
      sub.cancelAtPeriodEnd = false;
    }
    const now = Date.now();
    sub.currentPeriodStart = now;
    sub.currentPeriodEnd = this._calcPeriodEnd(now, sub.interval);
    if (sub.trialEnd && sub.status === 'trialing') {
      sub.status = 'active';
      sub.trialEnd = null;
    }
    if (this._storage) this._storage.update('subscriptions', id, sub);
    if (this._events) this._events.emit('subscription.renewed', sub);
    return { ...sub };
  }

  pauseSubscription(id, options = {}) {
    const sub = this._subscriptions[id];
    if (!sub) return null;
    sub.status = 'paused';
    sub.pausedAt = Date.now();
    sub.resumeAt = options.resumeAt || null;
    if (this._storage) this._storage.update('subscriptions', id, sub);
    if (this._events) this._events.emit('subscription.paused', sub);
    return { ...sub };
  }

  resumeSubscription(id) {
    const sub = this._subscriptions[id];
    if (!sub) return null;
    sub.status = 'active';
    sub.pausedAt = null;
    sub.resumeAt = null;
    if (this._storage) this._storage.update('subscriptions', id, sub);
    if (this._events) this._events.emit('subscription.resumed', sub);
    return { ...sub };
  }

  getSubscription(id) { return this._subscriptions[id] ? { ...this._subscriptions[id] } : null; }
  listSubscriptions(filter) {
    let items = Object.values(this._subscriptions);
    if (filter) Object.entries(filter).forEach(([k, v]) => { items = items.filter(i => i[k] === v); });
    return items.map(i => ({ ...i }));
  }
  getActiveCount() { return Object.values(this._subscriptions).filter(s => s.status === 'active').length; }
  getTrialCount() { return Object.values(this._subscriptions).filter(s => s.status === 'trialing').length; }

  _calcPeriodEnd(from, interval) {
    const d = new Date(from);
    if (interval === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (interval === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else if (interval === 'quarterly') d.setMonth(d.getMonth() + 3);
    else d.setMonth(d.getMonth() + 1);
    return d.getTime();
  }

  clear() { this._subscriptions = {}; }
}

module.exports = { SubscriptionManager };
