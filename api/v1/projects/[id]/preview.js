const runtime = require('../../../../lib/runtime');
const { query } = require('../../../../lib/db');
const log = require('../../../../lib/logger');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  const start = Date.now();
  log.info(req, 'Preview project', { method: req.method });

  if (req.method !== 'GET') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const projectId = pathParts[pathParts.length - 2];
  const workspace_id = url.searchParams.get('workspace_id');
  const user_id = url.searchParams.get('user_id');
  const version = url.searchParams.get('version');

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

    const previews = await runtime.getProjectPreviews(projectId, workspace_id);
    if (!previews.length) {
      return res.writeHead(404, HEADERS).end(JSON.stringify({ error: 'No previews found for this project' }));
    }

    let targetPreview;
    if (version) {
      targetPreview = previews.find(p => p.version === parseInt(version, 10));
      if (!targetPreview) {
        return res.writeHead(404, HEADERS).end(JSON.stringify({ error: `Preview version ${version} not found` }));
      }
    } else {
      targetPreview = previews.find(p => p.is_current) || previews[0];
    }

    const full = await runtime.getPreviewById(targetPreview.id, workspace_id);
    if (!full) {
      return res.writeHead(404, HEADERS).end(JSON.stringify({ error: 'Preview content not found' }));
    }

    const format = url.searchParams.get('format');
    if (format === 'html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(full.html_content || '');
    }
    if (format === 'css') {
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      return res.end(full.css_content || '');
    }

    log.info(req, 'Preview retrieved', { projectId, version: full.version, duration_ms: Date.now() - start });
    return res.writeHead(200, HEADERS).end(JSON.stringify({
      success: true,
      preview: {
        id: full.id,
        version: full.version,
        is_current: full.is_current,
        is_approved: full.is_approved,
        score: full.decision_score,
        design_system: full.design_system_snapshot,
        plan_ir: full.plan_ir_snapshot,
        html: full.html_content,
        css: full.css_content,
        created_at: full.created_at,
      },
    }));
  } catch (err) {
    log.error(req, 'Preview retrieval failed', err, { projectId, duration_ms: Date.now() - start });
    const msg = process.env.NODE_ENV === 'production' && !err.statusCode ? 'Internal server error' : err.message;
    return res.writeHead(err.statusCode || 500, HEADERS).end(JSON.stringify({ error: msg }));
  }
};
