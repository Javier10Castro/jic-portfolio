class EvaluationRunner {
  constructor(registry, storage, events, history) {
    this._registry = registry;
    this._storage = storage;
    this._events = events;
    this._history = history;
    this._active = new Map();
  }

  async run(evaluation) {
    const id = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const run = {
      id,
      ...evaluation,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
    };
    this._active.set(id, run);
    this._history.record({ type: 'evaluation', id, status: 'pending', tags: evaluation.tags });
    try {
      run.status = 'running';
      run.startedAt = Date.now();
      this._events.emit('evaluation:started', { id, type: evaluation.type });
      const evaluator = this._registry.getEvaluator(evaluation.evaluatorId);
      if (!evaluator) throw new Error(`Evaluator not found: ${evaluation.evaluatorId}`);
      const result = await evaluator.fn(evaluation.input, evaluation.options || {});
      run.status = 'completed';
      run.completedAt = Date.now();
      run.result = result;
      this._storage.set('runs', id, run);
      this._history.record({ type: 'evaluation', id, status: 'completed', tags: evaluation.tags, result });
      this._events.emit('evaluation:completed', { id, result });
      return run;
    } catch (err) {
      run.status = 'failed';
      run.completedAt = Date.now();
      run.error = err.message;
      this._storage.set('runs', id, run);
      this._history.record({ type: 'evaluation', id, status: 'failed', error: err.message, tags: evaluation.tags });
      this._events.emit('evaluation:failed', { id, error: err.message });
      return run;
    } finally {
      this._active.delete(id);
    }
  }

  async runBatch(evaluations) {
    return Promise.all(evaluations.map(e => this.run(e)));
  }

  getRun(id) {
    return this._storage.get('runs', id) || this._active.get(id) || null;
  }

  listRuns(filter = {}) {
    const runs = this._storage.list('runs').map(r => r.value);
    let result = runs;
    if (filter.status) result = result.filter(r => r.status === filter.status);
    if (filter.type) result = result.filter(r => r.type === filter.type);
    if (filter.limit) result = result.slice(-filter.limit);
    return result;
  }

  getActive() {
    return Array.from(this._active.values());
  }

  cancel(id) {
    const run = this._active.get(id);
    if (!run) return false;
    run.status = 'cancelled';
    run.completedAt = Date.now();
    this._storage.set('runs', id, run);
    this._active.delete(id);
    return true;
  }

  clear() {
    this._active.clear();
    this._storage.clearNamespace('runs');
  }
}

module.exports = { EvaluationRunner };
