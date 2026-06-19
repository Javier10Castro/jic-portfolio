const { AuthorizationError } = require('../errors');

const DEFAULT_ROLE = 'owner';

function authorize(resource, action) {
  return function authorizationMiddleware(req, res, next) {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required before authorization'));
    }

    let role = DEFAULT_ROLE;

    if (req.workspace) {
      role = req.workspace.ownerId === req.user.id ? 'owner' : 'viewer';
    } else if (req.user.role) {
      role = req.user.role;
    }

    req.userRole = role;

    const saas = require('../../saas');
    if (!saas.authorization.can(role, resource, action)) {
      return next(new AuthorizationError(`Role "${role}" cannot ${action} on "${resource}"`));
    }

    next();
  };
}

function requireRole(...roles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }
    const userRole = req.userRole || req.user.role;
    if (!roles.includes(userRole)) {
      return next(new AuthorizationError(`Requires one of [${roles.join(', ')}], got "${userRole}"`));
    }
    next();
  };
}

module.exports = { authorize, requireRole };
