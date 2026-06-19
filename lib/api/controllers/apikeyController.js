const { apiKeys } = require('../../saas');
const { success, created } = require('../responses');
const { NotFoundError } = require('../errors');
const { paginate } = require('../responses/pagination');

function listApiKeys(req, res) {
  const all = apiKeys.listKeys ? apiKeys.listKeys() : [];
  const userKeys = all.filter(k => k.userId === req.user?.id);
  const { page, limit, offset } = paginate(req, userKeys.length);
  const items = userKeys.slice(offset, offset + limit).map(k => ({ ...k, key: k.key ? `${k.key.slice(0, 8)}...` : null }));
  return success(res, items, {
    pagination: { page, limit, total: userKeys.length, totalPages: Math.ceil(userKeys.length / limit) },
  });
}

function createApiKey(req, res) {
  const { name, permissions, expiresInDays } = req.body;
  const result = apiKeys.createApiKey({
    name: name || 'API Key',
    userId: req.user?.id,
    organizationId: req.body.organizationId || null,
    permissions: permissions || ['projects:read'],
    expiresInDays: expiresInDays || null,
  });
  return created(res, result);
}

function revokeApiKey(req, res) {
  const result = apiKeys.revokeKey(req.params.id);
  if (!result) throw new NotFoundError(`API key "${req.params.id}" not found`);
  return success(res, { revoked: true });
}

module.exports = { listApiKeys, createApiKey, revokeApiKey };
