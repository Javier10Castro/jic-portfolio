const runtime = require('../../../lib/runtime');
const { query } = require('../../../lib/db');
const events = require('../../../lib/events');
const log = require('../../../lib/logger');

module.exports = async (req, res) => {
  const start = Date.now();
  log.info(req, 'Events stream request', { method: req.method });

  if (req.method !== 'GET') {
    return res.writeHead(405, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const workspace_id = url.searchParams.get('workspace_id');
  const user_id = url.searchParams.get('user_id');
  const project_id = url.searchParams.get('project_id');

  if (!workspace_id) return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'workspace_id is required' }));
  if (!user_id) return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'user_id is required' }));

  try {
    const membership = await query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspace_id, user_id]
    );
    if (!membership.rows.length) {
      return res.writeHead(403, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Not a member of this workspace' }));
    }
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' && !e.statusCode ? 'Internal server error' : e.message;
    log.error(req, 'Events membership check failed', e);
    return res.writeHead(403, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: msg }));
  }

  try {
    const since = url.searchParams.get('since') || new Date(0).toISOString();
    const eventsList = await events.getEventsAfter(since, project_id || null, workspace_id);
    log.info(req, 'Events poll response', { count: eventsList.length, duration_ms: Date.now() - start });
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: true, events: eventsList }));
  } catch (e) {
    const msg = process.env.NODE_ENV === 'production' && !e.statusCode ? 'Internal server error' : e.message;
    log.error(req, 'Events poll failed', e);
    return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: msg }));
  }
};
