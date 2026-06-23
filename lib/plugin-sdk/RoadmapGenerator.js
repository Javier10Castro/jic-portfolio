class RoadmapGenerator {
  constructor(name) {
    this.name = name || 'RoadmapGenerator';
    this._generators = [];
  }

  registerGenerator(fn) {
    if (typeof fn !== 'function') throw new Error('generator must be a function');
    this._generators.push(fn);
    return this;
  }

  generate(evolutionId, context) {
    if (!evolutionId) return [];
    const roadmaps = this._generators.map(fn => fn(evolutionId, context));
    return roadmaps;
  }
}

module.exports = { RoadmapGenerator };
