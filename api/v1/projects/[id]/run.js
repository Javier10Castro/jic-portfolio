require('dotenv').config();
const crypto = require('crypto');
const runtime = require('../../../../lib/runtime');
const { query } = require('../../../../lib/db');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const projectId = pathParts[pathParts.length - 2];

  let body = '';
  for await (const chunk of req) body += chunk;
  let parsed;
  try { parsed = JSON.parse(body || '{}'); } catch { return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'Invalid JSON body' })); }

  const { workspace_id, user_id, formData } = parsed;

  if (!workspace_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'workspace_id is required' }));
  if (!user_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'user_id is required' }));

  try {
    const membership = await query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspace_id, user_id]
    );
    if (!membership.rows.length || membership.rows[0].role === 'viewer') {
      return res.writeHead(403, HEADERS).end(JSON.stringify({ error: 'Insufficient permissions' }));
    }

    const project = await runtime.getProjectById(projectId, workspace_id);
    if (!project) {
      return res.writeHead(404, HEADERS).end(JSON.stringify({ error: 'Project not found' }));
    }

    if (project.status === 'processing') {
      return res.writeHead(409, HEADERS).end(JSON.stringify({ error: 'Project is already processing' }));
    }

    const execDb = await query(
      `INSERT INTO executions (id, project_id, session_id, input_type, pipeline, status, steps, errors, triggered_by, started_at) VALUES ($1,$2,$3,'json_brief',ARRAY['plan','design_system','preview','scoring'],'queued','[]'::jsonb,'[]'::jsonb,$4,NOW()) RETURNING id`,
      [crypto.randomUUID(), projectId, crypto.randomBytes(8).toString('hex'), user_id]
    );
    const executionId = execDb.rows[0].id;

    const result = await runtime.runPipeline(projectId, workspace_id, executionId, formData || null, 'json_brief');

    return res.writeHead(200, HEADERS).end(JSON.stringify({
      success: true,
      execution_id: executionId,
      ...result,
    }));
  } catch (err) {
    console.error('[api/v1/projects/run]', err.message);
    return res.writeHead(500, HEADERS).end(JSON.stringify({ error: err.message }));
  }
};
