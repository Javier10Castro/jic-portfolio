require('dotenv').config();
const loader = require('../../lib/loader');
const plan = require('../../lib/plan');
const scaffold = require('../../lib/scaffold');
const decision = require('../../lib/decision');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  let body = '';
  for await (const chunk of req) body += chunk;
  const { id: projectId, lang, project_type } = JSON.parse(body || '{}');

  if (!projectId) {
    return res.writeHead(400, HEADERS).end(JSON.stringify({ error: 'id is required' }));
  }

  try {
    const prompt = await loader.rebuildPromptMaestro(projectId, lang || 'es');
    if (!prompt) {
      return res.writeHead(404, HEADERS).end(JSON.stringify({ error: 'No form data found for this project' }));
    }

    const ir = plan.compile(prompt);
    const name = projectId.replace(/^proj_/, '').slice(0, 20);
    const result = scaffold.scaffold({
      project_name: name || 'dashboard-project',
      project_type: project_type || 'website',
      prompt_maestro_final: prompt,
    });

    return res.writeHead(200, HEADERS).end(JSON.stringify({
      project_id: projectId,
      scaffold: { path: result.path, name: result.name, files: result.files },
    }));
  } catch (err) {
    console.error('[projects/run-scaffold]', err.message);
    return res.writeHead(500, HEADERS).end(JSON.stringify({ error: err.message }));
  }
};
