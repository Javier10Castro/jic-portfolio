const { ClusterEvents, EVENT_TYPES } = require('./clusterEvents');

class HeartbeatMonitor {
  constructor(options = {}) {
    this._interval = options.interval || 5000;
    this._timeout = options.timeout || 15000;
    this._staleThreshold = options.staleThreshold || 30000;
    this._events = options.eventBus || new ClusterEvents();
    this._timer = null;
    this._running = false;
    this._onWorkerOffline = options.onWorkerOffline || null;
    this._onWorkerStale = options.onWorkerStale || null;
    this._receiveWorker = null;
  }

  setReceiveWorker(fn) {
    this._receiveWorker = fn;
  }

  receiveHeartbeat(workerId, data = {}) {
    const now = Date.now();
    this._events.emit('cluster.heartbeat', { workerId, timestamp: now, data });
  }

  start(getWorkersFn) {
    if (this._running) return;
    this._running = true;
    this._getWorkers = getWorkersFn;

    this._timer = setInterval(async () => {
      await this._check();
    }, this._interval);
  }

  stop() {
    this._running = false;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  isRunning() {
    return this._running;
  }

  async _check() {
    if (!this._getWorkers) return;
    try {
      const workers = await this._getWorkers();
      const now = Date.now();

      for (const w of workers) {
        const elapsed = now - (w.lastHeartbeat || 0);

        if (elapsed > this._staleThreshold && (w.status !== 'offline' && w.status !== 'stale')) {
          w.markStale();
          if (this._receiveWorker) await this._receiveWorker(w.id, { status: 'stale' });
          this._events.emit('cluster.worker.left', {
            workerId: w.id,
            reason: 'stale',
            elapsed,
            threshold: this._staleThreshold,
          });
          if (this._onWorkerStale) this._onWorkerStale(w);
        } else if (elapsed > this._timeout && (w.status !== 'offline' && w.status !== 'stale')) {
          w.markOffline();
          if (this._receiveWorker) await this._receiveWorker(w.id, { status: 'offline' });
          this._events.emit('cluster.worker.left', {
            workerId: w.id,
            reason: 'timeout',
            elapsed,
            timeout: this._timeout,
          });
          if (this._onWorkerOffline) this._onWorkerOffline(w);
        }
      }
    } catch (e) {
    }
  }

  getStatus() {
    return {
      running: this._running,
      interval: this._interval,
      timeout: this._timeout,
      staleThreshold: this._staleThreshold,
    };
  }
}

module.exports = HeartbeatMonitor;
