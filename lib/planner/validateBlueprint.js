class BlueprintValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'BlueprintValidationError';
    this.details = details;
  }
}

function validateBlueprint(blueprint) {
  if (!blueprint || typeof blueprint !== 'object') {
    throw new BlueprintValidationError('Blueprint must be an object', { received: typeof blueprint });
  }

  if (!blueprint.meta || !blueprint.meta.version) {
    throw new BlueprintValidationError('Blueprint must contain meta with version', { meta: blueprint.meta });
  }

  if (!blueprint.project || !blueprint.project.type) {
    throw new BlueprintValidationError('Blueprint must contain project with type', { project: blueprint.project });
  }

  const validTypes = ['ecommerce', 'portfolio', 'service_business', 'landing_page'];
  if (!validTypes.includes(blueprint.project.type)) {
    throw new BlueprintValidationError(`project.type must be one of: ${validTypes.join(', ')}`, { received: blueprint.project.type });
  }

  if (!blueprint.pages || !Array.isArray(blueprint.pages) || blueprint.pages.length === 0) {
    throw new BlueprintValidationError('Blueprint must contain a non-empty pages array', { count: blueprint.pages ? blueprint.pages.length : 0 });
  }

  for (const page of blueprint.pages) {
    if (!page.id || !page.path) {
      throw new BlueprintValidationError('Each page must have id and path', { page });
    }
    if (!page.sections || !Array.isArray(page.sections)) {
      throw new BlueprintValidationError(`Page ${page.id} must have a sections array`, { sections: page.sections });
    }
  }

  if (!blueprint.navigation || !blueprint.navigation.primary) {
    throw new BlueprintValidationError('Blueprint must contain navigation with primary', { navigation: blueprint.navigation });
  }

  if (!blueprint.sections || !blueprint.sections.registry || !Array.isArray(blueprint.sections.registry)) {
    throw new BlueprintValidationError('Blueprint must contain sections with registry array', { sections: blueprint.sections });
  }

  if (!blueprint.components || !blueprint.components.global) {
    throw new BlueprintValidationError('Blueprint must contain components with global array', { components: blueprint.components });
  }

  if (!blueprint.userFlow || !blueprint.userFlow.primaryPath) {
    throw new BlueprintValidationError('Blueprint must contain userFlow with primaryPath', { userFlow: blueprint.userFlow });
  }

  if (!blueprint.priorities || !blueprint.priorities.critical) {
    throw new BlueprintValidationError('Blueprint must contain priorities with critical array', { priorities: blueprint.priorities });
  }

  return blueprint;
}

module.exports = { validateBlueprint, BlueprintValidationError };
