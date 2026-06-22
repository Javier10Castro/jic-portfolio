class ServiceResolver {
  constructor(registry) {
    if (!registry) {
      throw new Error('registry is required');
    }
    this._registry = registry;
  }

  resolve(name) {
    const instances = this._registry.findByName(name);
    if (instances.length === 0) return null;
    const svc = instances[0];
    return {
      host: svc.host,
      port: svc.port,
      protocol: svc.protocol,
      url: `${svc.protocol}://${svc.host}:${svc.port}`
    };
  }

  resolveUrl(name) {
    const resolved = this.resolve(name);
    return resolved ? resolved.url : null;
  }

  resolveAll(names) {
    if (!Array.isArray(names)) return {};
    const result = {};
    for (const name of names) {
      result[name] = this.resolve(name);
    }
    return result;
  }

  clear() {
    this._registry.clear();
  }
}

module.exports = { ServiceResolver };
