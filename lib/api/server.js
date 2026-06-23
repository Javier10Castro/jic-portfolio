const express = require('express');
const { buildRouter } = require('./router');
const { requestId, cors, requestLogger, rateLimiter, authenticate } = require('./middleware');

const DEFAULT_PORT = process.env.API_PORT || 3001;
const API_PREFIX = '/api/v1';

function createApp(options = {}) {
  const app = express();

  app.use(cors(options.cors));
  app.use(requestId);
  app.use(requestLogger);
  app.use(express.json({ limit: options.bodyLimit || '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(rateLimiter(options.rateLimit));

  const apiRouter = buildRouter();
  app.use(API_PREFIX, apiRouter);

  app.get('/', (req, res) => {
    res.json({
      service: 'Platform API',
      version: '1.0.0',
      docs: '/api/docs',
      endpoints: `${API_PREFIX}/health`,
    });
  });

  app.set('etag', false);

  // Debug: log route table at startup
  process.nextTick(() => {
    const routes = [];
    if (app._router && app._router.stack) {
      app._router.stack.forEach((mw) => {
        if (mw.route) {
          const m = Object.keys(mw.route.methods).join(',').toUpperCase();
          routes.push(`${m} ${mw.route.path}`);
        } else if (mw.handle && mw.handle.stack) {
          mw.handle.stack.forEach((layer) => {
            if (layer.route) {
              const m = Object.keys(layer.route.methods).join(',').toUpperCase();
              routes.push(`${m} ${API_PREFIX}${layer.route.path}`);
            } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
              layer.handle.stack.forEach((sub) => {
                if (sub.route) {
                  const m = Object.keys(sub.route.methods).join(',').toUpperCase();
                  routes.push(`${m} ${API_PREFIX}${sub.route.path}`);
                }
              });
            }
          });
        }
      });
    }
    console.log(`[API] ${routes.length} routes (prefix=${API_PREFIX})`);
    routes.slice(0, 15).forEach(r => console.log(`[API]   ${r}`));
    if (routes.length > 15) console.log(`[API]   ... and ${routes.length - 15} more`);
  });

  return app;
}

function startServer(port = DEFAULT_PORT) {
  const app = createApp();
  return app.listen(port, () => {
    console.log(`[API] Platform API running on http://localhost:${port}${API_PREFIX}`);
    console.log(`[API] Health: http://localhost:${port}${API_PREFIX}/health`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
