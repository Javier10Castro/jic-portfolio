class AggregationEngine {
  sum(values) { return values.reduce((a, b) => a + b, 0); }
  avg(values) { return values.length ? this.sum(values) / values.length : 0; }
  min(values) { return Math.min(...values); }
  max(values) { return Math.max(...values); }
  count(values) { return values.length; }
  groupBy(rows, key) {
    const groups = {};
    rows.forEach(r => { const k = r[key]; if (!groups[k]) groups[k] = []; groups[k].push(r); });
    return groups;
  }
  aggregate(rows, groupKey, measure, operation) {
    const groups = this.groupBy(rows, groupKey);
    const result = {};
    Object.entries(groups).forEach(([k, vals]) => {
      const values = vals.map(v => v[measure]).filter(v => typeof v === 'number');
      result[k] = this[operation] ? this[operation](values) : values.length;
    });
    return result;
  }
}
module.exports = { AggregationEngine };
