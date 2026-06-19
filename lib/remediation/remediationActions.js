const ACTIONS = {
  auto_scale: {
    key: 'auto_scale',
    label: 'Auto-scale Cluster',
    description: 'Adjust cluster worker count up or down',
    category: 'scaling',
    destructive: false,
    reversible: true,
    params: {
      direction: { type: 'string', enum: ['up', 'down'], default: 'up', required: true },
      amount: { type: 'number', default: 1, min: 1, max: 20, required: true },
      maxWorkers: { type: 'number', default: 20, min: 1 },
      minWorkers: { type: 'number', default: 1, min: 0 },
    },
  },
  reroute_traffic: {
    key: 'reroute_traffic',
    label: 'Reroute AI Traffic',
    description: 'Switch AI traffic to an alternative provider',
    category: 'routing',
    destructive: false,
    reversible: true,
    params: {
      targetProvider: { type: 'string', required: true },
      reason: { type: 'string' },
    },
  },
  retry_with_backoff: {
    key: 'retry_with_backoff',
    label: 'Retry with Adjusted Backoff',
    description: 'Retry failed tasks with modified backoff parameters',
    category: 'recovery',
    destructive: false,
    reversible: false,
    params: {
      taskIds: { type: 'array', items: 'string', default: [] },
      workflowIds: { type: 'array', items: 'string', default: [] },
      backoffMultiplier: { type: 'number', default: 3, min: 1, max: 10 },
      maxRetries: { type: 'number', default: 5, min: 1, max: 20 },
      jitter: { type: 'boolean', default: true },
    },
  },
  isolate_node: {
    key: 'isolate_node',
    label: 'Isolate Node',
    description: 'Remove a node from active rotation to prevent further failures',
    category: 'safety',
    destructive: true,
    reversible: true,
    params: {
      nodeId: { type: 'string', required: true },
      reason: { type: 'string' },
      drainFirst: { type: 'boolean', default: true },
    },
  },
  circuit_breaker: {
    key: 'circuit_breaker',
    label: 'Enable Circuit Breaker',
    description: 'Open circuit breaker for a degraded provider or service',
    category: 'safety',
    destructive: false,
    reversible: true,
    params: {
      target: { type: 'string', required: true },
      type: { type: 'string', enum: ['provider', 'service', 'endpoint'], default: 'provider' },
      cooldownMs: { type: 'number', default: 60000, min: 10000 },
    },
  },
  rate_limit: {
    key: 'rate_limit',
    label: 'Apply Rate Limiting',
    description: 'Throttle request rate to a service or provider',
    category: 'traffic_management',
    destructive: false,
    reversible: true,
    params: {
      target: { type: 'string', required: true },
      maxRps: { type: 'number', default: 10, min: 1, max: 1000 },
      durationMs: { type: 'number', default: 300000, min: 60000 },
    },
  },
  restart_worker: {
    key: 'restart_worker',
    label: 'Restart Worker',
    description: 'Restart or recycle a misbehaving worker process',
    category: 'recovery',
    destructive: true,
    reversible: false,
    params: {
      workerId: { type: 'string', required: true },
      graceful: { type: 'boolean', default: true },
      timeoutMs: { type: 'number', default: 30000, min: 5000 },
    },
  },
  notify: {
    key: 'notify',
    label: 'Send Notification',
    description: 'Send an alert or notification about a system condition',
    category: 'alerting',
    destructive: false,
    reversible: false,
    params: {
      channel: { type: 'string', default: 'log', enum: ['log', 'alert', 'webhook', 'email'] },
      severity: { type: 'string', default: 'info', enum: ['info', 'warning', 'error', 'critical'] },
      message: { type: 'string', required: true },
    },
  },
};

class RemediationActions {
  constructor(options = {}) {
    this._actionHandlers = this._buildDefaultHandlers();
    this._customHandlers = new Map();
    this._inFlight = new Set();
    this._maxConcurrentActions = options.maxConcurrentActions || 10;
  }

  getRegisteredActions() {
    const builtin = Object.keys(ACTIONS);
    const custom = Array.from(this._customHandlers.keys());
    return [...builtin, ...custom];
  }

