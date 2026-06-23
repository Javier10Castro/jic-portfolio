class ArchitecturePattern {
  constructor(name) {
    this.name = name;
    this._rules = [];
  }
  addRule(rule) {
    this._rules.push(rule);
    return this;
  }
  getRules() {
    return this._rules;
  }
  evaluate(context) {
    const results = this._rules.map(rule => rule(context));
    const passed = results.every(r => r === true);
    return { passed, results };
  }
}
module.exports = { ArchitecturePattern };
