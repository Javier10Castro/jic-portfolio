class MigrationPlanner {
  constructor() {
    this._migrations = [];
    this._counter = 0;
  }

  create(evolutionId, steps) {
    if (!evolutionId) throw new Error('evolutionId is required');
    if (!Array.isArray(steps)) throw new Error('steps must be an array');
    const id = 'mig_' + (++this._counter);
    const plan = {
      id, evolutionId,
      steps: JSON.parse(JSON.stringify(steps)),
      status: 'draft',
      rollbackPlan: [],
      createdAt: new Date().toISOString()
    };
    this._migrations.push(plan);
    return plan;
  }

  get(id) {
    if (!id) return null;
    return this._migrations.find(m => m.id === id) || null;
  }

  list(evolutionId) {
    if (!evolutionId) return this._migrations;
    return this._migrations.filter(m => m.evolutionId === evolutionId);
  }

  updateStatus(id, status) {
    if (!id || !status) return null;
    const plan = this._migrations.find(m => m.id === id);
    if (!plan) return null;
    plan.status = status;
    return plan;
  }

  clear() {
    this._migrations = [];
    this._counter = 0;
  }
}

module.exports = { MigrationPlanner };
