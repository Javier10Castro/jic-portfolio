const { ApiError } = require('../errors');
const { logger } = require('./logging');

function errorHandler(err, req, res, _next) {
  if (err.isApiError) {
    const statusCode = err.statusCode || 500;
    const body = {
      success: false,
      data: null,
      errors: [
        {
          code: err.name,
          message: err.message,
          details: err.details || {},
        },
      ],
      meta: { timestamp: new Date().toISOString() },
      requestId: req.requestId || null,
    };

    if (statusCode >= 500) {
      logger.error({ requestId: req.requestId, error: err.message, stack: err.stack, statusCode });
    } else {
      logger.warn({ requestId: req.requestId, error: err.message, statusCode });
    }

    return res.status(statusCode).json(body);
  }

  logger.error({ requestId: req.requestId, error: err.message, stack: err.stack, statusCode: 500 });

  const body = {
    success: false,
    data: null,
    errors: [
      {
        code: 'InternalServerError',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
        details: process.env.NODE_ENV === 'production' ? {} : { stack: err.stack },
      },
    ],
    meta: { timestamp: new Date().toISOString() },
    requestId: req.requestId || null,
  };

  res.status(500).json(body);
}

module.exports = errorHandler;
