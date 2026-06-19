class WorkflowStorage {
  constructor() {
    this._workflows = new Map();
    this._events = new Map();
    this._checkpoints = new Map();
  }

  async save(workflow) {
    this._workflows.set(workflow.id, JSON.parse(JSON.stringify(workflow)));
    return true;
  }

  async get(id) {
    const data = this._workflows.get(id);
    return data ? JSON.parse(JSON.stringify(data)) : null;
  }

  async delete(id) {
    this._workflows.delete(id);
    this._checkpoints.delete(id);
    this._events.delete(id);
    return true;
  }

  async list(filter = {}) {
    let list = Array.from(this._workflows.values());
    if (filter.status) list = list.filter(w => w.status === filter.status);
    if (filter.workflowType) list = list.filter(w => w.type === filter.workflowType);
    if (filter.since) list = list.filter(w => (w.createdAt || 0) >= filter.since);
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  }

  async saveEvents(workflowId, events) {
    const existing = this._events.get(workflowId) || [];
    existing.push(...events);
    this._events.set(workflowId, existing);
    return true;
  }

  async getEvents(workflowId) {
    return [...(this._events.get(workflowId) || [])];
  }

  async saveCheckpoint(workflowId, checkpoint) {
    const existing = this._checkpoints.get(workflowId) || [];
    existing.push(checkpoint);
    this._checkpoints.set(workflowId, existing);
    return true;
  }

  async getCheckpoints(workflowId) {
    return [...(this._checkpoints.get(workflowId) || [])];
  }

  async deleteCheckpoints(workflowId) {
    this._checkpoints.delete(workflowId);
    return true;
  }

  async count(filter = {}) {
    const list = await this.list(filter);
    return list.length;
  }
}

module.exports = WorkflowStorage;
