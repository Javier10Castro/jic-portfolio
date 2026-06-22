class CompositionRule {
  constructor(name, ruleFn) { this.name = name; this._ruleFn = ruleFn; }
  evaluate(composition) { return this._ruleFn(composition); }
  getName() { return this.name; }
}
module.exports = { CompositionRule };
