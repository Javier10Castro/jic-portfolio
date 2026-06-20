class TenantIsolation {
  constructor() {
    this._tenants = new Map();
    this._isolationStrategies = new Map();
  }

  registerTenant(orgId, config = {}) {
    this._tenants.set(orgId, {
      orgId,
      isolationLevel: config.isolationLevel || 'shared',
      database: config.database || null,
      schema: config.schema || null,
      dataPrefix: config.dataPrefix || `org_${orgId}`,
      registeredAt: Date.now()
    });
  }

  getTenant(orgId) {
    return this._tenants.get(orgId) || null;
  }

  setIsolationLevel(orgId, level) {
    const tenant = this._tenants.get(orgId);
    if (!tenant) return false;
    tenant.isolationLevel = level;
    return true;
  }

  isolateQuery(orgId, query) {
    const tenant = this._tenants.get(orgId);
    if (!tenant) return query;
    if (tenant.isolationLevel === 'database' && tenant.database) {
      return { database: tenant.database, query };
    }
    if (tenant.isolationLevel === 'schema' && tenant.schema) {
      return { schema: tenant.schema, query };
    }
    if (tenant.isolationLevel === 'row') {
      const existingWhere = query.includes('WHERE') ? ` AND org_id = '${orgId}'` : ` WHERE org_id = '${orgId}'`;
      return query + existingWhere;
    }
    return { prefix: tenant.dataPrefix, query };
  }

  registerStrategy(name, handler) {
    this._isolationStrategies.set(name, handler);
  }

  executeStrategy(name, orgId, data) {
    const handler = this._isolationStrategies.get(name);
    if (!handler) throw new Error(`Unknown isolation strategy: ${name}`);
    return handler(orgId, data);
  }

  listTenants() {
    return Array.from(this._tenants.values());
  }

  clear() {
    this._tenants.clear();
    this._isolationStrategies.clear();
  }
}

module.exports = { TenantIsolation };
