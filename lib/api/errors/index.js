const ApiError = require('./ApiError');
const AuthenticationError = require('./AuthenticationError');
const AuthorizationError = require('./AuthorizationError');
const ValidationError = require('./ValidationError');
const RateLimitError = require('./RateLimitError');
const NotFoundError = require('./NotFoundError');

module.exports = {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  RateLimitError,
  NotFoundError,
};
