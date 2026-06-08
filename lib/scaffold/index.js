const engine = require('./core/engine');
const ds = require('../design-system');

function scaffold(projectDefinition) {
  const { project_name, project_type, prompt_maestro_final, branding_colors, designSystem } = projectDefinition;

  if (!project_name || !project_type) {
    throw new Error('project_name and project_type are required');
  }

  let dsResult = designSystem || null;
  if (!dsResult && branding_colors) {
    dsResult = ds.buildDesignSystem(branding_colors);
  }

  return engine.run({
    project_name: sanitize(project_name),
    project_type,
    prompt_maestro_final: prompt_maestro_final || '',
    designSystem: dsResult
  });
}

function sanitize(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

module.exports = { scaffold };
