const VALID_AUTH_TYPES = ['oauth2', 'oauth-pkce', 'pat', 'api-key', 'jwt', 'none'];

class IntegrationValidator {
  validate(provider, config) {
    const errors = [];

    if (!config) {
      return { valid: false, errors: ['Configuration is required'] };
    }

    if (!config.name) {
      errors.push('Missing required field: name');
    }

    if (!config.auth) {
      errors.push('Missing required field: auth');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const authResult = this.validateAuth(config.auth);
    if (!authResult.valid) {
      errors.push(...authResult.errors);
    }

    return { valid: errors.length === 0, errors };
  }

  validateAuth(auth) {
    const errors = [];

    if (!auth || !auth.type) {
      errors.push('Missing auth type');
      return { valid: false, errors };
    }

    if (!VALID_AUTH_TYPES.includes(auth.type)) {
      errors.push(`Invalid auth type '${auth.type}'. Must be one of: ${VALID_AUTH_TYPES.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }
}

module.exports = { IntegrationValidator };
