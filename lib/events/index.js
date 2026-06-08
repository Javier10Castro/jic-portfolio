const crypto = require('crypto');

const VALID_EVENTS = new Set([
  'project.created',
  'pipeline.started',
  'plan.completed',
  'design.completed',
  'preview.generated',
  'scoring.completed',
  'deployment.started',
  'deployment.completed',
  'pipeline.failed',
]);

class RuntimeEventBus {
  constructor() {
    this._listeners = new Map();
    this._globalListeners = [];
    this._history = [];
    this._historyMax = 500;
    this._db = null;
    this._dbReady = false;
    this._initAttempted = false;
  }

  async _ensureTable() {
    if (this._initAttempted) return;
    this._initAttempted = true;
    try {
      this._db = require('../db');
      await this._db.query(`CREATE TABLE IF NOT EXISTS runtime_events (
        id UUID PRIMARY KEY,
        event_type VARCHAR(60) NOT NULL,
        project_id UUID,
        workspace_id UUID,
        execution_id UUID,
        payload JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`);
      await this._db.query(`CREATE INDEX IF NOT EXISTS idx_runtime_events_project ON runtime_events(project_id, created_at DESC)`);
      await this._db.query(`CREATE INDEX IF NOT EXISTS idx_runtime_events_workspace ON runtime_events(workspace_id, created_at DESC)`);
      await this._db.query(`CREATE INDEX IF NOT EXISTS idx_runtime_events_type ON runtime_events(event_type, created_at DESC)`);
      this._dbReady = true;
    } catch {
      this._dbReady = false;
    }
  }

  on(event, callback) {
    if (!VALID_EVENTS.has(event)) throw new Error(`Invalid event type: ${event}`);
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const listeners = this._listeners.get(event);
    if (!listeners) return;
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  }

  onAny(callback) {
    this._globalListeners.push(callback);
    return () => { const i = this._globalListeners.indexOf(callback); if (i !== -1) this._globalListeners.splice(i, 1); };
  }

  onProject(projectId, callback) {
    const wrapped = (event, data) => {
      if (data.project_id === projectId) callback(event, data);
    };
    const unsub = this.onAny(wrapped);
    return unsub;
  }

  onWorkspace(workspaceId, callback) {
    const wrapped = (event, data) => {
      if (data.workspace_id === workspaceId) callback(event, data);
    };
    const unsub = this.onAny(wrapped);
    return unsub;
  }

  async emit(event, data = {}) {
    if (!VALID_EVENTS.has(event)) throw new Error(`Invalid event type: ${event}`);
    const entry = {
      id: crypto.randomUUID(),
      event_type: event,
      project_id: data.project_id || null,
      workspace_id: data.workspace_id || null,
      execution_id: data.execution_id || null,
      payload: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date(),
    };

    this._history.push(entry);
    if (this._history.length > this._historyMax) this._history.shift();

    const callbacks = this._listeners.get(event) || [];
    for (const cb of callbacks) {
      try { cb(entry.payload, event); } catch {}
    }
    for (const cb of this._globalListeners) {
      try { cb(event, entry.payload); } catch {}
    }

    if (!this._initAttempted) await this._ensureTable();
    if (this._dbReady) {
      try {
        await this._db.query(
          `INSERT INTO runtime_events (id, event_type, project_id, workspace_id, execution_id, payload, created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,NOW())`,
          [entry.id, event, data.project_id || null, data.workspace_id || null, data.execution_id || null, JSON.stringify(entry.payload)]
        );
      } catch {}
    }
  }

  async getProjectEvents(projectId, limit = 50) {
    if (!this._dbReady) return this._history.filter(e => e.project_id === projectId).slice(-limit);
    try {
      const r = await this._db.query(`SELECT id, event_type, project_id, workspace_id, execution_id, payload, created_at FROM runtime_events WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2`, [projectId, limit]);
      return r.rows;
    } catch { return this._history.filter(e => e.project_id === projectId).slice(-limit); }
  }

  async getWorkspaceEvents(workspaceId, limit = 50) {
    if (!this._dbReady) return this._history.filter(e => e.workspace_id === workspaceId).slice(-limit);
    try {
      const r = await this._db.query(`SELECT id, event_type, project_id, workspace_id, execution_id, payload, created_at FROM runtime_events WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2`, [workspaceId, limit]);
      return r.rows;
    } catch { return this._history.filter(e => e.workspace_id === workspaceId).slice(-limit); }
  }

  async getEventsAfter(afterTimestamp, projectId, workspaceId, limit = 100) {
    const conditions = ['created_at > $1'];
    const params = [afterTimestamp];
    let idx = 2;
    if (projectId) { conditions.push(`project_id = $${idx}`); params.push(projectId); idx++; }
    if (workspaceId) { conditions.push(`workspace_id = $${idx}`); params.push(workspaceId); idx++; }
    if (!this._dbReady) {
      let filtered = this._history.filter(e => new Date(e.created_at) > new Date(afterTimestamp));
      if (projectId) filtered = filtered.filter(e => e.project_id === projectId);
      if (workspaceId) filtered = filtered.filter(e => e.workspace_id === workspaceId);
      return filtered.slice(-limit);
    }
    try {
      const r = await this._db.query(`SELECT id, event_type, project_id, workspace_id, execution_id, payload, created_at FROM runtime_events WHERE ${conditions.join(' AND ')} ORDER BY created_at ASC LIMIT $${idx}`, [...params, limit]);
      return r.rows;
    } catch { return []; }
  }

  getHistory(eventType) {
    if (eventType) return this._history.filter(e => e.event_type === eventType);
    return [...this._history];
  }

  clear() {
    this._listeners.clear();
    this._globalListeners = [];
    this._history = [];
  }

  listenerCount(event) {
    const l = this._listeners.get(event);
    return (l ? l.length : 0) + this._globalListeners.length;
  }
}

const globalBus = new RuntimeEventBus();
module.exports = globalBus;
module.exports.RuntimeEventBus = RuntimeEventBus;
