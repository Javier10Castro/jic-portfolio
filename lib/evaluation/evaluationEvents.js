const EVENTS = {
  EVALUATION_STARTED: 'evaluation:started',
  EVALUATION_COMPLETED: 'evaluation:completed',
  EVALUATION_FAILED: 'evaluation:failed',
  BENCHMARK_STARTED: 'benchmark:started',
  BENCHMARK_COMPLETED: 'benchmark:completed',
  EXPERIMENT_STARTED: 'experiment:started',
  EXPERIMENT_COMPLETED: 'experiment:completed',
  PROMPT_CREATED: 'prompt:created',
  PROMPT_VERSIONED: 'prompt:versioned',
  DATASET_IMPORTED: 'dataset:imported',
  FEEDBACK_RECEIVED: 'feedback:received',
  RECOMMENDATION_GENERATED: 'recommendation:generated',
  JUDGE_EVALUATED: 'judge:evaluated',
  SCORE_UPDATED: 'score:updated',
};

class EvaluationEvents {
  constructor() {
    this._listeners = new Map();
    this._history = [];
    this._maxHistory = 1000;
  }

  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (!this._listeners.has(event)) return;
    this._listeners.get(event).delete(handler);
  }

  emit(event, data) {
    const entry = { event, data, timestamp: Date.now() };
    this._history.push(entry);
    if (this._history.length > this._maxHistory) this._history.shift();
    if (this._listeners.has(event)) {
      for (const handler of this._listeners.get(event)) {
        try { handler(entry); } catch {}
      }
    }
    if (this._listeners.has('*')) {
      for (const handler of this._listeners.get('*')) {
        try { handler(entry); } catch {}
      }
    }
  }

  history(filter) {
    let result = this._history;
    if (filter) {
      if (filter.event) result = result.filter(e => e.event === filter.event);
      if (filter.since) result = result.filter(e => e.timestamp >= filter.since);
      if (filter.until) result = result.filter(e => e.timestamp <= filter.until);
    }
    return result;
  }

  clear() {
    this._history = [];
    this._listeners.clear();
  }
}

module.exports = { EvaluationEvents, EVENTS };
