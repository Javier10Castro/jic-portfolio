const { EvaluationRegistry } = require('./evaluationRegistry');
const { EvaluationRunner } = require('./evaluationRunner');
const { EvaluationStorage } = require('./evaluationStorage');
const { EvaluationEvents } = require('./evaluationEvents');
const { EvaluationMetrics } = require('./evaluationMetrics');
const { EvaluationScheduler } = require('./evaluationScheduler');
const { EvaluationHistory } = require('./evaluationHistory');
const { EvaluationReports } = require('./evaluationReports');

class EvaluationEngine {
  constructor(options = {}) {
    this.registry = options.registry || new EvaluationRegistry();
    this.storage = options.storage || new EvaluationStorage();
    this.events = options.events || new EvaluationEvents();
    this.metrics = options.metrics || new EvaluationMetrics();
    this.scheduler = options.scheduler || new EvaluationScheduler();
    this.history = options.history || new EvaluationHistory();
    this.runner = options.runner || new EvaluationRunner(this.registry, this.storage, this.events, this.history);
    this.reports = options.reports || new EvaluationReports(this.history, this.metrics, this.storage);
  }

  async evaluate(type, input, options = {}) {
    const id = this.registry.listEvaluators(type)[0]?.id;
    if (!id) throw new Error(`No evaluator registered for type: ${type}`);
    return this.runner.run({ type, evaluatorId: id, input, options, tags: options.tags });
  }

  async evaluateWith(evaluatorId, input, options = {}) {
    return this.runner.run({ type: 'custom', evaluatorId, input, options, tags: options.tags });
  }

  getStatus() {
    return {
      registry: { evaluators: this.registry.listEvaluators().length, metrics: this.registry.listMetrics().length, benchmarks: this.registry.listBenchmarks().length, rubrics: this.registry.listRubrics().length, datasets: this.registry.listDatasets().length },
      runner: { active: this.runner.getActive().length, total: this.runner.listRuns().length },
      history: { entries: this.history.query().length },
      schedules: this.scheduler.listSchedules().length,
      reports: this.reports.listReports().length,
    };
  }

  clear() {
    this.registry.clear();
    this.storage.clear();
    this.events.clear();
    this.metrics.clear();
    this.scheduler.clear();
    this.history.clear();
    this.runner.clear();
    this.reports.clear();
  }
}

module.exports = { EvaluationEngine };
