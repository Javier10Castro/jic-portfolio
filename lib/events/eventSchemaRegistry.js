const SCHEMA_TYPES = ['object', 'string', 'number', 'boolean', 'array', 'any'];

class EventSchemaRegistry {
  constructor() {
    this._schemas = new Map();
    this._defaultSchemas = new Map();
  }

  registerSchema(eventType, schema) {
    if (!schema || !schema.properties) throw new Error(`Schema for ${eventType} must define properties`);
    this._schemas.set(eventType, schema);
  }

  getSchema(eventType) {
    return this._schemas.get(eventType) || this._defaultSchemas.get(eventType) || null;
  }

  validate(eventType, payload) {
    const schema = this.getSchema(eventType);
    if (!schema) return { valid: true, errors: [] };
    const errors = [];
    const props = schema.properties || {};

    for (const [key, rule] of Object.entries(props)) {
      if (rule.required && (payload[key] === undefined || payload[key] === null)) {
        errors.push(`${key} is required`);
        continue;
      }
      if (payload[key] !== undefined && rule.type) {
        const val = payload[key];
        if (rule.type === 'array' && !Array.isArray(val)) {
          errors.push(`${key} must be an array`);
        } else if (rule.type !== 'array' && rule.type !== 'any' && typeof val !== rule.type) {
          errors.push(`${key} must be of type ${rule.type}, got ${typeof val}`);
        }
      }
      if (rule.enum && !rule.enum.includes(payload[key])) {
        errors.push(`${key} must be one of: ${rule.enum.join(', ')}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  listSchemas() {
    const result = {};
    for (const [type, schema] of this._schemas) {
      result[type] = { properties: Object.keys(schema.properties || {}) };
    }
    return result;
  }

  registerDefault(eventType, schema) {
    this._defaultSchemas.set(eventType, schema);
  }

  hasSchema(eventType) {
    return this._schemas.has(eventType) || this._defaultSchemas.has(eventType);
  }

  removeSchema(eventType) {
    this._schemas.delete(eventType);
  }
}

module.exports = EventSchemaRegistry;
