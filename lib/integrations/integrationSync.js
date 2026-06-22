class IntegrationSync {
  constructor({ storage, events, health }) {
    this._storage = storage;
    this._events = events;
    this._health = health;
    this._syncs = {};
    this._syncIdCounter = 0;
  }

  startSync(provider, type) {
    if (type !== 'incremental' && type !== 'full') {
      return { success: false, error: `Invalid sync type '${type}'` };
    }

    const syncId = `sync_${provider}_${++this._syncIdCounter}_${Date.now()}`;
    this._syncs[syncId] = {
      syncId,
      provider,
      type,
      status: 'running',
      startedAt: Date.now(),
      completedAt: null
    };

    return { success: true, syncId };
  }

  completeSync(syncId, data) {
    const sync = this._syncs[syncId];
    if (!sync) return { success: false, error: 'Sync not found' };

    sync.status = 'completed';
    sync.completedAt = Date.now();
    sync.data = data || {};

    this._events.emit(this._events.constructor.EVENTS.SYNCED, { syncId, provider: sync.provider, type: sync.type, data });

    if (this._health) {
      this._health.recordSuccess(sync.provider, 0);
    }

    return { success: true };
  }

  failSync(syncId, error) {
    const sync = this._syncs[syncId];
    if (!sync) return { success: false, error: 'Sync not found' };

    sync.status = 'failed';
    sync.completedAt = Date.now();
    sync.error = error;

    this._events.emit(this._events.constructor.EVENTS.FAILED, { syncId, provider: sync.provider, error });

    if (this._health) {
      this._health.recordFailure(sync.provider, error);
    }

    return { success: true };
  }

  getSyncs(provider, limit) {
    const providerSyncs = Object.values(this._syncs)
      .filter(s => s.provider === provider)
      .sort((a, b) => b.startedAt - a.startedAt);

    return limit ? providerSyncs.slice(0, limit) : providerSyncs;
  }

  getPending() {
    return Object.values(this._syncs).filter(s => s.status === 'running');
  }

  retry(syncId) {
    const sync = this._syncs[syncId];
    if (!sync) return { success: false, error: 'Sync not found' };
    if (sync.status !== 'failed') return { success: false, error: 'Sync is not in failed state' };

    return this.startSync(sync.provider, sync.type);
  }

  clear() {
    this._syncs = {};
    this._syncIdCounter = 0;
  }
}

module.exports = { IntegrationSync };
