require('dotenv').config();
const runtime = require('../../../lib/runtime');
const { query } = require('../../../lib/db');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
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
  if (!user_id) return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'user_id is required' }));

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
    console.error('[api/v1/executions/detail]', err.message);
    return res.writeHead(500, HEADERS).end(JSON.stringify({ error: err.message }));
  }
};
