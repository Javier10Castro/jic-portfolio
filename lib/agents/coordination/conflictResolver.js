const ConsensusEngine = require('./consensusEngine');

const CONFLICT_CATEGORIES = {
  technology: 'technology',
  design: 'design',
  content: 'content',
  architecture: 'architecture',
  performance: 'performance',
  style: 'style',
};

class ConflictResolver {
  constructor() {
    this.consensus = new ConsensusEngine();
    this._conflicts = [];
    this._maxHistory = 100;
  }

  detect(agents) {
    const conflicts = [];

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i];
        const b = agents[j];
        if (!a || !b) continue;

        if (a.output?.technology && b.output?.technology && a.output.technology !== b.output.technology) {
          conflicts.push({
            type: CONFLICT_CATEGORIES.technology,
            between: [a.constructor?.name || a.id, b.constructor?.name || b.id],
            options: [
              { agent: a.constructor?.name || a.id, value: a.output.technology, confidence: a.output.confidence || 0.5 },
              { agent: b.constructor?.name || b.id, value: b.output.technology, confidence: b.output.confidence || 0.5 },
            ],
          });
        }

        if (a.output?.framework && b.output?.framework && a.output.framework !== b.output.framework) {
          conflicts.push({
            type: CONFLICT_CATEGORIES.architecture,
            between: [a.constructor?.name || a.id, b.constructor?.name || b.id],
            options: [
              { agent: a.constructor?.name || a.id, value: a.output.framework, confidence: a.output.confidence || 0.5 },
              { agent: b.constructor?.name || b.id, value: b.output.framework, confidence: b.output.confidence || 0.5 },
            ],
          });
        }
      }
    }

    this._conflicts.push(...conflicts);
    if (this._conflicts.length > this._maxHistory) this._conflicts = this._conflicts.slice(-this._maxHistory);

    return conflicts;
  }

  resolveConflicts(conflicts, context = {}) {
    if (!conflicts || conflicts.length === 0) return [];
    return conflicts.map(c => {
      const resolved = this.consensus.resolve(c.options, context);
      return { ...c, resolved };
    });
  }

  getHistory(limit = 50) {
    return this._conflicts.slice(-limit);
  }

  clear() {
    this._conflicts = [];
    this.consensus.clear();
  }
}

module.exports = ConflictResolver;
