import ExperimentStorage from './experimentStorage.js';
import ExperimentMetrics from './experimentMetrics.js';

let _runIdCounter = 0;

class ExperimentRunner {
  constructor(storage, metrics) {
    this._storage = storage || new ExperimentStorage();
    this._metrics = metrics || new ExperimentMetrics();
    this._runFunction = null;
  }

  setRunFunction(fn) {
    this._runFunction = fn;
  }

  async runVariant(experimentId, variantName, input) {
    const experiment = this._storage.getExperiment(experimentId);
    if (!experiment) throw new Error(`Experiment ${experimentId} not found`);
    const variant = experiment.variants.find(v => v.name === variantName);
    if (!variant) throw new Error(`Variant ${variantName} not found in experiment ${experimentId}`);

    const start = Date.now();
    let output;
    if (this._runFunction) {
      output = await this._runFunction(variant.config, input);
    } else {
      output = { result: `processed by ${variantName}`, input };
    }
    const latency = Date.now() - start;
    const cost = typeof output?.cost === 'number' ? output.cost : 0;

    const runId = `run_${++_runIdCounter}_${Date.now()}`;
    const result = {
      runId,
      experimentId,
      variant: variantName,
      input,
      output,
      latency,
      cost,
      timestamp: new Date()
    };

    this._storage.saveResult(runId, result);
    return result;
  }

  async runExperiment(experimentId, inputs) {
    const experiment = this._storage.getExperiment(experimentId);
    if (!experiment) throw new Error(`Experiment ${experimentId} not found`);

    const results = [];
    for (const variant of experiment.variants) {
      for (const input of inputs) {
        const result = await this.runVariant(experimentId, variant.name, input);
        results.push(result);
      }
    }
    return results;
  }

  getRun(runId) {
    return this._storage._results.get(runId) || null;
  }

  getVariantResults(experimentId, variantName) {
    return this._storage.getVariantData(experimentId, variantName);
  }

  clear() {
    this._storage.clear();
    this._metrics.clear();
  }
}

export default ExperimentRunner;
export { ExperimentRunner };
