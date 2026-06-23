class ArchitectureEvents {
  static EVENTS = {
    ARCHITECTURE_CREATED: 'architecture:created',
    ARCHITECTURE_DESIGNED: 'architecture:designed',
    ARCHITECTURE_VALIDATED: 'architecture:validated',
    PATTERN_SELECTED: 'pattern:selected',
    PATTERN_EVALUATED: 'pattern:evaluated',
    DECISION_MADE: 'decision:made',
    DECISION_REJECTED: 'decision:rejected',
    RISK_IDENTIFIED: 'risk:identified',
    TRADEOFF_ANALYZED: 'tradeoff:analyzed',
    BLUEPRINT_GENERATED: 'blueprint:generated',
    ARCHITECTURE_EXPORTED: 'architecture:exported',
    QUALITY_ANALYZED: 'quality:analyzed',
    TOPOLOGY_GENERATED: 'topology:generated'
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
    if (!event) {
      throw new Error('event must be a non-empty string');
    }
    const listeners = this._listeners.get(event);
    if (!listeners) return false;
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (err) {
      }
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

module.exports = { ArchitectureEvents };
