const { getEventBus, getCorrelator } = require('./index');

const DEFAULT_OPTIONS = { workflow: true, ai: true, agent: true, cluster: true, telemetry: true, api: true, intelligence: true };

let _hooksInstalled = false;

function installEventHooks(options = {}) {
  if (_hooksInstalled) return { unsubs: [] };
  _hooksInstalled = true;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const bus = getEventBus();
  const correlator = getCorrelator();

  const unsubs = [];

  if (opts.workflow) {
    try {
      const wfEvents = require('../workflows').getWorkflowManager().events;
      if (wfEvents) {
        unsubs.push(wfEvents.on('*', (entry) => {
          const eventType = 'workflow.' + entry.type;
          bus.emit(eventType, entry.data, { source: 'workflow' });
        }));
      }
    } catch (e) { /* workflow not available */ }
  }

  if (opts.telemetry) {
    try {
      const tm = require('../telemetry').getTelemetryManager();
      if (tm && tm._events) {
        unsubs.push(tm._events.on('*', (entry) => {
          const eventType = 'telemetry.' + (entry.type || 'event');
          bus.emit(eventType, entry.data || entry, { source: 'telemetry' });
        }));
      }
    } catch (e) { /* telemetry not available */ }
  }

  if (opts.cluster) {
    try {
      const cluster = require('../cluster').getClusterManager();
      if (cluster && cluster.getEventBus) {
        const ce = cluster.getEventBus();
        if (ce) {
          unsubs.push(ce.on('*', (entry) => {
            const eventType = 'cluster.' + (entry.type || 'event');
            bus.emit(eventType, entry.data || entry, { source: 'cluster' });
          }));
        }
      }
    } catch (e) { /* cluster not available */ }
  }

  if (opts.ai) {
    try {
      const ai = require('../ai');
      if (ai && ai.getAIRouter) {
        const router = ai.getAIRouter();
        const originalGenerate = router.generate.bind(router);
        router.generate = async function(...args) {
          const correlationId = correlator ? args[0]?.correlationId || 'gen-' + Date.now() : null;
          if (correlator) correlator.startTrace(correlationId);
          await bus.emit('ai.generate.started', { model: args[0]?.model, context: args[0]?.context }, { source: 'ai', correlationId });
          try {
            const result = await originalGenerate(...args);
            await bus.emit('ai.generate.completed', { model: args[0]?.model, latency: result?.latency, success: true }, { source: 'ai', correlationId });
            return result;
          } catch (err) {
            await bus.emit('ai.generate.failed', { model: args[0]?.model, error: err.message }, { source: 'ai', correlationId });
            throw err;
          }
        };
      }
    } catch (e) { /* ai not available */ }
  }

  if (opts.intelligence) {
    try {
      const { getIntelligenceEngine, attachToEventBus } = require('./intelligence');
      const engine = getIntelligenceEngine();
      engine._eventBus = bus;
      const detach = attachToEventBus(bus, engine);
      unsubs.push(detach);
    } catch (e) { /* intelligence not available */ }
  }

  if (opts.agent) {
    try {
      const agents = require('../agents');
      if (agents && agents.getAgentOrchestrator) {
        const orch = agents.getAgentOrchestrator();
        if (orch && orch.events) {
          unsubs.push(orch.events.on('*', (entry) => {
            const eventType = 'agent.' + (entry.type || entry.data?.type || 'event');
            bus.emit(eventType, entry.data || entry, { source: 'agent' });
          }));
        }
      }
    } catch (e) { /* agents not available */ }
  }

  bus.emit('system.events.installed', { timestamp: Date.now() }, { source: 'system' });

  return { unsubs, bus, correlator };
}

function isInstalled() {
  return _hooksInstalled;
}

function resetHooks() {
  _hooksInstalled = false;
}

module.exports = { installEventHooks, isInstalled, resetHooks };
