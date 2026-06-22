const { ConfigurationRegistry } = require('./configurationRegistry');
const { ConfigurationSources } = require('./configurationSources');
const { ConfigurationOverrides } = require('./configurationOverrides');
const { ConfigurationProfiles } = require('./configurationProfiles');
const { ConfigurationValidation } = require('./configurationValidation');

class ConfigurationManager {
  constructor() {
    this._registry = new ConfigurationRegistry();
    this._sources = new ConfigurationSources();
    this._overrides = new ConfigurationOverrides();
    this._profiles = new ConfigurationProfiles();
    this._validation = new ConfigurationValidation();
  }

  getConfig(name) {
    if (this._overrides.hasOverride(name)) {
      const ovr = this._overrides.getOverride(name);
      return ovr.value;
    }
    const activeProfile = this._profiles.getActiveProfile();
    if (activeProfile) {
      const profile = this._profiles.getProfile(activeProfile);
      if (profile && profile.configs && profile.configs[name] !== undefined) {
        return profile.configs[name];
      }
    }
    const reg = this._registry.get(name);
    if (reg) return reg.value;
    const sourceData = this._sources.fetchAll();
    if (sourceData && sourceData[name] !== undefined) {
      return sourceData[name];
    }
    return undefined;
  }

  setConfig(name, value) {
    this._registry.register(name, { value });
  }

  activateProfile(name) {
    this._profiles.activateProfile(name);
  }

  getConfigValue(name, defaultValue) {
    const value = this.getConfig(name);
    return value !== undefined ? value : defaultValue;
  }

  getStatus() {
    const configs = this._registry.list();
    const sources = this._sources.listSources();
    const profiles = this._profiles.listProfiles();
    const overrides = this._overrides.listOverrides();
    return {
      total: configs.length,
      sources: sources.length,
      profiles: profiles.length,
      overrides: overrides.length
    };
  }

  clear() {
    this._registry.clear();
    this._sources.clear();
    this._overrides.clear();
    this._profiles.clear();
    this._validation.clear();
  }
}

module.exports = { ConfigurationManager };