  getActionMeta(key) {
    if (ACTIONS[key]) return { key, ...ACTIONS[key] };
    const custom = this._customHandlers.get(key);
    if (custom) return { key, ...custom.meta };
    return null;
  }

  getAllActionMeta() {
    return Object.entries(ACTIONS).map(([k, v]) => ({ key: k, ...v }));
  }

  registerAction(key, handler, meta = {}) {
    if (this._customHandlers.has(key)) {
      throw new Error(`Action '${key}' is already registered`);
    }
    this._customHandlers.set(key, { handler, meta: { key, label: meta.label || key, description: meta.description || '', category: meta.category || 'custom', destructive: !!meta.destructive, reversible: !!meta.reversible, params: meta.params || {}, custom: true } });
  }

  async execute(actionKey, params = {}, context = {}) {
    const meta = ACTIONS[actionKey] || this._customHandlers.get(actionKey)?.meta;
    if (!meta) throw new Error(`Unknown action: ${actionKey}`);

    if (this._inFlight.size >= this._maxConcurrentActions) {
      throw new Error(`Too many concurrent actions (max: ${this._maxConcurrentActions})`);
    }

    const actionId = 'action-' + Math.random().toString(36).substring(2, 10);
    this._inFlight.add(actionId);

    try {
      const sanitized = this._sanitizeParams(meta.params, params);
      const start = Date.now();

      let result;
      if (this._customHandlers.has(actionKey)) {
        result = await this._customHandlers.get(actionKey).handler(sanitized, context);
      } else if (this._actionHandlers[actionKey]) {
        result = await this._actionHandlers[actionKey](sanitized, context);
      } else {
        result = { success: true, simulated: true, message: `Action '${actionKey}' executed (simulated mode)` };
      }

      return {
        actionId,
        action: actionKey,
        params: sanitized,
        success: result.success !== false,
        simulated: result.simulated || false,
        message: result.message || `${actionKey} completed`,
        result: result.data || null,
        duration: Date.now() - start,
        timestamp: Date.now(),
      };
    } catch (err) {
      return {
        actionId,
        action: actionKey,
        params,
        success: false,
        simulated: false,
        message: err.message,
        error: err.message,
        duration: 0,
        timestamp: Date.now(),
      };
    } finally {
      this._inFlight.delete(actionId);
    }
  }

  isInFlight(actionId) {
    return this._inFlight.has(actionId);
  }

  getInFlightCount() {
    return this._inFlight.size;
  }

  _sanitizeParams(schema, params) {
    if (!schema) return params;
    const result = {};
    for (const [key, def] of Object.entries(schema)) {
      if (params[key] !== undefined && params[key] !== null) {
        result[key] = params[key];
      } else if (def.default !== undefined) {
        result[key] = def.default;
      } else if (def.required) {
        throw new Error(`Missing required parameter: ${key}`);
      }
    }
    return result;
  }

  _buildDefaultHandlers() {
    return {
      auto_scale: async (params) => ({
        success: true,
        simulated: true,
        data: { workersAdded: params.direction === 'up' ? params.amount : 0, workersRemoved: params.direction === 'down' ? params.amount : 0 },
      }),
      reroute_traffic: async (params) => ({
        success: true,
        simulated: true,
        data: { switchedTo: params.targetProvider },
      }),
      retry_with_backoff: async (params) => ({
        success: true,
        simulated: true,
        data: { retriedTasks: params.taskIds.length, retriedWorkflows: params.workflowIds.length, backoffMultiplier: params.backoffMultiplier },
      }),
      isolate_node: async (params) => ({
        success: true,
        simulated: true,
        data: { nodeId: params.nodeId, drained: params.drainFirst },
      }),
      circuit_breaker: async (params) => ({
        success: true,
        simulated: true,
        data: { target: params.target, circuitOpen: true },
      }),
      rate_limit: async (params) => ({
        success: true,
        simulated: true,
        data: { target: params.target, maxRps: params.maxRps },
      }),
      restart_worker: async (params) => ({
        success: true,
        simulated: true,
        data: { workerId: params.workerId, graceful: params.graceful },
      }),
      notify: async (params) => ({
        success: true,
        simulated: true,
        data: { sent: true, channel: params.channel },
      }),
    };
  }

  clear() {
    this._inFlight.clear();
  }
}

module.exports = { RemediationActions, ACTIONS };
