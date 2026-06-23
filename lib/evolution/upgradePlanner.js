class UpgradePlanner {
  constructor() {
    this._upgrades = [];
    this._counter = 0;
  }

  create(evolutionId, upgrades) {
    if (!evolutionId) throw new Error('evolutionId is required');
    if (!Array.isArray(upgrades)) throw new Error('upgrades must be an array');
    const id = 'upg_' + (++this._counter);
    const plan = {
      id, evolutionId,
      upgrades: JSON.parse(JSON.stringify(upgrades)),
      status: 'draft',
      breakingChanges: upgrades.filter(u => u.breaking === true).length,
      createdAt: new Date().toISOString()
    };
    this._upgrades.push(plan);
    return plan;
  }

  get(id) {
    if (!id) return null;
    return this._upgrades.find(u => u.id === id) || null;
  }

  list(evolutionId) {
    if (!evolutionId) return this._upgrades;
    return this._upgrades.filter(u => u.evolutionId === evolutionId);
  }

  updateStatus(id, status) {
    if (!id || !status) return null;
    const plan = this._upgrades.find(u => u.id === id);
    if (!plan) return null;
    plan.status = status;
    return plan;
  }

  clear() {
    this._upgrades = [];
    this._counter = 0;
  }
}

module.exports = { UpgradePlanner };
