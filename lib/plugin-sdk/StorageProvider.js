class StorageProvider {
  constructor(config) {
    this.name = config.name;
    this.type = config.type || 'storage';
    this.capabilities = config.capabilities || [];
    this._handlers = {};
  }
  registerHandler(operation, handler) { this._handlers[operation] = handler; }
  execute(operation, ...args) { const h = this._handlers[operation]; return h ? h(...args) : null; }
  getHandlers() { return { ...this._handlers }; }
}
module.exports = { StorageProvider };
