class ReleasePipeline {
  constructor() {
    this._pipelines = new Map();
    this._executions = new Map();
    this._executionCounter = 0;
  }

  definePipeline(name, stages) {
    if (!name || !stages || !Array.isArray(stages) || stages.length === 0) {
      throw new Error('Pipeline name and non-empty stages array are required');
    }
    if (this._pipelines.has(name)) {
      throw new Error(`Pipeline "${name}" already exists`);
    }
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      if (!stage.name || !stage.actions || !Array.isArray(stage.actions)) {
        throw new Error(`Stage at index ${i} must have a name and actions array`);
      }
    }
    this._pipelines.set(name, { name, stages: stages.map(s => ({ ...s })) });
    return this._pipelines.get(name);
  }

  getPipeline(name) {
    return this._pipelines.get(name) || null;
  }

  listPipelines() {
    return Array.from(this._pipelines.values());
  }

  executePipeline(name, context) {
    const pipeline = this._pipelines.get(name);
    if (!pipeline) {
      throw new Error(`Pipeline "${name}" not found`);
    }
    const executionId = `exec_${++this._executionCounter}`;
    const stageResults = [];
    let overallStatus = 'completed';

    for (const stage of pipeline.stages) {
      const stageResult = {
        stageName: stage.name,
        status: 'pending',
        executedAt: null,
        error: null
      };
      try {
        for (const action of stage.actions) {
          if (typeof action === 'function') {
            action(context);
          }
        }
        stageResult.status = 'passed';
        stageResult.executedAt = new Date().toISOString();
      } catch (err) {
        stageResult.status = 'failed';
        stageResult.executedAt = new Date().toISOString();
        stageResult.error = err.message;
        if (stage.required !== false) {
          overallStatus = 'failed';
          break;
        }
      }
      stageResults.push(stageResult);
    }

    const execution = {
      pipeline: name,
      status: overallStatus,
      stageResults,
      completedAt: new Date().toISOString()
    };
    this._executions.set(executionId, execution);
    return { ...execution, executionId };
  }

  getPipelineStatus(executionId) {
    return this._executions.get(executionId) || null;
  }

  clear() {
    this._pipelines.clear();
    this._executions.clear();
  }
}

module.exports = { ReleasePipeline };
