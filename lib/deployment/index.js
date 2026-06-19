const manager = require('./deploymentManager');

module.exports = {
  deploy: manager.deploy,
  status: manager.status,
  getHistory: manager.getHistory,
  latest: manager.latest,
  rollbackTo: manager.rollbackTo,
};
