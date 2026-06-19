const { ClusterEvents, EVENT_TYPES } = require('./clusterEvents');

class LeaderElection {
  constructor(options = {}) {
    this._nodeId = options.nodeId || 'coordinator-' + Math.random().toString(36).substring(2, 8);
    this._heartbeatInterval = options.heartbeatInterval || 3000;
    this._electionTimeout = options.electionTimeout || 10000;
    this._events = options.eventBus || new ClusterEvents();
    this._storage = options.storage || null;

    this._isLeader = false;
    this._leaderId = null;
    this._leaderSince = null;
    this._lastLeaderHeartbeat = 0;
    this._term = 0;
    this._votes = new Set();
    this._timer = null;
    this._running = false;

    this._onBecomeLeader = options.onBecomeLeader || null;
    this._onLeaderChange = options.onLeaderChange || null;
  }

  start(candidatePool) {
    if (this._running) return;
    this._running = true;
    this._candidatePool = candidatePool || (() => [this._nodeId]);

    if (!this._leaderId) {
      this._holdElection();
    }

    this._timer = setInterval(async () => {
      if (this._isLeader) {
        await this._sendHeartbeat();
      } else {
        await this._checkLeaderHealth();
      }
    }, this._heartbeatInterval);
  }

  stop() {
    this._running = false;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    if (this._isLeader) {
      this._resign();
    }
  }

  isLeader() {
    return this._isLeader;
  }

  getLeaderId() {
    return this._leaderId;
  }

  getTerm() {
    return this._term;
  }

  getStatus() {
    return {
      isLeader: this._isLeader,
      leaderId: this._leaderId,
      term: this._term,
      nodeId: this._nodeId,
      leaderSince: this._leaderSince,
      running: this._running,
    };
  }

  receiveHeartbeat(leaderId, term) {
    if (term >= this._term && leaderId !== this._nodeId) {
      this._leaderId = leaderId;
      this._term = term;
      this._lastLeaderHeartbeat = Date.now();
      if (this._isLeader) {
        this._isLeader = false;
        this._leaderSince = null;
        if (this._onLeaderChange) this._onLeaderChange(null, leaderId);
      }
    }
  }

  async _holdElection() {
    this._term++;
    this._votes = new Set();
    this._votes.add(this._nodeId);

    const candidates = typeof this._candidatePool === 'function'
      ? await this._candidatePool()
      : this._candidatePool;

    const eligible = candidates.filter(id => id !== this._nodeId);

    for (const candidate of eligible) {
      this._votes.add(candidate);
    }

    const majority = Math.floor((eligible.length + 1) / 2) + 1;

    if (this._votes.size >= majority) {
      this._becomeLeader();
    }
  }

  _becomeLeader() {
    this._isLeader = true;
    this._leaderId = this._nodeId;
    this._leaderSince = Date.now();
    this._lastLeaderHeartbeat = Date.now();

    this._events.emit('cluster.leader.changed', {
      leaderId: this._nodeId,
      term: this._term,
      timestamp: this._leaderSince,
    });

    if (this._storage) {
      this._storage.storeLeader({
        leaderId: this._nodeId,
        term: this._term,
        since: this._leaderSince,
      });
    }

    if (this._onBecomeLeader) this._onBecomeLeader(this._nodeId, this._term);
    if (this._onLeaderChange) this._onLeaderChange(this._nodeId, null);
  }

  async _sendHeartbeat() {
    this._lastLeaderHeartbeat = Date.now();
  }

  async _checkLeaderHealth() {
    if (!this._leaderId) {
      await this._holdElection();
      return;
    }

    const elapsed = Date.now() - this._lastLeaderHeartbeat;
    if (elapsed > this._electionTimeout) {
      this._leaderId = null;
      this._events.emit('cluster.failover', {
        previousLeader: this._leaderId,
        term: this._term,
        reason: 'heartbeat timeout',
        elapsed,
      });
      await this._holdElection();
    }
  }

  _resign() {
    this._isLeader = false;
    this._leaderId = null;
    this._leaderSince = null;
    this._events.emit('cluster.leader.changed', {
      leaderId: null,
      term: this._term,
      reason: 'resign',
    });
  }
}

module.exports = LeaderElection;
