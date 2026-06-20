class ForecastEngine {
  constructor() {
    this._forecasts = [];
    this._maxForecasts = 500;
  }

  predict(snapshots = []) {
    if (snapshots.length === 0) return this._emptyForecast();
    const dailyTotal = this._aggregateByPeriod(snapshots, 'daily');
    const dailyCosts = dailyTotal.map(d => d.totalCost).filter(c => c > 0);
    if (dailyCosts.length === 0) return this._emptyForecast();

    const avgDaily = dailyCosts.reduce((a, b) => a + b, 0) / dailyCosts.length;
    const trend = this._calculateTrend(dailyCosts);
    const projectedDaily = avgDaily * (1 + trend);

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - today.getDate() + 1;
    const daysElapsed = today.getDate();

    const monthToDate = dailyCosts.reduce((a, b) => a + b, 0);
    const projectedMonthly = monthToDate + (projectedDaily * daysRemaining);
    const projectedQuarterly = projectedMonthly * 3;
    const projectedYearly = projectedMonthly * 12;

    const budgetExhaustion = this._estimateBudgetExhaustion(avgDaily, projectedMonthly);

    const entry = { timestamp: Date.now(), daily: { average: Math.round(avgDaily * 100) / 100, trend: Math.round(trend * 10000) / 100 }, projected: { daily: Math.round(projectedDaily * 100) / 100, monthly: Math.round(projectedMonthly * 100) / 100, quarterly: Math.round(projectedQuarterly * 100) / 100, yearly: Math.round(projectedYearly * 100) / 100 }, monthToDate: Math.round(monthToDate * 100) / 100, budgetExhaustion, dataPoints: dailyCosts.length, sampleSnapshots: snapshots.length };
    this._forecasts.push(entry);
    if (this._forecasts.length > this._maxForecasts) this._forecasts.shift();
    return entry;
  }

  getForecasts(limit = 10) {
    return this._forecasts.slice(-limit);
  }

  getLatestForecast() {
    return this._forecasts.length > 0 ? this._forecasts[this._forecasts.length - 1] : null;
  }

  clear() {
    this._forecasts = [];
  }

  _emptyForecast() {
    return { timestamp: Date.now(), daily: { average: 0, trend: 0 }, projected: { daily: 0, monthly: 0, quarterly: 0, yearly: 0 }, monthToDate: 0, budgetExhaustion: null, dataPoints: 0, sampleSnapshots: 0 };
  }

  _aggregateByPeriod(snapshots, period) {
    const groups = {};
    for (const s of snapshots) {
      const d = new Date(s.timestamp);
      const key = period === 'daily' ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = { key, totalCost: 0, count: 0 };
      groups[key].totalCost += s.totalCost || 0;
      groups[key].count++;
    }
    return Object.values(groups);
  }

  _calculateTrend(values) {
    if (values.length < 3) return 0;
    const n = values.length;
    const indices = values.map((_, i) => i);
    const meanX = (n - 1) / 2;
    const meanY = values.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - meanX) * (values[i] - meanY);
      den += (i - meanX) * (i - meanX);
    }
    const slope = den > 0 ? num / den : 0;
    const baseValue = Math.abs(meanY) > 0.001 ? meanY : 1;
    return slope / baseValue;
  }

  _estimateBudgetExhaustion(avgDaily, projectedMonthly) {
    if (avgDaily <= 0) return null;
    return {
      estimatedMonthlyTotal: Math.round(projectedMonthly * 100) / 100,
      dailyBurnRate: Math.round(avgDaily * 100) / 100,
      estimatedDaysUntilExhaustion: null,
    };
  }
}

module.exports = ForecastEngine;
