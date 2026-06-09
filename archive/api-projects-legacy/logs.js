require('dotenv').config();
const decision = require('../../lib/decision');
const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  const projectId = new URL(req.url, 'http://localhost').searchParams.get('id');

  try {
    const decisions = (decision.listDecisions() || []).filter(d => {
      if (!projectId) return true;
      return (
        d.title && d.title.toLowerCase().includes(projectId.toLowerCase())
      ) || (
        d.reason && d.reason.toLowerCase().includes(projectId.toLowerCase())
      ) || (
        d.modules_affected && d.modules_affected.some(m =>
          m.toLowerCase().includes('formresponses') || m.toLowerCase().includes(projectId.toLowerCase())
        )
      );
    });

    return res.writeHead(200, HEADERS).end(JSON.stringify({ decisions }));
  } catch (err) {
    console.error('[projects/logs]', err.message);
    return res.writeHead(500, HEADERS).end(JSON.stringify({ error: err.message }));
  }
};
