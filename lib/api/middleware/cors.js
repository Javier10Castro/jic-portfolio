function cors(options = {}) {
  const allowedOrigins = options.allowedOrigins || ['*'];
  const allowedMethods = options.allowedMethods || 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
  const allowedHeaders = options.allowedHeaders || 'Content-Type,Authorization,X-API-Key,X-Request-Id';

  return function corsMiddleware(req, res, next) {
    const origin = req.headers.origin;
    if (allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', allowedMethods);
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders);
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

module.exports = cors;
