const { success } = require('../responses');

const START_TIME = Date.now();

function health(req, res) {
  return success(res, {
    status: 'ok',
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}

function ready(req, res) {
  return success(res, {
    status: 'ready',
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    database: 'available',
    timestamp: new Date().toISOString(),
  });
}

function live(req, res) {
  return res.status(200).json({ status: 'alive' });
}

function metrics(req, res) {
  return success(res, {
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
  });
}

module.exports = { health, ready, live, metrics };
