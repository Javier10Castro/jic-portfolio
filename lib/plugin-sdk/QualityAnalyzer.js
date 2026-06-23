class QualityAnalyzer {
  constructor(name) {
    this.name = name;
    this._analyzers = {};
  }
  registerAttribute(name, analyzerFn) {
    this._analyzers[name] = analyzerFn;
  }
  analyze(attribute, context) {
    const analyzer = this._analyzers[attribute];
    const result = analyzer ? analyzer(context) : null;
    return { attribute, result };
  }
}
module.exports = { QualityAnalyzer };
