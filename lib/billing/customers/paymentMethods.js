class PaymentMethods {
  constructor(options = {}) { this._storage = options.storage; this._methods = {}; }

  addMethod(customerId, data) {
    const method = {
      id: `pm-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      customerId, type: data.type || 'card',
      isDefault: data.isDefault || false,
      last4: data.last4 || '', brand: data.brand || '',
      expMonth: data.expMonth || null, expYear: data.expYear || null,
      billingAddress: data.billingAddress || null,
      status: 'active', createdAt: Date.now()
    };
    if (method.isDefault) this._clearDefault(customerId);
    if (!this._methods[customerId]) this._methods[customerId] = [];
    this._methods[customerId].push(method);
    if (this._storage) this._storage.create('paymentMethods', method.id, method);
    return { ...method };
  }

  removeMethod(id) {
    for (const cid of Object.keys(this._methods)) {
      const idx = this._methods[cid].findIndex(m => m.id === id);
      if (idx !== -1) {
        const method = this._methods[cid].splice(idx, 1)[0];
        if (this._storage) this._storage.delete('paymentMethods', id);
        return method;
      }
    }
    return null;
  }

  getMethods(customerId) {
    return (this._methods[customerId] || []).map(m => ({ ...m }));
  }

  getDefaultMethod(customerId) {
    const methods = this._methods[customerId] || [];
    return methods.find(m => m.isDefault) || methods[0] || null;
  }

  setDefault(customerId, methodId) {
    this._clearDefault(customerId);
    const methods = this._methods[customerId] || [];
    const method = methods.find(m => m.id === methodId);
    if (method) method.isDefault = true;
    return method || null;
  }

  _clearDefault(customerId) {
    (this._methods[customerId] || []).forEach(m => { m.isDefault = false; });
  }

  clear() { this._methods = {}; }
}

module.exports = { PaymentMethods };
