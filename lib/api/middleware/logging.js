const logger = {
  info(entry) { console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), ...entry })); },
  warn(entry) { console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), ...entry })); },
  error(entry) { console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), ...entry })); },
  debug(entry) { if (process.env.NODE_ENV !== 'production') console.log(JSON.stringify({ level: 'debug', timestamp: new Date().toISOString(), ...entry })); },
};

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - start;
    const entry = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      latency: `${latency}ms`,
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
      workspace: req.workspace ? req.workspace.id : null,
      authMethod: req.authMethod || null,
      ip: req.ip || req.connection?.remoteAddress,
    };
    if (res.statusCode >= 500) {
      logger.error(entry);
    } else if (res.statusCode >= 400) {
      logger.warn(entry);
    } else {
      logger.info(entry);
    }
  });

  next();
}

module.exports = { logger, requestLogger };
