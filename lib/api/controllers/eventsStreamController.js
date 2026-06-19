const SSE_HEADERS = { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' };

let _sseClients = new Set();

function streamEvents(req, res) {
  res.writeHead(200, SSE_HEADERS);
  res.write('data: ' + JSON.stringify({ type: 'connected', timestamp: Date.now() }) + '\n\n');

  const clientId = 'sse-' + Math.random().toString(36).substring(2, 10);
  const client = { id: clientId, res };
  _sseClients.add(client);

  const filters = {};
  if (req.query.type) filters.type = req.query.type;
  if (req.query.source) filters.source = req.query.source;
  if (req.query.severity) filters.severity = req.query.severity;
  client.filters = filters;

  let eventUnsub = null;
  try {
    const events = require('../../events');
    const bus = events.getEventBus();
    if (bus) {
      eventUnsub = bus.on('*', (event) => {
        if (!event || !event.type) return;
        if (filters.type && event.type !== filters.type) return;
        if (filters.source && event.source !== filters.source) return;
        if (filters.severity && event.severity !== filters.severity) return;
        try {
          res.write('event: event\ndata: ' + JSON.stringify({ type: event.type, source: event.source, severity: event.severity, payload: event.payload, correlationId: event.correlationId, timestamp: event.timestamp || Date.now(), id: event.id }) + '\n\n');
        } catch (e) { cleanup(); }
      });
    }
  } catch (e) {}

  const keepalive = setInterval(() => {
    try { res.write(':keepalive\n\n'); } catch (e) { cleanup(); }
  }, 15000);

  req.on('close', cleanup);
  req.on('error', cleanup);

  function cleanup() {
    _sseClients.delete(client);
    if (eventUnsub) { try { eventUnsub(); } catch (e) {} }
    clearInterval(keepalive);
  }
}

function getConnectedClients(req, res) {
  const { success } = require('../responses');
  return success(res, { connectedClients: _sseClients.size, clients: Array.from(_sseClients).map(c => ({ id: c.id, filters: c.filters })) });
}

function broadcastEvent(event) {
  let sent = 0;
  for (const client of _sseClients) {
    try {
      client.res.write('event: event\ndata: ' + JSON.stringify(event) + '\n\n');
      sent++;
    } catch (e) {
      _sseClients.delete(client);
    }
  }
  return sent;
}

module.exports = { streamEvents, getConnectedClients, broadcastEvent };
