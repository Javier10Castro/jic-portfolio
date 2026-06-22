class WorkflowEvaluator {
  constructor() {
    this.scores = new Map();
    this.workflows = new Map();
  }

  evaluateWorkflow(workflowId, executionLog) {
    const steps = executionLog.steps || [];
    const stepScores = steps.map(step => this.evaluateStep(step, null));
    const overallScore = stepScores.length > 0
      ? stepScores.reduce((acc, s) => acc + s.score, 0) / stepScores.length
      : 0;
    const bottlenecks = stepScores
      .filter(s => s.latency > 1000)
      .map(s => ({ step: s.step, latency: s.latency }));
    const suggestions = bottlenecks.map(b =>
      `Step "${b.step}" has high latency (${b.latency}ms). Consider parallelizing or optimizing.`
    );

    if (!this.scores.has(workflowId)) {
      this.scores.set(workflowId, []);
    }
    this.scores.get(workflowId).push(overallScore);
    if (!this.workflows.has(workflowId)) {
      this.workflows.set(workflowId, { id: workflowId, createdAt: new Date() });
    }

    return { overallScore, stepScores, bottlenecks, suggestions };
  }

  evaluateStep(step, expected) {
    const success = expected !== null ? (step.result === expected ? 1 : 0) : 1;
    const latency = step.duration || Math.floor(Math.random() * 2000);
    const score = success * Math.max(0, 1 - latency / 5000);
    return { step: step.name || step.id, score, latency, success: success === 1 };
  }

  getWorkflowScore(workflowId) {
    const entries = this.scores.get(workflowId);
    if (!entries || entries.length === 0) return 0;
    const sum = entries.reduce((a, b) => a + b, 0);
    return sum / entries.length;
  }

  listWorkflows() {
    return Array.from(this.workflows.values());
  }

  clear() {
    this.scores.clear();
    this.workflows.clear();
  }
}

module.exports = WorkflowEvaluator;
