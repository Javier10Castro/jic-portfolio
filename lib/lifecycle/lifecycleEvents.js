class LifecycleEvents {
  static EVENTS = {
    PROJECT_CREATED: 'project_created',
    PROJECT_CLONED: 'project_cloned',
    PROJECT_DELETED: 'project_deleted',
    RELEASE_CREATED: 'release_created',
    RELEASE_PROMOTED: 'release_promoted',
    PROMOTION_APPROVED: 'promotion_approved',
    PROMOTION_REJECTED: 'promotion_rejected',
    SNAPSHOT_CREATED: 'snapshot_created',
    SNAPSHOT_RESTORED: 'snapshot_restored',
    MIGRATION_EXECUTED: 'migration_executed',
    MIGRATION_ROLLED_BACK: 'migration_rolled_back',
    ENVIRONMENT_CREATED: 'environment_created',
    ENVIRONMENT_DELETED: 'environment_deleted',
    IMPORT_COMPLETED: 'import_completed',
    EXPORT_COMPLETED: 'export_completed',
    TEMPLATE_APPLIED: 'template_applied'
  };

  constructor() {
    this._handlers = new Map();
  }

  on(event, handler) {
    if (!event || typeof handler !== 'function') {
      throw new Error('Event name and handler function are required');
    }
    if (!this._handlers.has(event)) {
      this._handlers.set(event, []);
    }
    this._handlers.get(event).push(handler);
  }

  off(event, handler) {
    if (!this._handlers.has(event)) return;
    const handlers = this._handlers.get(event);
    const idx = handlers.indexOf(handler);
    if (idx !== -1) {
      handlers.splice(idx, 1);
    }
    if (handlers.length === 0) {
      this._handlers.delete(event);
    }
  }

  emit(event, data) {
    if (!this._handlers.has(event)) return;
    const handlers = this._handlers.get(event);
    for (const handler of handlers) {
      handler(data);
    }
  }

  listEvents() {
    return Array.from(this._handlers.keys());
  }

  clear() {
    this._handlers.clear();
  }
}

module.exports = { LifecycleEvents };
