const runtime = require('../../../../lib/runtime');
const { query } = require('../../../../lib/db');
const log = require('../../../../lib/logger');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  const start = Date.now();
  log.info(req, 'Approve project', { method: req.method });

  if (req.method !== 'POST') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const projectId = pathParts[pathParts.length - 2];

  let body = '';
  for await (const chunk of req) body += chunk;
  if (body.length > 1000000) return res.writeHead(413, HEADERS).end(JSON.stringify({ error: 'Payload too large' }));
  let parsed;
  try { parsed = JSON.parse(body || '{}'); } catch { return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'Invalid JSON body' })); }

  const { workspace_id, user_id } = parsed;

  if (!workspace_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'workspace_id is required' }));
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspace_id)) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'workspace_id must be a valid UUID v4' }));
  if (!user_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'user_id is required' }));
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id)) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'user_id must be a valid UUID v4' }));

  try {
    const membership = await query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspace_id, user_id]
    );
    if (!membership.rows.length || !['owner', 'admin', 'member'].includes(membership.rows[0].role)) {
      return res.writeHead(403, HEADERS).end(JSON.stringify({ error: 'Insufficient permissions' }));
    }

    const project = await runtime.getProjectById(projectId, workspace_id);
    if (!project) {
      return res.writeHead(404, HEADERS).end(JSON.stringify({ error: 'Project not found' }));
    }

    if (project.status !== 'preview') {
      return res.writeHead(409, HEADERS).end(JSON.stringify({ error: `Cannot approve project in status: ${project.status}. Expected: preview` }));
    }

    const result = await runtime.approveProject(projectId, workspace_id, user_id);

    log.info(req, 'Project approved', { projectId, status: result.status, execution_id: result.execution_id, duration_ms: Date.now() - start });
    return res.writeHead(200, HEADERS).end(JSON.stringify({
      success: true,
      status: result.status,
      execution_id: result.execution_id,
      project_id: projectId,
    }));
  } catch (err) {
    log.error(req, 'Project approval failed', err, { projectId, duration_ms: Date.now() - start });
    const msg = process.env.NODE_ENV === 'production' && !err.statusCode ? 'Internal server error' : err.message;
    return res.writeHead(err.statusCode || 500, HEADERS).end(JSON.stringify({ error: msg }));
  }
};
