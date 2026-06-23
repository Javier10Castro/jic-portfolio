class DecisionValidator {
  constructor() {
    this._validators = [];
  }
  addValidator(fn) {
    this._validators.push(fn);
    return this;
  }
  validate(decision) {
    const errors = this._validators.map(fn => fn(decision)).filter(r => r !== true);
    const valid = errors.length === 0;
    return { valid, errors };
  }
}
module.exports = { DecisionValidator };
