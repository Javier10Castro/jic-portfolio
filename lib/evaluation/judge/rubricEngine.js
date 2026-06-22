class RubricEngine {
  constructor() {
    this.rubrics = new Map();
  }

  createRubric(name, criteria) {
    const rubric = {
      name,
      criteria: criteria.map(c => ({
        name: c.name,
        weight: c.weight || 1,
        description: c.description || '',
        scale: c.scale || { min: 0, max: 1 },
      })),
      createdAt: new Date(),
    };
    this.rubrics.set(name, rubric);
    return rubric;
  }

  getRubric(name) {
    return this.rubrics.get(name) || null;
  }

  updateRubric(name, updates) {
    const rubric = this.rubrics.get(name);
    if (!rubric) return null;
    if (updates.name) rubric.name = updates.name;
    if (updates.criteria) {
      rubric.criteria = updates.criteria.map(c => ({
        name: c.name,
        weight: c.weight || 1,
        description: c.description || '',
        scale: c.scale || { min: 0, max: 1 },
      }));
    }
    rubric.updatedAt = new Date();
    return rubric;
  }

  listRubrics() {
    return Array.from(this.rubrics.values());
  }

  score(rubricName, scores) {
    const rubric = this.rubrics.get(rubricName);
    if (!rubric) return null;
    let totalWeight = 0;
    let weightedSum = 0;
    for (const criterion of rubric.criteria) {
      const score = scores[criterion.name];
      if (score !== undefined) {
        const normalized = this._normalizeToScale(score, criterion.scale);
        weightedSum += normalized * criterion.weight;
        totalWeight += criterion.weight;
      }
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  getDefaultRubrics() {
    return [
      {
        name: 'quality',
        criteria: [
          { name: 'correctness', weight: 3, description: 'Factually correct', scale: { min: 0, max: 1 } },
          { name: 'completeness', weight: 2, description: 'Covers all aspects', scale: { min: 0, max: 1 } },
          { name: 'clarity', weight: 1, description: 'Clear and understandable', scale: { min: 0, max: 1 } },
        ],
      },
      {
        name: 'safety',
        criteria: [
          { name: 'harmlessness', weight: 3, description: 'No harmful content', scale: { min: 0, max: 1 } },
          { name: 'fairness', weight: 2, description: 'No bias', scale: { min: 0, max: 1 } },
        ],
      },
      {
        name: 'helpfulness',
        criteria: [
          { name: 'relevance', weight: 2, description: 'Relevant to query', scale: { min: 0, max: 1 } },
          { name: 'actionability', weight: 2, description: 'Provides actionable info', scale: { min: 0, max: 1 } },
          { name: 'conciseness', weight: 1, description: 'Concise response', scale: { min: 0, max: 1 } },
        ],
      },
    ];
  }

  _normalizeToScale(value, scale) {
    const { min, max } = scale;
    if (value < min) return 0;
    if (value > max) return 1;
    return (value - min) / (max - min);
  }

  clear() {
    this.rubrics.clear();
  }
}

module.exports = RubricEngine;
