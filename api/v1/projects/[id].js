const runtime = require('../../../lib/runtime');
const { query } = require('../../../lib/db');
const log = require('../../../lib/logger');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  const start = Date.now();
  log.info(req, 'Get project detail', { method: req.method });

  if (req.method !== 'GET') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const projectId = pathParts[pathParts.length - 1];
  const workspace_id = url.searchParams.get('workspace_id');
  const user_id = url.searchParams.get('user_id');

  if (!projectId) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'Project ID is required' }));
  if (!workspace_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'workspace_id is required' }));
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspace_id)) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'workspace_id must be a valid UUID v4' }));
  if (!user_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'user_id is required' }));
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id)) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'user_id must be a valid UUID v4' }));

  try {
    const membership = await query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspace_id, user_id]
    );
    if (!membership.rows.length) {
      return res.writeHead(403, HEADERS).end(JSON.stringify({ error: 'Not a member of this workspace' }));
    }

    const project = await runtime.getProjectById(projectId, workspace_id);
    if (!project) {
      return res.writeHead(404, HEADERS).end(JSON.stringify({ error: 'Project not found' }));
    }

    const include = (url.searchParams.get('include') || '').split(',').filter(Boolean);
    const inputs = include.includes('inputs') ? await runtime.getProjectInputs(projectId) : null;
    const previews = include.includes('previews') ? await runtime.getProjectPreviews(projectId, workspace_id) : null;
    const states = include.includes('states') ? await runtime.getProjectStates(projectId, workspace_id) : null;
    const decisions = include.includes('decisions') ? await runtime.getDecisionsForProject(projectId, workspace_id) : null;

    const state = runtime.extractRuntimeState(project, inputs || [], previews || [], states || [], decisions || []);

    const baseIncludeKeys = ['inputs', 'previews', 'states', 'decisions'];
    const extraKeys = {};
    for (const key of include) {
      if (!baseIncludeKeys.includes(key) && state[key] !== undefined) extraKeys[key] = state[key];
    }

    log.info(req, 'Project detail retrieved', { projectId, duration_ms: Date.now() - start });
    return res.writeHead(200, HEADERS).end(JSON.stringify({
      success: true,
      ...state,
      ...extraKeys,
    }));
  } catch (err) {
    log.error(req, 'Failed to get project detail', err, { projectId, duration_ms: Date.now() - start });
    const msg = process.env.NODE_ENV === 'production' && !err.statusCode ? 'Internal server error' : err.message;
    return res.writeHead(err.statusCode || 500, HEADERS).end(JSON.stringify({ error: msg }));
  }
};
