class Integration {
  constructor(config) {
    this.provider = config.provider;
    this.name = config.name || config.provider;
    this.description = config.description || '';
    this.authType = config.authType || 'oauth2';
    this._connectHandler = config.onConnect || (() => ({ success: true }));
    this._disconnectHandler = config.onDisconnect || (() => ({ success: true }));
    this._syncHandler = config.onSync || (() => ({ success: true }));
  }

  connect(config) { return this._connectHandler(config); }
  disconnect() { return this._disconnectHandler(); }
  sync(type) { return this._syncHandler(type); }
  setConnectHandler(fn) { this._connectHandler = fn; }
  setDisconnectHandler(fn) { this._disconnectHandler = fn; }
  setSyncHandler(fn) { this._syncHandler = fn; }
}

const createIntegration = (config) => new Integration(config);

module.exports = { Integration, createIntegration };
