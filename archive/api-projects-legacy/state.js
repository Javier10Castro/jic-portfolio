require('dotenv').config();
const loader = require('../../lib/loader');
const decision = require('../../lib/decision');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const projectId = new URL(req.url, 'http://localhost').searchParams.get('id');
  if (!projectId) {
    return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'id query param required' }));
  }

  try {
    const state = await loader.getProjectState(projectId);
    if (!state.form_responses || state.form_responses.responses.length === 0) {
      return res.writeHead(404, HEADERS).end(JSON.stringify({ error: 'Project not found' }));
    }
    return res.writeHead(200, HEADERS).end(JSON.stringify(state));
  } catch (err) {
    console.error('[projects/state]', err.message);
    return res.writeHead(500, HEADERS).end(JSON.stringify({ error: err.message }));
  }
};
