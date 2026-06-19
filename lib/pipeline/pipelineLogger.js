const fs = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '../../logs/pipeline');

function _ensureDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function _logPath(runId) {
  return path.join(LOG_DIR, `run-${runId}.json`);
}

function logRun(runId, data) {
  _ensureDir();
  fs.writeFileSync(_logPath(runId), JSON.stringify(data, null, 2), 'utf-8');
}

function loadRun(runId) {
  _ensureDir();
  const fp = _logPath(runId);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch { return null; }
}

function listRuns() {
  _ensureDir();
  return fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.json')).map(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(LOG_DIR, f), 'utf-8'));
      return {
        runId: data.runId || f.replace('run-', '').replace('.json', ''),
        status: data.state?.status || 'unknown',
        stages: (data.stages || []).length,
        startedAt: data.state?.startedAt || data.startedAt,
        finishedAt: data.state?.finishedAt || data.finishedAt,
      };
    } catch { return null; }
  }).filter(Boolean);
}

function deleteRun(runId) {
  _ensureDir();
  const fp = _logPath(runId);
  if (fs.existsSync(fp)) { fs.unlinkSync(fp); return { success: true }; }
  return { success: false };
}

module.exports = { logRun, loadRun, listRuns, deleteRun, LOG_DIR };
