function makeError(code, message, field) {
  const err = new Error(message);
  err.error = true;
  err.code = code;
  err.message = message;
  if (field) err.field = field;
  err.timestamp = new Date().toISOString();
  return err;
}

function assertRequired(value, fieldName) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    throw makeError('INVALID_INPUT', `${fieldName} is required`, fieldName);
  }
  return value;
}

function assertString(value, fieldName) {
  assertRequired(value, fieldName);
  if (typeof value !== 'string') {
    throw makeError('INVALID_INPUT', `${fieldName} must be a string`, fieldName);
  }
  return value.trim();
}

function assertUUID(value, fieldName) {
  assertRequired(value, fieldName);
  if (typeof value !== 'string') {
    throw makeError('INVALID_ID_FORMAT', `${fieldName} must be a valid UUID v4`, fieldName);
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value.trim())) {
    throw makeError('INVALID_ID_FORMAT', `${fieldName} must be a valid UUID v4`, fieldName);
  }
  return value.trim();
}

function validateCreateProject(input) {
  if (!input || typeof input !== 'object') {
    throw makeError('INVALID_INPUT', 'Input must be an object');
  }

  const workspaceId = assertUUID(input.workspaceId || input.workspace_id, 'workspace_id');
  const userId = assertUUID(input.userId || input.user_id, 'user_id');
  const name = assertString(input.name, 'name');

  return { workspaceId, userId, name, formData: input.formData || input.form_data || null };
}

function validateCreateProjectNormalized(input) {
  if (!input || typeof input !== 'object') {
    throw makeError('INVALID_INPUT', 'Input must be an object');
  }

  const { normalizeId } = require('./id-normalizer');
  const workspaceId = normalizeId(input.workspaceId || input.workspace_id, 'workspace_id');
  const userId = normalizeId(input.userId || input.user_id, 'user_id');
  const name = assertString(input.name, 'name');

  return { workspaceId, userId, name, formData: input.formData || input.form_data || null };
}

function validateRunPipeline(input) {
  if (!input || typeof input !== 'object') {
    throw makeError('INVALID_INPUT', 'Input must be an object');
  }

  const projectId = assertUUID(input.projectId || input.project_id, 'project_id');
  const workspaceId = assertUUID(input.workspaceId || input.workspace_id, 'workspace_id');
  const executionId = assertUUID(input.executionId || input.execution_id, 'execution_id');

  return { projectId, workspaceId, executionId, formData: input.formData || null, inputType: input.inputType || input.input_type || 'json_brief' };
}

function validateRunPipelineNormalized(input) {
  if (!input || typeof input !== 'object') {
    throw makeError('INVALID_INPUT', 'Input must be an object');
  }

  const { normalizeId } = require('./id-normalizer');
  const projectId = normalizeId(input.projectId || input.project_id, 'project_id');
  const workspaceId = normalizeId(input.workspaceId || input.workspace_id, 'workspace_id');
  const executionId = normalizeId(input.executionId || input.execution_id, 'execution_id');

  return { projectId, workspaceId, executionId, formData: input.formData || null, inputType: input.inputType || input.input_type || 'json_brief' };
}

function validateApproveProject(input) {
  if (!input || typeof input !== 'object') {
    throw makeError('INVALID_INPUT', 'Input must be an object');
  }

  const projectId = assertUUID(input.projectId || input.project_id, 'project_id');
  const workspaceId = assertUUID(input.workspaceId || input.workspace_id, 'workspace_id');
  const userId = assertUUID(input.userId || input.user_id, 'user_id');

  return { projectId, workspaceId, userId };
}

function validateApproveProjectNormalized(input) {
  if (!input || typeof input !== 'object') {
    throw makeError('INVALID_INPUT', 'Input must be an object');
  }

  const { normalizeId } = require('./id-normalizer');
  const projectId = normalizeId(input.projectId || input.project_id, 'project_id');
  const workspaceId = normalizeId(input.workspaceId || input.workspace_id, 'workspace_id');
  const userId = normalizeId(input.userId || input.user_id, 'user_id');

  return { projectId, workspaceId, userId };
}

module.exports = {
  makeError,
  assertRequired,
  assertString,
  assertUUID,
  validateCreateProject,
  validateCreateProjectNormalized,
  validateRunPipeline,
  validateRunPipelineNormalized,
  validateApproveProject,
  validateApproveProjectNormalized,
};
