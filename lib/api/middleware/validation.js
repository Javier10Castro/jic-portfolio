const { ValidationError } = require('../errors');

function validate(schema) {
  return function validationMiddleware(req, res, next) {
    const errors = [];

    if (schema.headers) {
      for (const [field, rules] of Object.entries(schema.headers)) {
        const value = req.headers[field.toLowerCase()];
        const err = _check(field, value, rules, 'header');
        if (err) errors.push(err);
      }
    }

    if (schema.params) {
      for (const [field, rules] of Object.entries(schema.params)) {
        const value = req.params[field];
        const err = _check(field, value, rules, 'param');
        if (err) errors.push(err);
      }
    }

    if (schema.query) {
      for (const [field, rules] of Object.entries(schema.query)) {
        const value = req.query[field];
        const err = _check(field, value, rules, 'query');
        if (err) errors.push(err);
      }
    }

    if (schema.body) {
      if (!req.body || typeof req.body !== 'object') {
        errors.push({ field: 'body', message: 'Request body is required', source: 'body' });
      } else {
        for (const [field, rules] of Object.entries(schema.body)) {
          const value = req.body[field];
          const err = _check(field, value, rules, 'body');
          if (err) errors.push(err);
        }
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError('Validation failed', { fields: errors }));
    }

    next();
  };
}

function _check(field, value, rules, source) {
  if (rules.required && (value === undefined || value === null || value === '')) {
    return { field, message: `${field} is required`, source };
  }

  if (value === undefined || value === null) return null;

  if (rules.type) {
    if (rules.type === 'array' && !Array.isArray(value)) {
      return { field, message: `${field} must be an array`, source };
    }
    if (rules.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
      return { field, message: `${field} must be an object`, source };
    }
    if (['string', 'number', 'boolean'].includes(rules.type) && typeof value !== rules.type) {
      return { field, message: `${field} must be a ${rules.type}`, source, expected: rules.type, received: typeof value };
    }
  }

  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    return { field, message: `${field} must be at least ${rules.minLength} characters`, source };
  }
  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    return { field, message: `${field} must be at most ${rules.maxLength} characters`, source };
  }
  if (rules.pattern && typeof value === 'string' && !new RegExp(rules.pattern).test(value)) {
    return { field, message: `${field} format is invalid`, source, pattern: rules.pattern };
  }
  if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
    return { field, message: `${field} must be at least ${rules.min}`, source };
  }
  if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
    return { field, message: `${field} must be at most ${rules.max}`, source };
  }
  if (rules.enum && !rules.enum.includes(value)) {
    return { field, message: `${field} must be one of: ${rules.enum.join(', ')}`, source, allowed: rules.enum };
  }

  return null;
}

module.exports = { validate };
