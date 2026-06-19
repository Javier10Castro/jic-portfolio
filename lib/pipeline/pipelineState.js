const STATES = {
  QUEUED: 'queued',
  RUNNING: 'running',
  PAUSED: 'paused',
  WAITING_USER: 'waiting_user',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  RECOVERED: 'recovered',
};

const VALID_TRANSITIONS = {
  [STATES.QUEUED]: [STATES.RUNNING, STATES.CANCELLED],
  [STATES.RUNNING]: [STATES.PAUSED, STATES.WAITING_USER, STATES.COMPLETED, STATES.FAILED, STATES.CANCELLED],
  [STATES.PAUSED]: [STATES.RUNNING, STATES.CANCELLED],
  [STATES.WAITING_USER]: [STATES.RUNNING, STATES.CANCELLED],
  [STATES.FAILED]: [STATES.RUNNING, STATES.RECOVERED, STATES.CANCELLED],
  [STATES.RECOVERED]: [STATES.RUNNING, STATES.CANCELLED],
  [STATES.COMPLETED]: [],
  [STATES.CANCELLED]: [],
};

const STAGE_STATES = ['pending', 'running', 'completed', 'failed', 'skipped'];

function createPipelineState() {
  return {
    status: STATES.QUEUED,
    stages: [],
    currentStage: null,
    startedAt: null,
    finishedAt: null,
    error: null,
    checkpoints: [],
  };
}

function transitionTo(state, newStatus) {
  const allowed = VALID_TRANSITIONS[state.status];
  if (!allowed || !allowed.includes(newStatus)) {
    return { success: false, error: `Cannot transition from ${state.status} to ${newStatus}` };
  }
  state.status = newStatus;
  if (newStatus === STATES.RUNNING && !state.startedAt) state.startedAt = new Date().toISOString();
  if ([STATES.COMPLETED, STATES.CANCELLED, STATES.FAILED].includes(newStatus)) state.finishedAt = new Date().toISOString();
  return { success: true };
}

function createStageRecord(stageName) {
  return {
    name: stageName,
    status: 'pending',
    startedAt: null,
    finishedAt: null,
    duration: null,
    input: null,
    output: null,
    warnings: [],
    errors: [],
  };
}

module.exports = { STATES, VALID_TRANSITIONS, STAGE_STATES, createPipelineState, transitionTo, createStageRecord };
