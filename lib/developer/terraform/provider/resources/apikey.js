class ApiKeyResource {
  constructor(provider) { this._provider = provider; this.type = 'platform_api_key'; }
  create(name, config) { return { id: `key-${Date.now()}`, name, key: `plt_${Date.now()}_secret`, status: 'created' }; }
  read(id) { return { id, name: 'my-key', scopes: ['read', 'write'] }; }
  delete(id) { return { success: true, id }; }
}
module.exports = { ApiKeyResource };
