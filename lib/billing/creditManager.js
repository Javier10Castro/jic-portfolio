class CreditManager {
  constructor(options = {}) {
    this._storage = options.storage;
    this._events = options.events;
    this._credits = {};
  }

  addCredits(customerId, amount, options = {}) {
    const credit = {
      id: `cred-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      customerId, amount, remaining: amount,
      reason: options.reason || 'manual',
      expiresAt: options.expiresAt || null,
      type: options.type || 'general',
      createdAt: Date.now()
    };
    if (!this._credits[customerId]) this._credits[customerId] = [];
    this._credits[customerId].push(credit);
    if (this._storage) this._storage.create('credits', credit.id, credit);
    if (this._events) this._events.emit('credit.added', { customerId, amount, credit });
    return credit;
  }

  applyCredits(customerId, amount) {
    const credits = this._getUsableCredits(customerId);
    let remaining = amount;
    let applied = 0;
    const appliedCredits = [];
    for (const credit of credits) {
      if (remaining <= 0) break;
      const useAmount = Math.min(credit.remaining, remaining);
      credit.remaining -= useAmount;
      remaining -= useAmount;
      applied += useAmount;
      appliedCredits.push({ creditId: credit.id, amount: useAmount });
      if (this._storage) this._storage.update('credits', credit.id, credit);
    }
    if (applied > 0 && this._events) this._events.emit('credit.consumed', { customerId, amount: applied, appliedCredits });
    return { applied: Math.round(applied * 100) / 100, remaining: Math.round(remaining * 100) / 100, appliedCredits };
  }

  getCredits(customerId) { return this._credits[customerId] || []; }
  getBalance(customerId) {
    const credits = this._getUsableCredits(customerId);
    return credits.reduce((sum, c) => sum + c.remaining, 0);
  }

  _getUsableCredits(customerId) {
    const credits = this._credits[customerId] || [];
    return credits.filter(c => c.remaining > 0 && (!c.expiresAt || Date.now() < c.expiresAt));
  }

  expireCredits(customerId) {
    const credits = this._credits[customerId] || [];
    credits.forEach(c => { if (c.expiresAt && Date.now() >= c.expiresAt) c.remaining = 0; });
  }

  clear() { this._credits = {}; }
}

module.exports = { CreditManager };
