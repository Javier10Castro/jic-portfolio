class EventReplayEngine {
  constructor(store, eventBus) {
    this._store = store;
    this._eventBus = eventBus;
    this._snapshots = new Map();
    this._replaysInProgress = new Set();
  }

  async replayByFilter(filter, options = {}) {
    const replayId = 'replay-' + Math.random().toString(36).substring(2, 10);
    this._replaysInProgress.add(replayId);
    const events = await this._store.query(filter);
    const replayEvents = [];
    for (const event of events) {
      if (options.dryRun) {
        replayEvents.push({ event, replayed: false, dryRun: true });
      } else {
        if (this._eventBus) {
          await this._eventBus.emit(event.type, event.payload, {
            source: 'replay',
            correlationId: event.correlationId,
            metadata: { ...event.metadata, replayId, originalTimestamp: event.timestamp, replay: true },
          });
        }
        replayEvents.push({ event, replayed: true });
      }
    }
    this._replaysInProgress.delete(replayId);
    return { replayId, total: events.length, replayed: replayEvents.length, events: replayEvents };
  }

  async replayByCorrelationId(correlationId, options = {}) {
    return this.replayByFilter({ correlationId }, options);
  }

  async replayByType(type, options = {}) {
    return this.replayByFilter({ type }, options);
  }

  async replayByTimeRange(since, until, options = {}) {
    return this.replayByFilter({ since, until, sort: 'asc' }, options);
  }

  async snapshotState(snapshotId, filter) {
    const events = await this._store.query(filter);
    const state = this._buildState(events);
    this._snapshots.set(snapshotId, { events, state, timestamp: Date.now() });
    return snapshotId;
  }

  async restoreFromSnapshot(snapshotId) {
    const snapshot = this._snapshots.get(snapshotId);
    if (!snapshot) throw new Error(`Snapshot ${snapshotId} not found`);
    return snapshot.state;
  }

  async timeTravel(since, until, callback) {
    const events = await this._store.query({ since, until, sort: 'asc' });
    const state = {};
    for (const event of events) {
      this._applyEvent(state, event);
      if (callback) callback(event, { ...state });
    }
    return state;
  }

  _buildState(events) {
    const state = {};
    for (const event of events) this._applyEvent(state, event);
    return state;
  }

  _applyEvent(state, event) {
    const { type, payload } = event;
    if (!state[type]) state[type] = [];
    state[type].push(payload);
    if (type === 'workflow.completed' || type === 'api.request') {
      state.lastCompleted = payload;
    }
    if (payload.workflowId) {
      if (!state.workflows) state.workflows = {};
      state.workflows[payload.workflowId] = state.workflows[payload.workflowId] || {};
      Object.assign(state.workflows[payload.workflowId], payload);
    }
    if (payload.agentId) {
      if (!state.agents) state.agents = {};
      state.agents[payload.agentId] = state.agents[payload.agentId] || {};
      Object.assign(state.agents[payload.agentId], payload);
    }
    return state;
  }

  getActiveReplays() {
    return Array.from(this._replaysInProgress);
  }

  listSnapshots() {
    const result = [];
    for (const [id, snap] of this._snapshots) {
      result.push({ id, eventCount: snap.events.length, timestamp: snap.timestamp });
    }
    return result;
  }
}

module.exports = EventReplayEngine;
