const { query } = require('../db');
const { isUUID } = require('./id-normalizer');
const { makeError } = require('./validators');

const PROJECT_SQL = `SELECT p.id, p.workspace_id, p.created_by, p.name, p.slug, p.description, p.status, p.project_type, p.version, p.current_preview_id, p.live_url, p.preview_url, p.github_repo, p.custom_domain, p.design_system, p.plan_ir, p.prompt_maestro, p.metadata, p.feedback, p.generated_at, p.deployed_at, p.created_at, p.updated_at, u.name as created_by_name, u.email as created_by_email FROM projects p LEFT JOIN users u ON u.id = p.created_by WHERE`;

async function resolveProject({ project_id, workspace_id }) {
  if (!project_id) throw makeError('INVALID_INPUT', 'project_id is required', 'project_id');
  if (!workspace_id) throw makeError('INVALID_INPUT', 'workspace_id is required', 'workspace_id');

  const sql = isUUID(project_id)
    ? PROJECT_SQL + ' p.id = $1 AND p.workspace_id = $2'
    : PROJECT_SQL + ' p.slug = $1 AND p.workspace_id = $2';

  const r = await query(sql, [project_id, workspace_id]);
  if (!r.rows.length) throw makeError('NOT_FOUND', 'Project not found', 'project_id');
  return r.rows[0];
}

module.exports = { resolveProject };
