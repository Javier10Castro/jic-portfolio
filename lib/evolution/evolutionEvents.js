class EvolutionEvents {
  static EVENTS = {
    EVOLUTION_CREATED: 'evolution:created',
    EVOLUTION_ANALYZED: 'evolution:analyzed',
    EVOLUTION_PLANNED: 'evolution:planned',
    EVOLUTION_EXECUTED: 'evolution:executed',
    EVOLUTION_COMPLETED: 'evolution:completed',
    EVOLUTION_FAILED: 'evolution:failed',
    DEBT_IDENTIFIED: 'debt:identified',
    DEBT_PRIORITIZED: 'debt:prioritized',
    REFACTOR_SCHEDULED: 'refactor:scheduled',
    REFACTOR_COMPLETED: 'refactor:completed',
    ROADMAP_GENERATED: 'roadmap:generated',
    MIGRATION_PLANNED: 'migration:planned',
    OPTIMIZATION_APPLIED: 'optimization:applied'
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

module.exports = { EvolutionEvents };
