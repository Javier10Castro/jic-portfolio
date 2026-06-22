class WorkspaceResource {
  constructor(provider) { this._provider = provider; this.type = 'platform_workspace'; }
  create(name, config) { return { id: `ws-${Date.now()}`, name, config, status: 'created' }; }
  read(id) { return { id, name: 'default', members: 5 }; }
  update(id, config) { return { id, ...config }; }
  delete(id) { return { success: true, id }; }
}
module.exports = { WorkspaceResource };
