class StudioEvents {
  static EVENTS = {
    BUILD_STARTED: 'studio:build:started',
    STAGE_ADVANCED: 'studio:stage:advanced',
    STAGE_COMPLETED: 'studio:stage:completed',
    STAGE_FAILED: 'studio:stage:failed',
    BUILD_COMPLETED: 'studio:build:completed',
    BUILD_FAILED: 'studio:build:failed',
    PROJECT_CREATED: 'studio:project:created',
    PROJECT_UPDATED: 'studio:project:updated',
    WORKSPACE_UPDATED: 'studio:workspace:updated'
  };

  constructor() {
    this._listeners = new Map();
  }

  on(event, listener) {
    if (!event || typeof listener !== 'function') {
      throw new Error('event must be a non-empty string and listener must be a function');
    }
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(listener);
    return this;
  }

  off(event, listener) {
    if (!event || !listener) return this;
    const listeners = this._listeners.get(event);
    if (!listeners) return this;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    if (listeners.length === 0) {
      this._listeners.delete(event);
    }
    return this;
  }

  emit(event, ...args) {
    if (!event) throw new Error('event must be a non-empty string');
    const listeners = this._listeners.get(event);
    if (!listeners) return false;
    listeners.forEach(listener => {
      try { listener(...args); } catch (err) {}
    });
    return true;
  }

  listEvents() {
    return Array.from(this._listeners.keys());
  }

  clear() {
    this._listeners.clear();
  }
}

module.exports = { StudioEvents };
