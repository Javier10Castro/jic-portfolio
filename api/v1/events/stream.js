require('dotenv').config();
const runtime = require('../../../lib/runtime');
const { query } = require('../../../lib/db');
const events = require('../../../lib/events');
const HEADERS = { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' };

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.writeHead(405, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const workspace_id = url.searchParams.get('workspace_id');
  const user_id = url.searchParams.get('user_id');
  const project_id = url.searchParams.get('project_id');
  const pollOnly = url.searchParams.get('poll') === '1';

  if (!workspace_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'workspace_id is required' }));
  if (!user_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'user_id is required' }));

  try {
    const membership = await query(
      `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [workspace_id, user_id]
    );
    if (!membership.rows.length) {
      return res.writeHead(403, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Not a member of this workspace' }));
    }
  } catch (e) {
    return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: e.message }));
  }

  if (pollOnly) {
    try {
      const since = url.searchParams.get('since') || new Date(0).toISOString();
      const eventsList = await events.getEventsAfter(since, project_id || null, workspace_id);
      return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: true, events: eventsList }));
    } catch (e) {
      return res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: e.message }));
    }
  }

  res.writeHead(200, HEADERS);

  let lastTimestamp = new Date().toISOString();
  let closed = false;

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Stream connected' })}\n\n`);

  const keepAlive = setInterval(() => {
    if (closed) return;
    try { res.write(`:keepalive\n\n`); } catch { close(); }
  }, 15000);

  let lastCheck = Date.now();

  async function poll() {
    if (closed) return;
    try {
      const eventsList = await events.getEventsAfter(lastTimestamp, project_id || null, workspace_id);
      for (const evt of eventsList) {
        if (closed) return;
        const payload = typeof evt.payload === 'string' ? JSON.parse(evt.payload) : evt.payload;
        res.write(`event: ${evt.event_type}\ndata: ${JSON.stringify({ event: evt.event_type, project_id: evt.project_id, execution_id: evt.execution_id, timestamp: evt.created_at, payload })}\n\n`);
        lastTimestamp = evt.created_at;
      }
    } catch {}
    lastCheck = Date.now();
  }

  const pollTimer = setInterval(poll, 2000);
  poll();

  function close() {
    if (closed) return;
    closed = true;
    clearInterval(keepAlive);
    clearInterval(pollTimer);
    try { res.end(); } catch {}
  }

  req.on('close', close);
  req.on('error', close);

  const timeout = setTimeout(close, 55000);
  req.on('close', () => clearTimeout(timeout));
};
