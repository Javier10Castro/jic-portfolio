class BillingEvents {
  constructor() {
    this._listeners = {};
    this._history = [];
    this._maxHistory = 1000;
  }

  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  }

  off(event, handler) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(h => h !== handler);
  }

  emit(event, data) {
    const entry = { event, data, timestamp: Date.now() };
    this._history.push(entry);
    if (this._history.length > this._maxHistory) this._history.shift();
    const handlers = this._listeners[event] || [];
    const wildcard = this._listeners['*'] || [];
    [...handlers, ...wildcard].forEach(h => { try { h(entry) } catch (e) { /* noop */ } });
    return entry;
  }

  history(event) {
    if (!event) return [...this._history];
    return this._history.filter(h => h.event === event);
  }

  clear() { this._history = []; }
}

const EVENTS = {
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_FAILED: 'invoice.failed',
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_FAILED: 'payment.failed',
  TRIAL_STARTED: 'trial.started',
  TRIAL_EXPIRED: 'trial.expired',
  QUOTA_EXCEEDED: 'quota.exceeded',
  USAGE_UPDATED: 'usage.updated',
  CREDIT_ADDED: 'credit.added',
  CREDIT_CONSUMED: 'credit.consumed',
  DISCOUNT_APPLIED: 'discount.applied',
  PLAN_CHANGED: 'plan.changed',
  SUBSCRIPTION_RENEWING: 'subscription.renewing',
  PAYMENT_METHOD_ADDED: 'payment_method.added',
  PAYMENT_METHOD_REMOVED: 'payment_method.removed',
  CUSTOMER_UPDATED: 'customer.updated',
  REFUND_ISSUED: 'refund.issued',
  INVOICE_OVERDUE: 'invoice.overdue',
  SUBSCRIPTION_PAUSED: 'subscription.paused',
  SUBSCRIPTION_RESUMED: 'subscription.resumed',
  WEBHOOK_RECEIVED: 'webhook.received',
  WEBHOOK_PROCESSED: 'webhook.processed'
};

module.exports = { BillingEvents, EVENTS };
