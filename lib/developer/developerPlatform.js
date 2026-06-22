const { SdkRegistry } = require('./sdkRegistry');
const { SdkGenerator } = require('./sdkGenerator');
const { ClientGenerator } = require('./clientGenerator');
const { OpenApiGenerator } = require('./openApiGenerator');
const { SchemaGenerator } = require('./schemaGenerator');
const { DeveloperEvents, EVENTS } = require('./developerEvents');
const { DeveloperStorage } = require('./developerStorage');
const { DeveloperAnalytics } = require('./developerAnalytics');
const { DeveloperPortal } = require('./developerPortal');

class DeveloperPlatform {
  constructor(options = {}) {
    this.registry = options.registry || new SdkRegistry();
    this.sdkGenerator = options.sdkGenerator || new SdkGenerator({ registry: this.registry });
    this.clientGenerator = options.clientGenerator || new ClientGenerator();
    this.openApiGenerator = options.openApiGenerator || new OpenApiGenerator();
    this.schemaGenerator = options.schemaGenerator || new SchemaGenerator();
    this.events = options.events || new DeveloperEvents();
    this.storage = options.storage || new DeveloperStorage();
    this.analytics = options.analytics || new DeveloperAnalytics({ storage: this.storage });
    this.portal = options.portal || new DeveloperPortal({ analytics: this.analytics });
  }

  generateSdk(language, options) { return this.sdkGenerator.generate(language, options); }
  getSdkStatus(language) { return this.sdkGenerator.getStatus(language); }
  listSdks() { return this.sdkGenerator.listSdks(); }

  generateClient(language, spec) { return this.clientGenerator.generate(language, spec); }
  getClientStatus(id) { return this.clientGenerator.getStatus(id); }

  generateOpenApi(version) { return this.openApiGenerator.generate(version); }
  getOpenApiSpec(version) { return this.openApiGenerator.getSpec(version); }

  generateSchema(domain) { return this.schemaGenerator.generate(domain); }
  getSchema(name) { return this.schemaGenerator.getSchema(name); }

  generatePostman() { return { collection: { info: { name: 'Platform API', version: '4.5.0' }, item: [] }, success: true }; }
  generateTerraform() { return { provider: { name: 'platform', version: '4.5.0' }, resources: {}, success: true }; }
  generateGitHubAction() { return { action: { name: 'Platform Action', runs: { using: 'node20', main: 'index.js' } }, success: true }; }

  trackEvent(type, data) { return this.events.emit(type, data); }
  getEvents(filter) { return this.events.history(filter); }

  getAnalytics() { return this.analytics.getStats(); }
  recordApiCall(endpoint, method, status, latency) { return this.analytics.recordCall(endpoint, method, status, latency); }

  getPortal() { return this.portal.render(); }

  getStatus() {
    return {
      sdks: this.sdkGenerator.listSdks().length,
      clients: this.clientGenerator.getCount(),
      openApiVersions: this.openApiGenerator.getVersions().length,
      schemas: this.schemaGenerator.getCount(),
      events: this.events.history().length,
      analytics: this.analytics.getStats()
    };
  }

  clear() {
    this.registry.clear(); this.sdkGenerator.clear(); this.clientGenerator.clear();
    this.openApiGenerator.clear(); this.schemaGenerator.clear();
    this.events.clear(); this.storage.clear(); this.analytics.clear();
  }
}

let _default = null;
function getDefaultPlatform(options = {}) { if (!_default) _default = new DeveloperPlatform(options); return _default; }
function createPlatform(options = {}) { return new DeveloperPlatform(options); }

module.exports = { DeveloperPlatform, getDefaultPlatform, createPlatform, EVENTS };
