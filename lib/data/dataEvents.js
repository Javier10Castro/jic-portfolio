const EVENTS = {
  CONNECTED: 'data.connected', DISCONNECTED: 'data.disconnected',
  QUERY_EXECUTED: 'data.query.executed', MIGRATION_RUN: 'data.migration.run',
  BACKUP_CREATED: 'data.backup.created', RESTORE_COMPLETED: 'data.restore.completed',
  REPLICATION_SYNCED: 'data.replication.synced', HEALTH_CHANGED: 'data.health.changed',
  BACKUP_DELETED: 'data.backup.deleted', SCHEMA_CHANGED: 'data.schema.changed'
};

class DataEvents {
  constructor() { this._listeners = {}; this._history = []; }
  on(event, handler) { if (!this._listeners[event]) this._listeners[event] = []; this._listeners[event].push(handler); }
  off(event, handler) { if (!this._listeners[event]) return; this._listeners[event] = this._listeners[event].filter(h => h !== handler); }
  emit(event, data) {
    const entry = { event, data, timestamp: Date.now() };
    this._history.push(entry);
    (this._listeners[event] || []).forEach(h => { try { h(entry); } catch (e) {} });
    (this._listeners['*'] || []).forEach(h => { try { h(entry); } catch (e) {} });
    return entry;
  }
  history(event) { if (!event) return [...this._history]; return this._history.filter(h => h.event === event); }
  clear() { this._history = []; this._listeners = {}; }
}
module.exports = { DataEvents, EVENTS };
