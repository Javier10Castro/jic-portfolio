const ApiError = require('./ApiError');

class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details = {}) {
    super(message, 400, details);
  }
}

module.exports = ValidationError;
