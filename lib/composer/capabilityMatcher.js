class CapabilityMatcher {
  constructor() {
    this._history = [];
    this._counter = 0;
  }

  match(requirements, capabilities) {
    if (!Array.isArray(requirements) || !Array.isArray(capabilities)) {
      return [];
    }
    const results = [];
    for (const req of requirements) {
      for (const cap of capabilities) {
        const score = this._simpleScore(cap, req);
        if (score > 0) {
          results.push({
            requirement: req,
            capability: cap,
            score,
            _id: `match_${++this._counter}`,
          });
        }
      }
    }
    results.sort((a, b) => b.score - a.score);
    this._history.push({
      type: 'match',
      requirements,
      capabilitiesCount: capabilities.length,
      resultsCount: results.length,
      timestamp: Date.now(),
    });
    return results;
  }

  matchSingle(requirement, capabilities) {
    if (!requirement || !Array.isArray(capabilities)) return null;
    const results = this.match([requirement], capabilities);
    return results.length > 0 ? results[0] : null;
  }

  _simpleScore(capability, requirement) {
    let score = 0;
    if (!capability || !requirement) return 0;
    if (
      capability.name &&
      requirement.name &&
      capability.name.toLowerCase() === requirement.name.toLowerCase()
    ) {
      score += 0.6;
    } else if (
      capability.name &&
      requirement.name &&
      capability.name.toLowerCase().includes(requirement.name.toLowerCase())
    ) {
      score += 0.3;
    }
    if (
      capability.type &&
      requirement.type &&
      capability.type.toLowerCase() === requirement.type.toLowerCase()
    ) {
      score += 0.4;
    }
    return score;
  }

  getMatchHistory() {
    return this._history;
  }

  clear() {
    this._history = [];
    this._counter = 0;
  }
}

module.exports = { CapabilityMatcher };
