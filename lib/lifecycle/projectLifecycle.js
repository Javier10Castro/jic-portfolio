class ProjectLifecycle {
  constructor() {
    this._lifecycles = new Map();
  }

  createProjectLifecycle(projectId, initialState) {
    if (!projectId) throw new Error('Project ID is required');
    if (this._lifecycles.has(projectId)) {
      throw new Error(`Lifecycle already exists for project "${projectId}"`);
    }
    const state = initialState || 'created';
    const lifecycle = {
      projectId,
      state,
      transitions: [],
      createdAt: new Date().toISOString()
    };
    this._lifecycles.set(projectId, lifecycle);
    return lifecycle;
  }

  transition(projectId, newState) {
    if (!this._lifecycles.has(projectId)) {
      throw new Error(`Lifecycle not found for project "${projectId}"`);
    }
    if (!newState) throw new Error('New state is required');
    const lifecycle = this._lifecycles.get(projectId);
    const transition = {
      from: lifecycle.state,
      to: newState,
      timestamp: new Date().toISOString()
    };
    lifecycle.transitions.push(transition);
    lifecycle.state = newState;
    return transition;
  }

  getState(projectId) {
    if (!this._lifecycles.has(projectId)) return null;
    return this._lifecycles.get(projectId).state;
  }

  getHistory(projectId) {
    if (!this._lifecycles.has(projectId)) return [];
    return [...this._lifecycles.get(projectId).transitions];
  }

  getAvailableTransitions(projectId) {
    if (!this._lifecycles.has(projectId)) return [];
    const state = this._lifecycles.get(projectId).state;
    const transitions = {
      created: ['in_progress', 'cancelled'],
      in_progress: ['review', 'completed', 'cancelled'],
      review: ['in_progress', 'approved', 'rejected'],
      approved: ['in_progress', 'completed'],
      rejected: ['in_progress', 'cancelled'],
      completed: ['archived'],
      archived: [],
      cancelled: []
    };
    return transitions[state] || [];
  }

  canTransition(projectId, targetState) {
    if (!this._lifecycles.has(projectId)) return false;
    const available = this.getAvailableTransitions(projectId);
    return available.includes(targetState);
  }

  clear() {
    this._lifecycles.clear();
  }
}

module.exports = { ProjectLifecycle };
