class PlanIRValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'PlanIRValidationError';
    this.details = details;
  }
}

function validatePlanIR(plan) {
  if (!plan || typeof plan !== 'object') {
    throw new PlanIRValidationError('Plan IR must be an object', { received: typeof plan });
  }

  if (!plan.project || typeof plan.project !== 'object') {
    throw new PlanIRValidationError('Plan IR must contain a project object', { received: typeof plan.project });
  }

  if (!plan.project.type) {
    throw new PlanIRValidationError('project.type is required', { project: plan.project });
  }

  const validTypes = ['ecommerce', 'portfolio', 'service_business', 'landing_page'];
  if (!validTypes.includes(plan.project.type)) {
    throw new PlanIRValidationError(`project.type must be one of: ${validTypes.join(', ')}`, { received: plan.project.type });
  }

  if (!plan.structure || typeof plan.structure !== 'object') {
    throw new PlanIRValidationError('Plan IR must contain a structure object', { received: typeof plan.structure });
  }

  if (!plan.structure.sections || !Array.isArray(plan.structure.sections) || plan.structure.sections.length === 0) {
    throw new PlanIRValidationError('structure.sections must be a non-empty array', { received: typeof plan.structure.sections });
  }

  if (!plan.meta || typeof plan.meta !== 'object') {
    throw new PlanIRValidationError('Plan IR must contain a meta object', { received: typeof plan.meta });
  }

  if (!plan.tone || typeof plan.tone !== 'object') {
    throw new PlanIRValidationError('Plan IR must contain a tone object', { received: typeof plan.tone });
  }

  const validTones = ['friendly_professional', 'casual', 'luxury'];
  if (plan.tone.style && !validTones.includes(plan.tone.style)) {
    throw new PlanIRValidationError(`tone.style must be one of: ${validTones.join(', ')}`, { received: plan.tone.style });
  }

  if (!plan.features || typeof plan.features !== 'object') {
    throw new PlanIRValidationError('Plan IR must contain a features object', { received: typeof plan.features });
  }

  return plan;
}

module.exports = { validatePlanIR, PlanIRValidationError };
