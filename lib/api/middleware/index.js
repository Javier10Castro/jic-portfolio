const requestId = require('./requestId');
const cors = require('./cors');
const { authenticate } = require('./authentication');
const { authorize, requireRole } = require('./authorization');
const { logger, requestLogger } = require('./logging');
const rateLimiter = require('./rateLimiter');
const { validate } = require('./validation');
const errorHandler = require('./errorHandler');

module.exports = {
  requestId,
  cors,
  authenticate,
  authorize,
  requireRole,
  logger,
  requestLogger,
  rateLimiter,
  validate,
  errorHandler,
};
