const STEP_TYPES = ['task', 'parallel', 'conditional', 'foreach', 'wait', 'subworkflow', 'agent', 'noop'];
const BRANCH_OPERATORS = ['equals', 'notEquals', 'contains', 'gt', 'gte', 'lt', 'lte', 'exists', 'truthy'];

class WorkflowDefinition {
  constructor(def) {
    this._validate(def);
    this.id = def.id;
    this.name = def.name || def.id;
    this.type = def.type || 'default';
    this.version = def.version || 1;
    this.description = def.description || '';
    this.steps = def.steps || [];
    this.timeout = def.timeout || 3600000;
    this.retryPolicy = def.retryPolicy || { maxRetries: 3, backoff: 'exponential', baseDelay: 1000 };
    this.inputSchema = def.inputSchema || null;
    this.outputSchema = def.outputSchema || null;
    this.tags = def.tags || [];
  }

  _validate(def) {
    if (!def) throw new Error('Workflow definition is required');
    if (!def.id) throw new Error('Workflow definition must have an id');
    if (def.steps && !Array.isArray(def.steps)) throw new Error('Steps must be an array');
    if (def.steps) {
      for (const step of def.steps) {
        this._validateStep(step);
      }
    }
  }

  _validateStep(step, path = '') {
    if (!step.id) throw new Error(`Step at ${path} must have an id`);
    if (!step.type) throw new Error(`Step "${step.id}" must have a type`);
    if (!STEP_TYPES.includes(step.type)) throw new Error(`Step "${step.id}" has invalid type "${step.type}". Valid: ${STEP_TYPES.join(', ')}`);

    if (step.type === 'conditional') {
      if (!step.condition) throw new Error(`Conditional step "${step.id}" must have a condition`);
      if (!step.condition.operator || !BRANCH_OPERATORS.includes(step.condition.operator)) {
        throw new Error(`Conditional step "${step.id}" has invalid operator. Valid: ${BRANCH_OPERATORS.join(', ')}`);
      }
      if (!step.condition.field) throw new Error(`Conditional step "${step.id}" must have condition.field`);
      if (step.branches) {
        for (const [key, branchSteps] of Object.entries(step.branches)) {
          if (!Array.isArray(branchSteps)) throw new Error(`Branch "${key}" in step "${step.id}" must be an array`);
          for (const bs of branchSteps) this._validateStep(bs, `${step.id}.branches.${key}`);
        }
      }
    }

    if (step.type === 'parallel') {
      if (step.branches) {
        for (const [key, branchSteps] of Object.entries(step.branches)) {
          if (!Array.isArray(branchSteps)) throw new Error(`Parallel branch "${key}" in step "${step.id}" must be an array`);
          for (const bs of branchSteps) this._validateStep(bs, `${step.id}.branches.${key}`);
        }
      }
    }

    if (step.type === 'foreach') {
      if (!step.collection) throw new Error(`Foreach step "${step.id}" must have a collection`);
      if (step.steps) {
        for (const s of step.steps) this._validateStep(s, `${step.id}.items`);
      }
    }

    if (step.type === 'subworkflow') {
      if (!step.workflowId) throw new Error(`Subworkflow step "${step.id}" must have a workflowId`);
    }

    if (step.type === 'agent') {
      if (!step.agent) throw new Error(`Agent step "${step.id}" must have an agent name`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: this.version,
      description: this.description,
      steps: this.steps,
      timeout: this.timeout,
      retryPolicy: this.retryPolicy,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      tags: this.tags,
    };
  }

  static fromJSON(json) {
    return new WorkflowDefinition(json);
  }
}

module.exports = { WorkflowDefinition, STEP_TYPES, BRANCH_OPERATORS };
