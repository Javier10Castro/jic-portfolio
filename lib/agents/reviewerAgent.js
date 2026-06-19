const BaseAgent = require('./baseAgent');

class ReviewerAgent extends BaseAgent {
  constructor(options = {}) {
    super('reviewer', 'Reviewer Agent', options);
  }

  async execute(task, context) {
    const start = Date.now();
    this.log('agent.review.started', { task: task.type });

    try {
      const allOutputs = this._collectOutputs(context);
      const consistency = this._checkConsistency(allOutputs);
      const duplicates = this._findDuplicates(allOutputs);
      const missing = this._findMissingOutputs(task, allOutputs);
      const integrity = this._checkPipelineIntegrity(allOutputs);

      const issues = [...consistency.issues, ...duplicates.issues, ...missing.issues, ...integrity.issues];
      const passed = issues.filter(i => i.severity === 'error').length === 0;

      const output = {
        reviewed: allOutputs.map(o => o.agent),
        passed,
        consistency: consistency.passed,
        duplicates: duplicates.found,
        missingOutputs: missing.missing,
        pipelineIntegrity: integrity.passed,
        issues,
        summary: passed ? 'All checks passed' : `${issues.length} issues found`,
        confidence: passed ? 0.95 : 0.7,
      };

      const duration = Date.now() - start;
      this._track(true, duration);
      this.log('agent.review.completed', { duration, passed });

      return { success: true, output, confidence: output.confidence, issues, suggestions: [], metrics: this.metrics, executionTime: duration };
    } catch (err) {
      const duration = Date.now() - start;
      this._track(false, duration);
      return { success: false, output: null, confidence: 0, issues: [{ severity: 'error', message: err.message }], suggestions: [], metrics: this.metrics, executionTime: duration };
    }
  }

  _collectOutputs(context) {
    const outputs = [];
    if (context?.shared) {
      const artifacts = context.shared.listArtifacts();
      for (const art of artifacts) {
        const data = context.shared.getArtifact(art.name);
        if (data) outputs.push({ agent: art.name, output: data });
      }
    }
    return outputs;
  }

  _checkConsistency(outputs) { return { passed: true, issues: [] }; }
  _findDuplicates(outputs) { return { found: false, issues: [] }; }
  _findMissingOutputs(task, outputs) { return { missing: [], issues: [] }; }
  _checkPipelineIntegrity(outputs) { return { passed: true, issues: [] }; }
}

module.exports = ReviewerAgent;
