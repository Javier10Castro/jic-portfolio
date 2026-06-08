require('dotenv').config();
const runtime = require('../../../lib/runtime');
const { query } = require('../../../lib/db');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  let body = '';
  for await (const chunk of req) body += chunk;
  let parsed;
  try { parsed = JSON.parse(body || '{}'); } catch { return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'Invalid JSON body' })); }

  const { workspace_id, user_id, name, formData, run_pipeline } = parsed;

  if (!workspace_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'workspace_id is required' }));
  if (!user_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'user_id is required' }));
  if (!name) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'name is required' }));

  try {
    const membership = await query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspace_id, user_id]
    );
    if (!membership.rows.length || membership.rows[0].role === 'viewer') {
      return res.writeHead(403, HEADERS).end(JSON.stringify({ error: 'Insufficient permissions' }));
    }

    const project = await runtime.createProject(workspace_id, user_id, name, formData || null);

    let pipelineResult = null;
    if (run_pipeline !== false) {
      const execDb = await query(
        `INSERT INTO executions (id, project_id, session_id, input_type, pipeline, status, steps, errors, triggered_by, started_at) VALUES ($1,$2,$3,'json_brief',ARRAY['plan','design_system','preview','scoring'],'queued','[]'::jsonb,'[]'::jsonb,$4,NOW()) RETURNING id`,
        [require('crypto').randomUUID(), project.id, require('crypto').randomBytes(8).toString('hex'), user_id]
      );
      const executionId = execDb.rows[0].id;
      pipelineResult = await runtime.runPipeline(project.id, workspace_id, executionId, formData || null, 'json_brief');
    }

    return res.writeHead(201, HEADERS).end(JSON.stringify({
      success: true,
      project: { id: project.id, name, slug: project.slug, status: 'draft', created_at: project.created_at },
      pipeline: pipelineResult,
    }));
  } catch (err) {
    console.error('[api/v1/projects/create]', err.message);
    return res.writeHead(500, HEADERS).end(JSON.stringify({ error: err.message }));
  }
};
