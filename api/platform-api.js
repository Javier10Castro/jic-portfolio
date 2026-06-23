const { createApp } = require('../lib/api/server');

const app = createApp();

// Strip Vercel function prefix if present so Express internal routing
// (/api/v1/*) matches correctly regardless of the Vercel function's URL path.
// Vercel maps api/platform-api.js → /api/platform-api, but rewrites may
// deliver the original path directly. This middleware normalizes either case.
app.use((req, res, next) => {
  if (req.url.startsWith('/api/platform-api')) {
    req.url = req.url.replace('/api/platform-api', '');
  }
  next();
});

// Debug: log every request at startup and the first few
let reqCount = 0;
const MAX_LOG = 5;
app.use((req, res, next) => {
  if (reqCount < MAX_LOG) {
    console.log(`[API] ${req.method} ${req.url} -> prefix=${app.mountpath || '/'}`);
    reqCount++;
  }
  next();
});

const BASE_PATH = '/api/v1';
const routeTable = [];
function captureRoute(method, path) {
  routeTable.push(`${method} ${BASE_PATH}${path}`);
}
// Monkey-patch router.get/post to capture routes for debug logging
const origUse = app._router ? app._router.use.bind(app._router) : null;
process.nextTick(() => {
  // Walk the internal router stack to list registered routes
  if (app._router && app._router.stack) {
    app._router.stack.forEach((mw) => {
      if (mw.route) {
        const methods = Object.keys(mw.route.methods).join(',').toUpperCase();
        routeTable.push(`${methods} ${mw.route.path}`);
      } else if (mw.handle && mw.handle.stack) {
        mw.handle.stack.forEach((layer) => {
          if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            routeTable.push(`${methods} ${BASE_PATH}${layer.route.path}`);
          } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            const prefix = layer.regexp ? layer.regexp.toString() : '/';
            layer.handle.stack.forEach((sub) => {
              if (sub.route) {
                const methods = Object.keys(sub.route.methods).join(',').toUpperCase();
                routeTable.push(`${methods} ${BASE_PATH}${sub.route.path}`);
              }
            });
          }
        });
      }
    });
  }
  console.log(`[API] ${routeTable.length} routes registered`);
  routeTable.forEach(r => console.log(`[API]   ${r}`));
});

module.exports = app;
