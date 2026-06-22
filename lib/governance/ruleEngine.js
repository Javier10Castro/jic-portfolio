const conditionParser = require('./conditionParser');
const expressionEvaluator = require('./expressionEvaluator');

class RuleEngine {
  constructor() {
    this.cache = new Map();
  }

  evaluate(rules, data) {
    if (!Array.isArray(rules) || !data) return { matched: false, results: [] };
    const results = rules.map(rule => {
      const actual = expressionEvaluator.evaluateField(rule.field, data);
      const matched = expressionEvaluator.applyOperator(rule.operator, actual, rule.value);
      return { rule, matched, actual };
    });
    return { matched: results.every(r => r.matched), results };
  }

  evaluateAll(ruleGroups, data) {
    if (!Array.isArray(ruleGroups)) return [];
    return ruleGroups.map(group => this.evaluate(group, data));
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new RuleEngine();
