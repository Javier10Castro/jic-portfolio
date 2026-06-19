const ApiError = require('./ApiError');

class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required', details = {}) {
    super(message, 401, details);
  }
}

module.exports = AuthenticationError;
