const DEFAULT_BUDGETS = [
  { id: 'default-daily', name: 'Daily Budget', scope: 'organization', period: 'daily', softLimit: 100, hardLimit: 200, alertThresholds: [50, 80, 90, 100], alerts: true, enabled: true, createdAt: 0 },
  { id: 'default-monthly', name: 'Monthly Budget', scope: 'organization', period: 'monthly', softLimit: 3000, hardLimit: 5000, alertThresholds: [50, 75, 90, 100], alerts: true, enabled: true, createdAt: 0 },
];

class BudgetManager {
  constructor(options = {}) {
    this._budgets = [];
    this._spend = new Map();
    this._alerts = [];
    this._maxAlerts = options.maxAlerts || 500;
    this._defaultBudgets = options.defaultBudgets !== false;
    if (this._defaultBudgets) {
      for (const b of DEFAULT_BUDGETS) this._budgets.push({ ...b, createdAt: Date.now() });
    }
  }

  getBudgets(filter = {}) {
    let results = this._budgets;
    if (filter.scope) results = results.filter(b => b.scope === filter.scope);
    if (filter.period) results = results.filter(b => b.period === filter.period);
    if (filter.enabled !== undefined) results = results.filter(b => b.enabled === filter.enabled);
    return [...results];
  }

  getBudget(id) {
    return this._budgets.find(b => b.id === id) || null;
  }

  addBudget(budget) {
    if (!budget.id) throw new Error('Budget must have an id');
    if (this._budgets.find(b => b.id === budget.id)) throw new Error(`Budget '${budget.id}' already exists`);
    const entry = { ...budget, createdAt: Date.now() };
    this._budgets.push(entry);
    return entry;
  }

  updateBudget(id, updates) {
    const idx = this._budgets.findIndex(b => b.id === id);
    if (idx === -1) throw new Error(`Budget '${id}' not found`);
    const disallowed = ['id', 'createdAt'];
    for (const k of disallowed) delete updates[k];
    this._budgets[idx] = { ...this._budgets[idx], ...updates, updatedAt: Date.now() };
    return this._budgets[idx];
  }

  removeBudget(id) {
    const idx = this._budgets.findIndex(b => b.id === id);
    if (idx === -1) throw new Error(`Budget '${id}' not found`);
    this._budgets.splice(idx, 1);
    return true;
  }

  recordSpend(amount, category, metadata = {}) {
    const now = Date.now();
    const dayKey = this._periodKey('daily', now);
    const monthKey = this._periodKey('monthly', now);
    this._addSpend(dayKey, amount, category, metadata);
    this._addSpend(monthKey, amount, category, metadata);
    return this._checkBudgets(now);
  }

  getSpend(period, date = Date.now()) {
    const key = this._periodKey(period, date);
    return this._spend.get(key) || { total: 0, categories: {}, count: 0, period, key };
  }

  getCurrentDailySpend() {
    return this.getSpend('daily');
  }

  getCurrentMonthlySpend() {
    return this.getSpend('monthly');
  }

  getAlerts(filter = {}) {
    let results = this._alerts;
    if (filter.budgetId) results = results.filter(a => a.budgetId === filter.budgetId);
    if (filter.level) results = results.filter(a => a.level === filter.level);
    if (filter.since) results = results.filter(a => a.timestamp >= filter.since);
    return results.slice(-(filter.limit || 100));
  }

  getAlertStats() {
    const total = this._alerts.length;
    const byLevel = {};
    for (const a of this._alerts) {
      byLevel[a.level] = (byLevel[a.level] || 0) + 1;
    }
    return { total, byLevel };
  }

  clear() {
    this._budgets = [];
    this._spend.clear();
    this._alerts = [];
  }

  reset() {
    this.clear();
    if (this._defaultBudgets) {
      for (const b of DEFAULT_BUDGETS) this._budgets.push({ ...b, createdAt: Date.now() });
    }
  }

  _addSpend(key, amount, category, metadata) {
    if (!this._spend.has(key)) this._spend.set(key, { total: 0, categories: {}, count: 0, period: key.split(':')[0], key });
    const entry = this._spend.get(key);
    entry.total += amount;
    entry.count++;
    if (!entry.categories[category]) entry.categories[category] = { total: 0, count: 0 };
    entry.categories[category].total += amount;
    entry.categories[category].count++;
  }

  _checkBudgets(now) {
    const alerts = [];
    for (const budget of this._budgets) {
      if (!budget.enabled) continue;
      const spend = this.getSpend(budget.period, now);
      const pct = budget.hardLimit > 0 ? Math.round((spend.total / budget.hardLimit) * 10000) / 100 : 0;
      for (const threshold of (budget.alertThresholds || [])) {
        if (pct >= threshold && !this._alertFired(budget.id, threshold, now)) {
          const level = threshold >= 100 ? 'critical' : threshold >= 80 ? 'warning' : 'info';
          const alert = { id: 'alert-' + Math.random().toString(36).substring(2, 10), budgetId: budget.id, budgetName: budget.name, threshold, currentPercent: pct, currentSpend: spend.total, hardLimit: budget.hardLimit, softLimit: budget.softLimit, level, category: 'budget', timestamp: now };
          this._alerts.push(alert);
          if (this._alerts.length > this._maxAlerts) this._alerts.shift();
          alerts.push(alert);
        }
      }
      if (budget.hardLimit > 0 && spend.total >= budget.hardLimit) {
        return { alerts, hardLimitExceeded: true, budgetId: budget.id, budgetName: budget.name, spend: spend.total, hardLimit: budget.hardLimit };
      }
    }
    return { alerts, hardLimitExceeded: false };
  }

  _alertFired(budgetId, threshold, now) {
    const recent = this._alerts.filter(a => a.budgetId === budgetId && a.threshold === threshold && (now - a.timestamp) < 86400000);
    return recent.length > 0;
  }

  _periodKey(period, date) {
    const d = new Date(date);
    if (period === 'daily') return `daily:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (period === 'monthly') return `monthly:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${period}:${date}`;
  }
}

module.exports = { BudgetManager, DEFAULT_BUDGETS };
