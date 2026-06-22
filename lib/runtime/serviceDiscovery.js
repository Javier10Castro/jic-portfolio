class ServiceDiscovery {
  constructor(registry) {
    if (!registry) {
      throw new Error('registry is required');
    }
    this._registry = registry;
    this._roundRobin = new Map();
  }

  discover(name) {
    if (!name) return [];
    return this._registry.findByName(name);
  }

  discoverAll() {
    return this._registry.list();
  }

  getInstance(name) {
    const instances = this.discover(name);
    if (instances.length === 0) return null;
    if (instances.length === 1) return instances[0];
    if (!this._roundRobin.has(name)) {
      this._roundRobin.set(name, 0);
    }
    let index = this._roundRobin.get(name);
    const instance = instances[index % instances.length];
    this._roundRobin.set(name, (index + 1) % instances.length);
    return instance;
  }

  refresh() {
    this._roundRobin.clear();
    return this._registry.list();
  }

  clear() {
    this._roundRobin.clear();
    this._registry.clear();
  }
}

module.exports = { ServiceDiscovery };
