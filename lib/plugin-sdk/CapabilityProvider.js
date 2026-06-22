class CapabilityProvider {
  constructor(name) { this.name = name; this._capabilities = []; }
  registerCapability(cap) { this._capabilities.push(cap); }
  getCapabilities() { return [...this._capabilities]; }
  findCapability(id) { return this._capabilities.find(c => c.id === id) || null; }
}
module.exports = { CapabilityProvider };
