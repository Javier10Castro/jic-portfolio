const fs = require('fs');
const path = require('path');
const history = require('./deploymentHistory');

const ROLLBACK_STORAGE = path.resolve(__dirname, '../../data/rollbacks.json');

function _ensureStorage() {
  const dir = path.dirname(ROLLBACK_STORAGE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(ROLLBACK_STORAGE)) fs.writeFileSync(ROLLBACK_STORAGE, '[]', 'utf-8');
}

function _readRollbacks() {
  _ensureStorage();
  try { return JSON.parse(fs.readFileSync(ROLLBACK_STORAGE, 'utf-8')); } catch { return []; }
}

function _writeRollbacks(list) {
  _ensureStorage();
  fs.writeFileSync(ROLLBACK_STORAGE, JSON.stringify(list, null, 2), 'utf-8');
}

function rollback(targetVersion, { provider, projectName } = {}) {
  const deployments = history.findByVersion(targetVersion);
  if (deployments.length === 0) {
    return { success: false, error: `No deployments found for version "${targetVersion}"` };
  }

  const target = deployments[deployments.length - 1];
  const rollbackId = `rollback-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const entry = {
    rollbackId,
    deploymentId: target.deploymentId,
    targetVersion,
    provider: provider || target.provider || 'unknown',
    projectName: projectName || target.projectName || target.project_name || 'unknown',
    previousStatus: target.status,
    status: 'rolled_back',
    rolledBackAt: now,
  };

  const list = _readRollbacks();
  list.push(entry);
  _writeRollbacks(list);

  history.updateStatus(target.deploymentId, 'rolled_back');

  return {
    success: true,
    rollbackId,
    targetVersion,
    deployedAt: target.timestamp,
    rolledBackAt: now,
    status: 'rolled_back',
    message: `Rolled back to version ${targetVersion} (${target.deploymentId})`,
    entry,
  };
}

function getRollbackHistory() {
  return _readRollbacks().sort((a, b) => new Date(b.rolledBackAt) - new Date(a.rolledBackAt));
}

function latestRollback() {
  const list = _readRollbacks();
  if (list.length === 0) return null;
  return list.sort((a, b) => new Date(b.rolledBackAt) - new Date(a.rolledBackAt))[0];
}

module.exports = { rollback, getRollbackHistory, latestRollback };
