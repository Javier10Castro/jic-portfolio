const ApiError = require('./ApiError');

class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions', details = {}) {
    super(message, 403, details);
  }
}

module.exports = AuthorizationError;
