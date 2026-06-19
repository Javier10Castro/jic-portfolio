const STATES = {
  CREATED: 'CREATED',
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  PAUSED: 'PAUSED',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ROLLED_BACK: 'ROLLED_BACK',
};

const TRANSITIONS = {
  [STATES.CREATED]: [STATES.QUEUED, STATES.CANCELLED],
  [STATES.QUEUED]: [STATES.RUNNING, STATES.CANCELLED, STATES.FAILED],
  [STATES.RUNNING]: [STATES.WAITING, STATES.PAUSED, STATES.FAILED, STATES.COMPLETED, STATES.CANCELLED, STATES.RETRYING],
  [STATES.WAITING]: [STATES.RUNNING, STATES.FAILED, STATES.CANCELLED],
  [STATES.PAUSED]: [STATES.RUNNING, STATES.CANCELLED, STATES.FAILED],
  [STATES.FAILED]: [STATES.RETRYING, STATES.ROLLED_BACK, STATES.CANCELLED],
  [STATES.RETRYING]: [STATES.RUNNING, STATES.FAILED, STATES.CANCELLED],
  [STATES.COMPLETED]: [STATES.ROLLED_BACK],
  [STATES.CANCELLED]: [],
  [STATES.ROLLED_BACK]: [],
};

const TERMINAL = [STATES.COMPLETED, STATES.CANCELLED, STATES.ROLLED_BACK];

class WorkflowStateMachine {
  constructor(initialState = STATES.CREATED) {
    this._state = initialState;
    this._history = [{ from: null, to: initialState, timestamp: Date.now() }];
  }

  get state() {
    return this._state;
  }

  canTransition(targetState) {
    const allowed = TRANSITIONS[this._state];
    return allowed ? allowed.includes(targetState) : false;
  }

  transition(targetState) {
    if (!this.canTransition(targetState)) {
      throw new Error(`Invalid transition: ${this._state} → ${targetState}`);
    }
    const from = this._state;
    this._state = targetState;
    const entry = { from, to: targetState, timestamp: Date.now() };
    this._history.push(entry);
    return entry;
  }

  isTerminal() {
    return TERMINAL.includes(this._state);
  }

  isRunning() {
    return this._state === STATES.RUNNING;
  }

  canResume() {
    return this._state === STATES.PAUSED || this._state === STATES.WAITING;
  }

  getHistory() {
    return [...this._history];
  }

  get elapsed() {
    if (this._history.length < 2) return 0;
    const first = this._history[0];
    const last = this._history[this._history.length - 1];
    return last.timestamp - first.timestamp;
  }
}

module.exports = { WorkflowStateMachine, STATES, TRANSITIONS, TERMINAL };
