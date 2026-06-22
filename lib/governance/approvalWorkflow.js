class ApprovalWorkflow {
  constructor() {
    this.workflows = new Map();
    this.instances = new Map();
  }

  defineWorkflow(name, steps) {
    if (!name || !Array.isArray(steps)) return;
    this.workflows.set(name, { name, steps });
  }

  getWorkflow(name) {
    return this.workflows.get(name) || null;
  }

  listWorkflows() {
    return Array.from(this.workflows.values());
  }

  startWorkflow(requestId, workflowName) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow || !requestId) return null;
    if (workflow.steps.length === 0) return null;
    const instance = {
      requestId, workflowName, currentStep: 0,
      steps: workflow.steps.map((s, i) => ({
        name: s.name, approvers: s.approvers || [], type: s.type || 'any',
        config: s.config || {}, status: i === 0 ? 'active' : 'pending',
        decidedBy: null, decidedAt: null
      })),
      status: 'in_progress', startedAt: new Date().toISOString()
    };
    this.instances.set(requestId, instance);
    return instance;
  }

  getWorkflowStatus(requestId) {
    return this.instances.get(requestId) || null;
  }

  advanceWorkflow(requestId, decision, actor) {
    const instance = this.instances.get(requestId);
    if (!instance || instance.status !== 'in_progress') return null;
    const step = instance.steps[instance.currentStep];
    if (!step || step.status !== 'active') return null;
    step.status = decision === 'approved' ? 'approved' : 'rejected';
    step.decidedBy = actor;
    step.decidedAt = new Date().toISOString();
    if (decision === 'rejected') {
      instance.status = 'rejected';
      return instance;
    }
    instance.currentStep++;
    if (instance.currentStep >= instance.steps.length) {
      instance.status = 'completed';
    } else {
      instance.steps[instance.currentStep].status = 'active';
    }
    return instance;
  }

  clear() {
    this.workflows.clear();
    this.instances.clear();
  }
}

module.exports = new ApprovalWorkflow();
