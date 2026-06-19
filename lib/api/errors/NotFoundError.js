const ApiError = require('./ApiError');

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', details = {}) {
    super(message, 404, details);
  }
}

module.exports = NotFoundError;
