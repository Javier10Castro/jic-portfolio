class FailurePatterns {
  constructor() {
    this._patterns = [];
    this._counter = 0;
  }

  record(projectId, failure, impact) {
    if (!projectId) throw new Error('projectId is required');
    if (!failure) throw new Error('failure is required');
    const id = 'fp_' + (++this._counter);
    const entry = {
      id,
      projectId,
      failure,
      impact: impact || {},
      severity: impact && impact.severity ? impact.severity : 'medium',
      recordedAt: new Date().toISOString()
    };
    this._patterns.push(entry);
    return entry;
  }

  get(id) {
    if (!id) return null;
    return this._patterns.find(p => p.id === id) || null;
  }

  findByProject(projectId) {
    if (!projectId) return [];
    return this._patterns.filter(p => p.projectId === projectId);
  }

  findBySeverity(severity) {
    if (!severity) return [];
    return this._patterns.filter(p => p.severity === severity);
  }

  commonPatterns(limit) {
    const freq = {};
    for (const p of this._patterns) {
      const key = typeof p.failure === 'string' ? p.failure : JSON.stringify(p.failure);
      freq[key] = (freq[key] || 0) + 1;
    }
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, limit || 10).map(([failure, count]) => ({ failure, count }));
  }

  list() {
    return this._patterns;
  }

  clear() {
    this._patterns = [];
    this._counter = 0;
  }
}

module.exports = { FailurePatterns };
