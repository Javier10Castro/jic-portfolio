class CustomerManager {
  constructor(options = {}) {
    this._storage = options.storage;
    this._customers = {};
  }

  createCustomer(data) {
    const customer = {
      id: `cus-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      email: data.email, name: data.name || '',
      company: data.company || '', phone: data.phone || '',
      taxId: data.taxId || '', currency: data.currency || 'usd',
      locale: data.locale || 'en', metadata: data.metadata || {},
      status: 'active', createdAt: Date.now()
    };
    this._customers[customer.id] = customer;
    if (this._storage) this._storage.create('customers', customer.id, customer);
    return customer;
  }

  updateCustomer(id, data) {
    const customer = this._customers[id];
    if (!customer) return null;
    Object.assign(customer, data, { updatedAt: Date.now() });
    if (this._storage) this._storage.update('customers', id, customer);
    return { ...customer };
  }

  getCustomer(id) { return this._customers[id] ? { ...this._customers[id] } : null; }
  findByEmail(email) {
    return Object.values(this._customers).find(c => c.email === email) || null;
  }
  listCustomers(filter) {
    let items = Object.values(this._customers);
    if (filter) Object.entries(filter).forEach(([k, v]) => { items = items.filter(i => i[k] === v); });
    return items.map(i => ({ ...i }));
  }
  deleteCustomer(id) { const c = this._customers[id]; if (c) delete this._customers[id]; return c || null; }
  clear() { this._customers = {}; }
}

module.exports = { CustomerManager };
