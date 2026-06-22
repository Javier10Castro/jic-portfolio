class PolicyProvider {
  constructor(plugin) {
    this._plugin = plugin;
    this._policies = [];
    this._providers = [];
  }

  registerPolicy(policy) { this._policies.push(policy); }
  registerProvider(provider) { this._providers.push(provider); }
  getPolicies() { return [...this._policies]; }
  getProviders() { return [...this._providers]; }
  clear() { this._policies = []; this._providers = []; }
}

module.exports = { PolicyProvider };
