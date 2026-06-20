class BillingStorage {
  constructor() {
    this._data = {
      customers: {}, subscriptions: {}, invoices: {}, payments: {},
      plans: {}, credits: {}, refunds: {}, usage: {},
      quotes: {}, discounts: {}, paymentMethods: {}, addresses: {},
      webhookLogs: [], billingProfiles: {}, trials: {}, taxRates: {}
    };
  }

  _ns(name) { if (!this._data[name] || Array.isArray(this._data[name])) this._data[name] = {}; return this._data[name]; }
  _arr(name) { if (!this._data[name] || !Array.isArray(this._data[name])) { if (typeof this._data[name] === 'object' && !Array.isArray(this._data[name])) { this._data[name] = []; } else { this._data[name] = []; } } return this._data[name]; }

  create(ns, id, data) { const store = this._ns(ns); store[id] = { ...data, id, createdAt: Date.now(), updatedAt: Date.now() }; return store[id]; }
  get(ns, id) { const store = this._ns(ns); return store[id] ? { ...store[id] } : null; }
  update(ns, id, data) { const store = this._ns(ns); if (!store[id]) return null; store[id] = { ...store[id], ...data, updatedAt: Date.now() }; return { ...store[id] }; }
  delete(ns, id) { const store = this._ns(ns); const item = store[id]; if (item) delete store[id]; return item || null; }
  list(ns, filter) {
    const store = this._ns(ns);
    let items = Object.values(store);
    if (filter) {
      Object.entries(filter).forEach(([k, v]) => { items = items.filter(i => i[k] === v); });
    }
    return items.map(i => ({ ...i }));
  }
  push(ns, data) { const arr = this._arr(ns); const entry = { ...data, id: `${ns}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`, timestamp: Date.now() }; arr.push(entry); return entry; }
  getCollection(ns) { return this._arr(ns); }
  clear() { Object.keys(this._data).forEach(k => { if (Array.isArray(this._data[k])) this._data[k] = []; else this._data[k] = {}; }); }
}

module.exports = { BillingStorage };
