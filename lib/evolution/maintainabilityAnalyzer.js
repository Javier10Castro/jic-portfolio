class MaintainabilityAnalyzer {
  constructor() {
    this._analyses = [];
    this._counter = 0;
  }

  analyze(evolutionId, codeBase) {
    if (!evolutionId) throw new Error('evolutionId is required');
    const id = 'mnt_an_' + (++this._counter);
    const cb = codeBase || {};
    const issues = [];
    if (cb.duplicateCode && cb.duplicateCode > 0.2) {
      issues.push({ type: 'high_duplication', value: cb.duplicateCode, threshold: 0.2, severity: 'medium' });
    }
    if (cb.commentRatio && cb.commentRatio < 0.05) {
      issues.push({ type: 'low_comment_ratio', value: cb.commentRatio, threshold: 0.05, severity: 'low' });
    }
    if (cb.testCoverage && cb.testCoverage < 0.5) {
      issues.push({ type: 'low_test_coverage', value: cb.testCoverage, threshold: 0.5, severity: 'high' });
    }
    if (cb.sourceLines && cb.sourceLines > 10000) {
      issues.push({ type: 'large_codebase', value: cb.sourceLines, threshold: 10000, severity: 'low' });
    }
    const score = issues.length === 0 ? 1 : Math.max(0, 1 - issues.length * 0.15);
    const analysis = {
      id, evolutionId, score, issues,
      timestamp: new Date().toISOString()
    };
    this._analyses.push(analysis);
    return analysis;
  }

  get(id) {
    if (!id) return null;
    return this._analyses.find(a => a.id === id) || null;
  }

  list() {
    return this._analyses;
  }

  clear() {
    this._analyses = [];
    this._counter = 0;
  }
}

module.exports = { MaintainabilityAnalyzer };
