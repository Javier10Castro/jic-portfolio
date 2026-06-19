const EventEmitter = require('events');

class PipelineEvents extends EventEmitter {
  constructor() {
    super();
    this._eventLog = [];
  }

  _log(type, data) {
    const event = { type, timestamp: new Date().toISOString(), data };
    this._eventLog.push(event);
    this.emit(type, event);
  }

  emitPipelineStarted(runId, data) { this._log('pipeline.started', { runId, ...data }); }
  emitPipelineStageStarted(runId, stage, data) { this._log('pipeline.stage.started', { runId, stage, ...data }); }
  emitPipelineStageCompleted(runId, stage, data) { this._log('pipeline.stage.completed', { runId, stage, ...data }); }
  emitPipelineStageFailed(runId, stage, data) { this._log('pipeline.stage.failed', { runId, stage, ...data }); }
  emitPipelineCompleted(runId, data) { this._log('pipeline.completed', { runId, ...data }); }
  emitPipelineCancelled(runId, data) { this._log('pipeline.cancelled', { runId, ...data }); }
  emitPipelineResumed(runId, data) { this._log('pipeline.resumed', { runId, ...data }); }
  emitPipelineRecovered(runId, data) { this._log('pipeline.recovered', { runId, ...data }); }

  getEventLog() { return [...this._eventLog]; }
  clearEventLog() { this._eventLog = []; }
}

const pipelineEvents = new PipelineEvents();
module.exports = { pipelineEvents, PipelineEvents };
