const intentRouter = require('./intentRouter');
const costOptimizer = require('./costOptimizer');
const latencyOptimizer = require('./latencyOptimizer');
const qualityRouter = require('./qualityRouter');

module.exports = { ...intentRouter, ...costOptimizer, ...latencyOptimizer, ...qualityRouter };
