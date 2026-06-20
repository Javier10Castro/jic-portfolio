const EVENT_TYPES = {
  COST_UPDATED: 'cost.updated',
  BUDGET_WARNING: 'cost.budget.warning',
  BUDGET_EXCEEDED: 'cost.budget.exceeded',
  OPTIMIZATION_APPLIED: 'cost.optimization.applied',
  FORECAST_UPDATED: 'cost.forecast.updated',
  QUOTA_WARNING: 'cost.quota.warning',
  POLICY_VIOLATION: 'cost.policy.violation',
  RECOMMENDATION_GENERATED: 'cost.recommendation.generated',
};

class CostEvents {
  constructor(options = {}) {
    this._eventBus = options.eventBus || null;
    this._listeners = new Map();
    this._history = [];
    this._maxHistory = options.maxHistory || 500;
  }

  setEventBus(bus) {
    this._eventBus = bus;
  }

  on(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(handler);
    return () => {
      const handlers = this._listeners.get(type);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
      }
    };
  }

  emit(type, data = {}) {
    const event = { type, data, timestamp: Date.now(), id: 'evt-' + Math.random().toString(36).substring(2, 10) };
    this._history.push(event);
    if (this._history.length > this._maxHistory) this._history.shift();
    const handlers = this._listeners.get(type);
    if (handlers) {
      for (const h of handlers) {
        try { h(event); } catch (e) {}
      }
    }
    if (this._eventBus) {
      try { this._eventBus.emit(type, data, { source: 'cost' }); } catch (e) {}
    }
    return event;
  }

  emitCostUpdated(data) {
    return this.emit(EVENT_TYPES.COST_UPDATED, data);
  }

  emitBudgetWarning(data) {
    return this.emit(EVENT_TYPES.BUDGET_WARNING, data);
  }

  emitBudgetExceeded(data) {
    return this.emit(EVENT_TYPES.BUDGET_EXCEEDED, data);
  }

  emitOptimizationApplied(data) {
    return this.emit(EVENT_TYPES.OPTIMIZATION_APPLIED, data);
  }

  emitForecastUpdated(data) {
    return this.emit(EVENT_TYPES.FORECAST_UPDATED, data);
  }

  emitQuotaWarning(data) {
    return this.emit(EVENT_TYPES.QUOTA_WARNING, data);
  }

  emitPolicyViolation(data) {
    return this.emit(EVENT_TYPES.POLICY_VIOLATION, data);
  }

  getHistory(filter = {}) {
    let results = this._history;
    if (filter.type) results = results.filter(e => e.type === filter.type);
    if (filter.since) results = results.filter(e => e.timestamp >= filter.since);
    return results.slice(-(filter.limit || 100));
  }

  clear() {
    this._history = [];
    this._listeners.clear();
  }
}

module.exports = { CostEvents, EVENT_TYPES };
