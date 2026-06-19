const LEVELS = { TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 };
const LEVEL_NAMES = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'];

class Logger {
  constructor(storage, options = {}) {
    this._storage = storage;
    this._minLevel = options.minLevel || 'INFO';
    this._source = options.source || 'system';
    this._enabled = options.enabled !== false;
  }

  trace(message, meta = {}) { return this._log('TRACE', message, meta); }
  debug(message, meta = {}) { return this._log('DEBUG', message, meta); }
  info(message, meta = {}) { return this._log('INFO', message, meta); }
  warn(message, meta = {}) { return this._log('WARN', message, meta); }
  error(message, meta = {}) { return this._log('ERROR', message, meta); }

  _log(level, message, meta = {}) {
    if (!this._enabled) return;
    if (LEVELS[level] < LEVELS[this._minLevel]) return;

    const entry = {
      level,
      message,
      timestamp: Date.now(),
      source: meta.source || this._source,
      traceId: meta.traceId || null,
      workflowId: meta.workflowId || null,
      conversationId: meta.conversationId || null,
      projectId: meta.projectId || null,
      agent: meta.agent || null,
      provider: meta.provider || null,
      latency: meta.latency || null,
      error: meta.error || null,
      data: meta.data || null,
    };

    if (this._storage) this._storage.storeLog(entry).catch(() => {});
    return entry;
  }

  child(options) {
    return new Logger(this._storage, {
      minLevel: this._minLevel,
      source: options.source || this._source,
      enabled: this._enabled,
    });
  }

  setLevel(level) {
    if (LEVELS[level] !== undefined) this._minLevel = level;
  }

  getLevel() { return this._minLevel; }

  enable() { this._enabled = true; }
  disable() { this._enabled = false; }

  async getLogs(filter = {}) {
    if (this._storage) return this._storage.getLogs(filter);
    return [];
  }
}

module.exports = { Logger, LEVELS, LEVEL_NAMES };
