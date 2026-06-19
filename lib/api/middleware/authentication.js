const saas = require('../../saas');
const { AuthenticationError } = require('../errors');
const { logger } = require('./logging');

const AUTH_HEADER = 'authorization';
const API_KEY_HEADER = 'x-api-key';
const BEARER_PREFIX = 'Bearer ';

function authenticate(req, res, next) {
  const authHeader = req.headers[AUTH_HEADER];
  const apiKey = req.headers[API_KEY_HEADER];

  if (apiKey) {
    return authenticateApiKey(apiKey, req, res, next);
  }

  if (authHeader && authHeader.startsWith(BEARER_PREFIX)) {
    const token = authHeader.slice(BEARER_PREFIX.length).trim();
    return authenticateBearer(token, req, res, next);
  }

  if (req.path === '/health' || req.path === '/ready' || req.path === '/live' || req.path === '/metrics') {
    req.user = null;
    req.workspace = null;
    return next();
  }

  return next(new AuthenticationError('Authentication required. Provide X-API-Key or Authorization: Bearer <token>'));
}

function authenticateApiKey(key, req, res, next) {
  try {
    const apiKeyRecord = saas.apiKeys.validateApiKey(key);
    if (!apiKeyRecord) {
      return next(new AuthenticationError('Invalid API key'));
    }
    const user = saas.userManager.getUser(apiKeyRecord.userId);
    if (!user) {
      return next(new AuthenticationError('API key user not found'));
    }
    req.user = user;
    req.authMethod = 'api_key';
    req.apiKeyRecord = apiKeyRecord;
    req.workspace = null;
    next();
  } catch (err) {
    next(new AuthenticationError('API key authentication failed', { error: err.message }));
  }
}

function authenticateBearer(token, req, res, next) {
  try {
    const session = saas.sessionManager.validateSession(token);
    if (!session) {
      return next(new AuthenticationError('Invalid or expired session token'));
    }
    const user = saas.userManager.getUser(session.userId);
    if (!user) {
      return next(new AuthenticationError('Session user not found'));
    }
    req.user = user;
    req.authMethod = 'bearer';
    req.session = session;
    req.workspace = saas.workspaceManager.listWorkspaces().find(w => w.ownerId === user.id) || null;
    next();
  } catch (err) {
    next(new AuthenticationError('Bearer authentication failed', { error: err.message }));
  }
}

module.exports = { authenticate, authenticateApiKey, authenticateBearer };
