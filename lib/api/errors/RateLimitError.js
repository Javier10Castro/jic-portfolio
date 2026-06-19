const ApiError = require('./ApiError');

class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded', details = {}) {
    super(message, 429, details);
  }
}

module.exports = RateLimitError;
