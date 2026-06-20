class BillingProfile {
  constructor(options = {}) { this._storage = options.storage; this._profiles = {}; }

  createProfile(customerId, data = {}) {
    const profile = {
      id: `bp-${customerId}`, customerId,
      company: data.company || '', vatNumber: data.vatNumber || '',
      taxId: data.taxId || '', businessType: data.businessType || 'individual',
      billingEmail: data.billingEmail || '',
      preferredCurrency: data.preferredCurrency || 'usd',
      billingCycle: data.billingCycle || 'monthly',
      invoicePrefix: data.invoicePrefix || 'INV',
      poNumber: data.poNumber || '', notes: data.notes || '',
      metadata: data.metadata || {}, createdAt: Date.now()
    };
    this._profiles[profile.id] = profile;
    if (this._storage) this._storage.create('billingProfiles', profile.id, profile);
    return { ...profile };
  }

  getProfile(customerId) {
    const id = `bp-${customerId}`;
    return this._profiles[id] ? { ...this._profiles[id] } : null;
  }

  updateProfile(customerId, data) {
    const id = `bp-${customerId}`;
    const profile = this._profiles[id];
    if (!profile) return null;
    Object.assign(profile, data, { updatedAt: Date.now() });
    if (this._storage) this._storage.update('billingProfiles', id, profile);
    return { ...profile };
  }

  clear() { this._profiles = {}; }
}

module.exports = { BillingProfile };
