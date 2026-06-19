class PipelineError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'PipelineError';
    this.details = details;
  }
}

module.exports = { PipelineError };
