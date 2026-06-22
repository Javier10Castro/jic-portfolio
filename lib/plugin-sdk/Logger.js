class PluginLogger {
  constructor(pluginId) {
    this._pluginId = pluginId;
    this._logs = [];
  }

  info(message, data) { this._log('info', message, data); }
  warn(message, data) { this._log('warn', message, data); }
  error(message, data) { this._log('error', message, data); }
  debug(message, data) { this._log('debug', message, data); }

  _log(level, message, data) {
    const entry = { timestamp: Date.now(), pluginId: this._pluginId, level, message, data: data || {} };
    this._logs.push(entry);
    if (this._logs.length > 1000) this._logs.shift();
    return entry;
  }

  getLogs(level) {
    if (!level) return [...this._logs];
    return this._logs.filter(l => l.level === level);
  }

  clear() { this._logs = []; }
}

module.exports = { PluginLogger };
