const { listEntries, getAggregateMetrics, lookupRequest } = require('../lib/request-registry');

module.exports = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const id = url.searchParams.get('id') || '';

  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (id) {
    const entry = lookupRequest(id);
    if (!entry) return res.writeHead(404, headers).end(JSON.stringify({ error: 'Request not found' }));
    return res.writeHead(200, headers).end(JSON.stringify(entry));
  }

  const entries = listEntries(limit);
  const metrics = getAggregateMetrics();

  res.writeHead(200, headers).end(JSON.stringify({ entries, metrics }));
};
