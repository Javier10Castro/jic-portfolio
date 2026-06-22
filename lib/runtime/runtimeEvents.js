class RuntimeEvents {
  static get EVENTS() {
    return {
      RUNTIME_STARTED: 'RUNTIME_STARTED',
      RUNTIME_STOPPED: 'RUNTIME_STOPPED',
      CONFIG_CHANGED: 'CONFIG_CHANGED',
      FLAG_CHANGED: 'FLAG_CHANGED',
      SECRET_ROTATED: 'SECRET_ROTATED',
      SERVICE_REGISTERED: 'SERVICE_REGISTERED',
      SERVICE_UNREGISTERED: 'SERVICE_UNREGISTERED',
      SERVICE_HEALTH_CHANGED: 'SERVICE_HEALTH_CHANGED',
      LOCK_ACQUIRED: 'LOCK_ACQUIRED',
      LOCK_RELEASED: 'LOCK_RELEASED',
      ROLLOUT_STARTED: 'ROLLOUT_STARTED',
      ROLLOUT_COMPLETED: 'ROLLOUT_COMPLETED',
      ROLLOUT_FAILED: 'ROLLOUT_FAILED',
      KILL_SWITCH_ACTIVATED: 'KILL_SWITCH_ACTIVATED',
      SAFE_MODE_ENABLED: 'SAFE_MODE_ENABLED',
      SAFE_MODE_DISABLED: 'SAFE_MODE_DISABLED',
    };
  }

  constructor() {
    this._handlers = new Map();
  }

  on(event, handler) {
    if (!event || typeof handler !== 'function') {
      return false;
    }
    if (!this._handlers.has(event)) {
      this._handlers.set(event, []);
    }
    this._handlers.get(event).push(handler);
    return true;
  }

  off(event, handler) {
    if (!this._handlers.has(event)) {
      return false;
    }
    const handlers = this._handlers.get(event);
    const index = handlers.indexOf(handler);
    if (index === -1) {
      return false;
    }
    handlers.splice(index, 1);
    if (handlers.length === 0) {
      this._handlers.delete(event);
    }
    return true;
  }

  emit(event, data) {
    if (!this._handlers.has(event)) {
      return false;
    }
    const handlers = this._handlers.get(event);
    for (const handler of handlers) {
      handler(data);
    }
    return true;
  }

  listEvents() {
    return Array.from(this._handlers.keys());
  }

  clear() {
    this._handlers.clear();
  }
}

module.exports = { RuntimeEvents };
