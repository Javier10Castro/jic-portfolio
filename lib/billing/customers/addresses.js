class Addresses {
  constructor(options = {}) { this._storage = options.storage; this._addresses = {}; }

  addAddress(customerId, data) {
    const address = {
      id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      customerId, type: data.type || 'billing',
      line1: data.line1, line2: data.line2 || '',
      city: data.city, state: data.state,
      postalCode: data.postalCode, country: data.country,
      isDefault: data.isDefault || false, createdAt: Date.now()
    };
    if (!this._addresses[customerId]) this._addresses[customerId] = [];
    this._addresses[customerId].push(address);
    if (this._storage) this._storage.create('addresses', address.id, address);
    return { ...address };
  }

  getAddresses(customerId, type) {
    const addrs = this._addresses[customerId] || [];
    let filtered = type ? addrs.filter(a => a.type === type) : addrs;
    return filtered.map(a => ({ ...a }));
  }

  getDefaultAddress(customerId, type) {
    const addrs = this._addresses[customerId] || [];
    return addrs.find(a => a.isDefault && (!type || a.type === type)) || addrs[0] || null;
  }

  deleteAddress(id) {
    for (const cid of Object.keys(this._addresses)) {
      const idx = this._addresses[cid].findIndex(a => a.id === id);
      if (idx !== -1) { const a = this._addresses[cid].splice(idx, 1)[0]; return a; }
    }
    return null;
  }

  clear() { this._addresses = {}; }
}

module.exports = { Addresses };
