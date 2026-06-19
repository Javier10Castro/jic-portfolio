const path = require('path');
const fs = require('fs');

const CHECKPOINT_DIR = path.resolve(__dirname, '../../data/pipelines/checkpoints');

function _ensureDir() {
  if (!fs.existsSync(CHECKPOINT_DIR)) fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
}

function saveCheckpoint(runId, state) {
  _ensureDir();
  fs.writeFileSync(path.join(CHECKPOINT_DIR, `${runId}.json`), JSON.stringify(state, null, 2), 'utf-8');
}

function loadCheckpoint(runId) {
  _ensureDir();
  const fp = path.join(CHECKPOINT_DIR, `${runId}.json`);
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch { return null; }
}

function deleteCheckpoint(runId) {
  _ensureDir();
  const fp = path.join(CHECKPOINT_DIR, `${runId}.json`);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

function computeRetryDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

function shouldRetry(stageResult, maxRetries = 3) {
  if (!stageResult || stageResult.status !== 'failed') return false;
  const attempt = stageResult._retryCount || 0;
  if (attempt >= maxRetries) return false;
  return true;
}

function recoverFromFailure(run, failedStageName) {
  const failedIdx = run.stages.findIndex(s => s.name === failedStageName);
  if (failedIdx === -1) return null;

  for (let i = failedIdx; i < run.stages.length; i++) {
    run.stages[i].status = 'pending';
    run.stages[i].startedAt = null;
    run.stages[i].finishedAt = null;
    run.stages[i].duration = null;
    run.stages[i].output = null;
    run.stages[i].errors = [];
    run.stages[i].warnings = [];
  }

  run.state.status = 'recovered';
  return run;
}

module.exports = { saveCheckpoint, loadCheckpoint, deleteCheckpoint, computeRetryDelay, shouldRetry, recoverFromFailure };
