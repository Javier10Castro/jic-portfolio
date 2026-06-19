class ContextValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ContextValidationError';
    this.details = details;
  }
}

module.exports = { ContextValidationError };
