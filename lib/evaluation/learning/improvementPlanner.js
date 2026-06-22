class ImprovementPlanner {
  constructor() {
    this.plans = new Map();
  }

  createPlan(config) {
    const id = 'plan_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const plan = {
      id,
      name: config.name || 'Untitled Plan',
      description: config.description || '',
      steps: (config.steps || []).map((step, i) => ({
        index: i,
        description: step.description || '',
        status: step.status || 'pending',
        owner: step.owner || null,
        dueDate: step.dueDate || null,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.plans.set(id, plan);
    return plan;
  }

  getPlan(id) {
    return this.plans.get(id) || null;
  }

  listPlans(filter) {
    let results = Array.from(this.plans.values());
    if (filter) {
      if (filter.status) results = results.filter(p => p.steps.some(s => s.status === filter.status));
      if (filter.name) results = results.filter(p => p.name.toLowerCase().includes(filter.name.toLowerCase()));
    }
    return results;
  }

  updateStep(planId, stepIndex, status) {
    const plan = this.plans.get(planId);
    if (!plan) return null;
    const step = plan.steps[stepIndex];
    if (!step) return null;
    step.status = status;
    step.updatedAt = new Date();
    plan.updatedAt = new Date();
    return plan;
  }

  getProgress(planId) {
    const plan = this.plans.get(planId);
    if (!plan || plan.steps.length === 0) return { percent: 0, completed: 0, total: 0 };
    const completed = plan.steps.filter(s => s.status === 'completed').length;
    return {
      percent: Math.round((completed / plan.steps.length) * 100),
      completed,
      total: plan.steps.length,
    };
  }

  clear() {
    this.plans.clear();
  }
}

module.exports = ImprovementPlanner;
