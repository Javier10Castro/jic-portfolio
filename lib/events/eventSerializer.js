const EVENT_SOURCES = ['api', 'ai', 'agent', 'workflow', 'cluster', 'telemetry', 'system', 'custom'];

class EventSerializer {
  static normalize(type, payload, options = {}) {
    if (!type) throw new Error('Event type is required');
    return {
      id: options.id || 'evt-' + Math.random().toString(36).substring(2, 14),
      type,
      timestamp: options.timestamp || Date.now(),
      source: options.source || 'system',
      payload: payload || {},
      correlationId: options.correlationId || null,
      version: options.version || 1,
      severity: options.severity || 'info',
      metadata: options.metadata || {},
    };
  }

  static serialize(event) {
    return JSON.stringify(event);
  }

  static deserialize(json) {
    if (typeof json === 'string') return JSON.parse(json);
    return json;
  }

  static validate(event) {
    if (!event || typeof event !== 'object') return { valid: false, errors: ['Event must be an object'] };
    const errors = [];
    if (!event.id) errors.push('id is required');
    if (!event.type) errors.push('type is required');
    if (!event.timestamp) errors.push('timestamp is required');
    if (event.source && !EVENT_SOURCES.includes(event.source) && !event.source.startsWith('custom.')) {
      errors.push(`Invalid source: ${event.source}`);
    }
    return { valid: errors.length === 0, errors };
  }

  static clone(event) {
    return JSON.parse(JSON.stringify(event));
  }
}

module.exports = { EventSerializer, EVENT_SOURCES };
