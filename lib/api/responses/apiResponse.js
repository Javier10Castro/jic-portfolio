function success(res, data = null, meta = {}, statusCode = 200) {
  const body = {
    success: true,
    data,
    errors: null,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
    requestId: res.requestId || null,
  };
  return res.status(statusCode).json(body);
}

function created(res, data = null, meta = {}) {
  return success(res, data, meta, 201);
}

function noContent(res) {
  return res.status(204).send();
}

function error(res, apiError, meta = {}) {
  const statusCode = apiError.statusCode || 500;
  const body = {
    success: false,
    data: null,
    errors: [
      {
        code: apiError.name || 'ApiError',
        message: apiError.message,
        details: apiError.details || {},
      },
    ],
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
    requestId: res.requestId || null,
  };
  return res.status(statusCode).json(body);
}

module.exports = { success, created, noContent, error };
