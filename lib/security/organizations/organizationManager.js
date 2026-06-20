const crypto = require('crypto');

class OrganizationManager {
  constructor() {
    this._organizations = new Map();
  }

  create(input) {
    const id = input.id || `org-${crypto.randomUUID().substring(0, 8)}`;
    const org = {
      id, name: input.name, slug: input.slug || input.name.toLowerCase().replace(/\s+/g, '-'),
      description: input.description || '', domain: input.domain || null,
      plan: input.plan || 'free', settings: input.settings || {},
      createdAt: Date.now(), updatedAt: Date.now(), status: input.status || 'active'
    };
    this._organizations.set(id, org);
    return org;
  }

  get(id) {
    return this._organizations.get(id) || null;
  }

  update(id, updates) {
    const org = this._organizations.get(id);
    if (!org) return null;
    Object.assign(org, updates, { updatedAt: Date.now() });
    return org;
  }

  delete(id) {
    return this._organizations.delete(id);
  }

  list(filter = {}) {
    let results = Array.from(this._organizations.values());
    if (filter.status) results = results.filter(o => o.status === filter.status);
    if (filter.plan) results = results.filter(o => o.plan === filter.plan);
    if (filter.search) results = results.filter(o => o.name.toLowerCase().includes(filter.search.toLowerCase()));
    return results;
  }

  getByDomain(domain) {
    return Array.from(this._organizations.values()).find(o => o.domain === domain) || null;
  }

  getBySlug(slug) {
    return Array.from(this._organizations.values()).find(o => o.slug === slug) || null;
  }

  setPlan(id, plan) {
    const org = this._organizations.get(id);
    if (!org) return false;
    org.plan = plan;
    org.updatedAt = Date.now();
    return true;
  }

  suspend(id) {
    const org = this._organizations.get(id);
    if (!org) return false;
    org.status = 'suspended';
    org.updatedAt = Date.now();
    return true;
  }

  activate(id) {
    const org = this._organizations.get(id);
    if (!org) return false;
    org.status = 'active';
    org.updatedAt = Date.now();
    return true;
  }

  clear() {
    this._organizations.clear();
  }
}

module.exports = { OrganizationManager };
