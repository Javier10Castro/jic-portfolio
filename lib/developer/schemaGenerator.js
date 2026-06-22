class SchemaGenerator {
  constructor() { this._schemas = {}; }

  generate(domain) {
    const schemas = {
      project: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, createdAt: { type: 'string', format: 'date-time' } }, required: ['id', 'name'] },
      deployment: { type: 'object', properties: { id: { type: 'string' }, projectId: { type: 'string' }, status: { type: 'string', enum: ['pending', 'running', 'success', 'failed'] }, url: { type: 'string' } }, required: ['id', 'projectId', 'status'] },
      plugin: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, version: { type: 'string' }, type: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } } }, required: ['id', 'name', 'version'] },
      integration: { type: 'object', properties: { provider: { type: 'string' }, status: { type: 'string', enum: ['connected', 'disconnected', 'error'] }, connectedAt: { type: 'string', format: 'date-time' } }, required: ['provider', 'status'] },
      workflow: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, steps: { type: 'array', items: { type: 'object' } }, status: { type: 'string' } }, required: ['id', 'name'] },
      billing: { type: 'object', properties: { plan: { type: 'string' }, status: { type: 'string' }, amount: { type: 'number' }, interval: { type: 'string' } }, required: ['plan', 'status'] }
    };
    if (domain && schemas[domain]) {
      this._schemas[domain] = schemas[domain];
      return { success: true, schema: schemas[domain] };
    }
    this._schemas = { ...this._schemas, ...schemas };
    return { success: true, schemas };
  }

  getSchema(name) { return this._schemas[name] || null; }
  getCount() { return Object.keys(this._schemas).length; }
  clear() { this._schemas = {}; }
}

module.exports = { SchemaGenerator };
