class ModuleMerge {
  constructor() {
    this._merges = [];
    this._counter = 0;
  }

  analyze(evolutionId, modules) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'merge_' + (++this._counter);
    const mods = modules || [];
    const candidates = [];
    for (let i = 0; i < mods.length; i++) {
      for (let j = i + 1; j < mods.length; j++) {
        const a = mods[i];
        const b = mods[j];
        if (a.responsibilities && b.responsibilities) {
          const shared = a.responsibilities.filter(r => b.responsibilities.includes(r));
          if (shared.length > 0) {
            candidates.push({ moduleA: a.name || a.id, moduleB: b.name || b.id, sharedResponsibilities: shared });
          }
        }
      }
    }
    const analysis = {
      id, evolutionId,
      candidates,
      totalCandidates: candidates.length,
      timestamp: new Date().toISOString()
    };
    this._merges.push(analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._merges.find(m => m.id === id) || null;
  }

  list() {
    return this._merges;
  }

  clear() {
    this._merges = [];
    this._counter = 0;
  }
}

module.exports = { ModuleMerge };
