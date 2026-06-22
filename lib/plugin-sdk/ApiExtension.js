class ApiExtension {
  constructor(config) {
    this.path = config.path;
    this.method = (config.method || 'GET').toUpperCase();
    this.description = config.description || '';
    this._handler = config.handler || (() => ({ error: 'Not implemented' }));
    this.auth = config.auth !== false;
  }

  handle(req, res) {
    return this._handler(req, res);
  }

  setHandler(handler) { this._handler = handler; }
}

const createApiExtension = (config) => new ApiExtension(config);

module.exports = { ApiExtension, createApiExtension };
