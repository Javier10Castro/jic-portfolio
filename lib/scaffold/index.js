const engine = require('./core/engine');

function scaffold(projectDefinition) {
  const { project_name, project_type, prompt_maestro_final } = projectDefinition;

  if (!project_name || !project_type) {
    throw new Error('project_name and project_type are required');
  }

  return engine.run({
    project_name: sanitize(project_name),
    project_type,
    prompt_maestro_final: prompt_maestro_final || ''
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
