require('dotenv').config();
const loader = require('../../lib/loader');
const plan = require('../../lib/plan');
const decision = require('../../lib/decision');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  let body = '';
  for await (const chunk of req) body += chunk;
  const { id: projectId, lang } = JSON.parse(body || '{}');

  if (!projectId) {
    return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'id is required' }));
  }

  try {
    const prompt = await loader.rebuildPromptMaestro(projectId, lang || 'es');
    if (!prompt) {
      return res.writeHead(404, HEADERS).end(JSON.stringify({ error: 'No form data found for this project' }));
    }

    const ir = plan.compile(prompt);

    return res.writeHead(200, HEADERS).end(JSON.stringify({ project_id: projectId, prompt, ir }));
  } catch (err) {
    console.error('[projects/run-plan]', err.message);
    return res.writeHead(500, HEADERS).end(JSON.stringify({ error: err.message }));
  }
};
