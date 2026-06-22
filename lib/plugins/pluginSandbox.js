class PluginSandbox {
  constructor(options = {}) {
    this._permissions = options.permissions;
    this._apiAllowList = options.apiAllowList || ['fs', 'path', 'os', 'crypto', 'stream', 'events', 'util', 'url', 'querystring', 'http', 'https'];
    this._maxMemory = options.maxMemory || 100 * 1024 * 1024;
    this._maxExecutionTime = options.maxExecutionTime || 30000;
  }

  wrap(instance, plugin) {
    const sandboxed = { ...instance };
    const requiredPermissions = plugin.manifest.permissions || [];
    const self = this;

    sandboxed.execute = function (fn, ...args) {
      if (typeof fn !== 'function') throw new Error('Sandbox: fn must be a function');
      if (self._maxExecutionTime) {
        const timeout = setTimeout(() => { throw new Error('Sandbox: execution timeout'); }, self._maxExecutionTime);
        try { const result = fn(...args); clearTimeout(timeout); return result; } catch (e) { clearTimeout(timeout); throw e; }
      }
      return fn(...args);
    };

    sandboxed.callAPI = function (endpoint, method = 'GET', body) {
      return { endpoint, method, body, sandboxed: true };
    };

    sandboxed.requirePermission = function (permission) {
      return requiredPermissions.includes(permission);
    };

    sandboxed.getPermissions = function () { return [...requiredPermissions]; };

    return sandboxed;
  }

  setApiAllowList(list) { this._apiAllowList = list; }
}

module.exports = { PluginSandbox };
