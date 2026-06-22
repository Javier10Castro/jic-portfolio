class WorkflowComposer {
  constructor() {
    this._compositions = new Map();
    this._counter = 0;
  }

  compose(appId, workflows) {
    if (!appId || !Array.isArray(workflows)) {
      return { composed: false, count: 0 };
    }
    const items = workflows.map((w) => ({
      ...w,
      _id: w.id || `wf_${++this._counter}`,
    }));
    const existing = this._compositions.get(appId) || [];
    this._compositions.set(appId, [...existing, ...items]);
    return { composed: true, count: items.length };
  }

  getComposed(appId) {
    if (!appId) return null;
    return this._compositions.get(appId) || null;
  }

  addWorkflow(appId, workflow) {
    if (!appId || !workflow) return null;
    const item = { ...workflow, _id: workflow.id || `wf_${++this._counter}` };
    const existing = this._compositions.get(appId) || [];
    existing.push(item);
    this._compositions.set(appId, existing);
    return item;
  }

  removeWorkflow(appId, workflowId) {
    if (!appId || !workflowId) return false;
    const existing = this._compositions.get(appId);
    if (!existing) return false;
    const filtered = existing.filter((w) => w._id !== workflowId);
    if (filtered.length === existing.length) return false;
    this._compositions.set(appId, filtered);
    return true;
  }

  clear() {
    this._compositions.clear();
    this._counter = 0;
  }
}

module.exports = { WorkflowComposer };
