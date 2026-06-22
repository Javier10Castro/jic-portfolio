class CapabilityScoring {
  constructor() {
    this._criteria = [
      { name: 'name', weight: 0.4, description: 'Name similarity' },
      { name: 'type', weight: 0.3, description: 'Type match' },
      { name: 'version', weight: 0.2, description: 'Version compatibility' },
      { name: 'description', weight: 0.1, description: 'Description relevance' },
    ];
  }

  score(capability, requirement) {
    if (!capability || !requirement) {
      return { score: 0, factors: [] };
    }
    const factors = [];
    let total = 0;

    const nameFactor = this._scoreByName(capability, requirement);
    factors.push({ name: 'name', weight: 0.4, value: nameFactor });
    total += nameFactor * 0.4;

    const typeFactor = this._scoreByType(capability, requirement);
    factors.push({ name: 'type', weight: 0.3, value: typeFactor });
    total += typeFactor * 0.3;

    const versionFactor = this._scoreByVersion(capability, requirement);
    factors.push({ name: 'version', weight: 0.2, value: versionFactor });
    total += versionFactor * 0.2;

    const descFactor = this._scoreByDescription(capability, requirement);
    factors.push({ name: 'description', weight: 0.1, value: descFactor });
    total += descFactor * 0.1;

    return { score: Math.round(total * 100) / 100, factors };
  }

  _scoreByName(capability, requirement) {
    if (!capability.name || !requirement.name) return 0;
    const a = capability.name.toLowerCase();
    const b = requirement.name.toLowerCase();
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.6;
    return 0;
  }

  _scoreByType(capability, requirement) {
    if (!capability.type || !requirement.type) return 0;
    return capability.type.toLowerCase() === requirement.type.toLowerCase()
      ? 1
      : 0;
  }

  _scoreByVersion(capability, requirement) {
    if (!capability.version || !requirement.version) return 0.5;
    return capability.version === requirement.version ? 1 : 0.3;
  }

  _scoreByDescription(capability, requirement) {
    if (!capability.description || !requirement.description) return 0;
    const a = capability.description.toLowerCase();
    const b = requirement.description.toLowerCase();
    if (a.includes(b) || b.includes(a)) return 0.7;
    return 0;
  }

  scoreByName(name, requirement) {
    if (!name || !requirement) return { score: 0, factors: [] };
    const cap = { name };
    return this.score(cap, requirement);
  }

  scoreByType(type, requirement) {
    if (!type || !requirement) return { score: 0, factors: [] };
    const cap = { type };
    return this.score(cap, requirement);
  }

  getScoringCriteria() {
    return this._criteria;
  }

  clear() {
    this._criteria = [
      { name: 'name', weight: 0.4, description: 'Name similarity' },
      { name: 'type', weight: 0.3, description: 'Type match' },
      { name: 'version', weight: 0.2, description: 'Version compatibility' },
      { name: 'description', weight: 0.1, description: 'Description relevance' },
    ];
  }
}

module.exports = { CapabilityScoring };
