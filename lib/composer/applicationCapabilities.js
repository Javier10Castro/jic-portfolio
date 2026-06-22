class ApplicationCapabilities {
  constructor() {
    this._capabilities = new Map();
  }

  addCapability(appId, capability) {
    if (!appId || !capability) {
      throw new Error('appId and capability are required');
    }
    if (!capability.id) {
      throw new Error('capability must have an id');
    }
    if (!this._capabilities.has(appId)) {
      this._capabilities.set(appId, new Map());
    }
    const entry = {
      id: capability.id,
      name: capability.name || '',
      type: capability.type || '',
      version: capability.version || '1.0.0',
      config: capability.config || {}
    };
    this._capabilities.get(appId).set(capability.id, entry);
    return entry;
  }

  getCapabilities(appId) {
    if (!appId) return [];
    const caps = this._capabilities.get(appId);
    return caps ? Array.from(caps.values()) : [];
  }

  removeCapability(appId, capabilityId) {
    if (!appId || !capabilityId) return false;
    const caps = this._capabilities.get(appId);
    if (!caps) return false;
    return caps.delete(capabilityId);
  }

  hasCapability(appId, capabilityId) {
    if (!appId || !capabilityId) return false;
    const caps = this._capabilities.get(appId);
    if (!caps) return false;
    return caps.has(capabilityId);
  }

  clear() {
    this._capabilities.clear();
  }
}

module.exports = { ApplicationCapabilities };
