class ReleaseValidator {
  constructor(config) {
    this.name = config.name;
    this.rules = config.rules || [];
  }
  validate(release) { const errors = []; for (const r of this.rules) { if (r.required && !release[r.field]) errors.push(`${r.field} is required`); } return { valid: errors.length === 0, errors }; }
  addRule(rule) { this.rules.push(rule); }
  getRules() { return [...this.rules]; }
}
module.exports = { ReleaseValidator };
