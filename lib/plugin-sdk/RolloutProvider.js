class RolloutProvider {
  constructor(config) {
    this.name = config.name;
    this.strategies = config.strategies || ['canary', 'blue-green', 'progressive'];
  }
  executeStrategy(name, config) { return { strategy: name, status: 'simulated', config }; }
  getStrategies() { return [...this.strategies]; }
}
module.exports = { RolloutProvider };
