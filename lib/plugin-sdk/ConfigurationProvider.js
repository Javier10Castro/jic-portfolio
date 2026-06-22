class ConfigurationProvider {
  constructor(config) {
    this.name = config.name;
    this.source = config.source || 'plugin';
    this.priority = config.priority || 0;
  }
  getConfig(name) { return null; }
  setConfig(name, value) { return false; }
  listConfigs() { return []; }
}
module.exports = { ConfigurationProvider };
