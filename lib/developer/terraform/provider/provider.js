class TerraformProvider {
  constructor() { this.name = 'platform'; this.version = '4.5.0'; this._resources = {}; }

  configure(config) {
    this.apiKey = config.apiKey || process.env.PLATFORM_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.platform.io/v1';
    return { success: true, provider: this.name, version: this.version };
  }

  registerResource(type, impl) { this._resources[type] = impl; }
  getResource(type) { return this._resources[type] || null; }
  listResources() { return Object.keys(this._resources); }
  clear() { this._resources = {}; }
}
module.exports = { TerraformProvider };
