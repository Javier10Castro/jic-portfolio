const runtime = require('../../../lib/runtime');
const { query } = require('../../../lib/db');
const log = require('../../../lib/logger');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  const start = Date.now();
  log.info(req, 'Get execution detail', { method: req.method });

  if (req.method !== 'GET') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const executionId = pathParts[pathParts.length - 1];
  const workspace_id = url.searchParams.get('workspace_id');
  const user_id = url.searchParams.get('user_id');

  if (!executionId) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'Execution ID is required' }));
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

    const execution = await runtime.getExecutionById(executionId, workspace_id);
    if (!execution) {
      return res.writeHead(404, HEADERS).end(JSON.stringify({ error: 'Execution not found' }));
    }

    let decisions = [];
    try {
      const decResult = await query(
        `SELECT id, decision_type, score, metrics, warnings, passed, feedback, created_at FROM decisions WHERE execution_id = $1 ORDER BY created_at DESC`,
        [executionId]
      );
      decisions = decResult.rows;
    } catch {}

    log.info(req, 'Execution detail retrieved', { executionId, status: execution.status, duration_ms: Date.now() - start });
    return res.writeHead(200, HEADERS).end(JSON.stringify({
      success: true,
      execution: {
        id: execution.id,
        project_id: execution.project_id,
        session_id: execution.session_id,
        input_type: execution.input_type,
        pipeline: execution.pipeline,
        status: execution.status,
        steps: execution.steps,
        errors: execution.errors,
        duration_ms: execution.duration_ms,
        started_at: execution.started_at,
        completed_at: execution.completed_at,
      },
      decisions,
    }));
  } catch (err) {
    log.error(req, 'Execution detail retrieval failed', err, { executionId, duration_ms: Date.now() - start });
    const msg = process.env.NODE_ENV === 'production' && !err.statusCode ? 'Internal server error' : err.message;
    return res.writeHead(err.statusCode || 500, HEADERS).end(JSON.stringify({ error: msg }));
  }
};
