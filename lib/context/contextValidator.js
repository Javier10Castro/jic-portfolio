const { ContextValidationError } = require('./errors/ContextValidationError');

function validateContext(context) {
  const errors = [];
  if (!context) return [new ContextValidationError('Context is null or undefined')];
  if (!context.intentType) errors.push(new ContextValidationError('Missing intentType', { field: 'intentType' }));
  if (!context.project) errors.push(new ContextValidationError('Missing project section', { field: 'project' }));
  if (context.project && !context.project.name && !context.project.brand_name) {
    errors.push(new ContextValidationError('Project must have a name or brand_name', { field: 'project.name' }));
  }
  if (!context.pages) errors.push(new ContextValidationError('Missing pages section', { field: 'pages' }));
  if (context.pages && !Array.isArray(context.pages)) {
    errors.push(new ContextValidationError('Pages must be an array', { field: 'pages' }));
  }
  if (context.pages && Array.isArray(context.pages) && !context.pages.length) {
    errors.push(new ContextValidationError('Pages array is empty', { field: 'pages' }));
  }
  if (context.settings && context.settings.dark_mode != null && typeof context.settings.dark_mode !== 'boolean') {
    errors.push(new ContextValidationError('dark_mode must be boolean', { field: 'settings.dark_mode' }));
  }
  return errors;
}

function assertValid(context) {
  const errors = validateContext(context);
  if (errors.length) throw errors[0];
  return true;
}

module.exports = { validateContext, assertValid };
