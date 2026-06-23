class ModuleSplit {
  constructor() {
    this._splits = [];
    this._counter = 0;
  }

  analyze(evolutionId, modules) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'split_' + (++this._counter);
    const mods = modules || [];
    const candidates = mods.filter(m => {
      const lines = m.linesOfCode || 0;
      const responsibilities = m.responsibilities || 1;
      return lines > 500 || responsibilities > 3;
    });
    const analysis = {
      id, evolutionId,
      candidates: candidates.map(c => ({ name: c.name || c.id, linesOfCode: c.linesOfCode, responsibilities: c.responsibilities })),
      totalCandidates: candidates.length,
      timestamp: new Date().toISOString()
    };
    this._splits.push(analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._splits.find(s => s.id === id) || null;
  }

  list() {
    return this._splits;
  }

  clear() {
    this._splits = [];
    this._counter = 0;
  }
}

module.exports = { ModuleSplit };
