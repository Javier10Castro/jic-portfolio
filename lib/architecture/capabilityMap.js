class CapabilityMap {
  constructor() {
    this._maps = new Map();
  }

  map(solutionId, capabilities) {
    if (!solutionId || !capabilities) {
      throw new Error('solutionId and capabilities are required');
    }
    if (!Array.isArray(capabilities)) {
      throw new Error('capabilities must be an array');
    }
    const entries = capabilities.map(c => ({
      id: c.id || `cap-${Math.random().toString(36).substr(2, 9)}`,
      name: c.name || '',
      description: c.description || '',
      category: c.category || 'general',
      maturity: c.maturity || 'initial'
    }));
    this._maps.set(solutionId, entries);
    return entries;
  }

  get(solutionId) {
    if (!solutionId) return [];
    return this._maps.get(solutionId) || [];
  }

  addCapability(solutionId, cap) {
    if (!solutionId || !cap) {
      throw new Error('solutionId and cap are required');
    }
    if (!this._maps.has(solutionId)) {
      this._maps.set(solutionId, []);
    }
    const entry = {
      id: cap.id || `cap-${Math.random().toString(36).substr(2, 9)}`,
      name: cap.name || '',
      description: cap.description || '',
      category: cap.category || 'general',
      maturity: cap.maturity || 'initial'
    };
    this._maps.get(solutionId).push(entry);
    return entry;
  }

  removeCapability(solutionId, capId) {
    if (!solutionId || !capId) return false;
    const caps = this._maps.get(solutionId);
    if (!caps) return false;
    const index = caps.findIndex(c => c.id === capId);
    if (index === -1) return false;
    caps.splice(index, 1);
    return true;
  }

  findByCategory(solutionId, category) {
    if (!solutionId || !category) return [];
    const caps = this._maps.get(solutionId);
    if (!caps) return [];
    return caps.filter(c => c.category === category);
  }

  clear() {
    this._maps.clear();
  }
}

module.exports = { CapabilityMap };
