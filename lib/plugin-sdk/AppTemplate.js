class AppTemplate {
  constructor(id, name, config) {
    this.id = id;
    this.name = name;
    this.config = config || {};
  }
  getConfig() { return { ...this.config }; }
  apply(customizations) { return { ...this.config, ...customizations }; }
  getModules() { return this.config.modules || []; }
  getCapabilities() { return this.config.capabilities || []; }
}
module.exports = { AppTemplate };
