const request = require('supertest');
const assert = require('assert');
const { createApp } = require('../lib/api/server');
const saas = require('../lib/saas');

const TEST_USER_EMAIL = 'api-test@example.com';
const TEST_USER_NAME = 'API Test User';
let validApiKey = '';

describe('Platform API', function() {
  let app;

  before(() => {
    app = createApp({ rateLimit: { maxRequests: 10000 }, cors: { allowedOrigins: ['*'] } });

    let user = saas.userManager.findByEmail(TEST_USER_EMAIL);
    if (!user) {
      user = saas.userManager.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    }
    const key = saas.apiKeys.createApiKey({
      name: 'Test Key',
      userId: user.id,
      permissions: ['projects:read', 'projects:create', 'projects:update', 'projects:delete', 'deployments:read', 'deployments:create', 'deployments:rollback', 'apiKeys:read', 'apiKeys:create', 'apiKeys:revoke'],
      expiresInDays: 1,
    });
    validApiKey = key.key;
  });

  describe('GET /api/v1/health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/api/v1/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'ok');
      assert(res.body.requestId);
      assert(res.body.meta.timestamp);
    });
  });

  describe('GET /api/v1/ready', () => {
    it('returns 200 with ready status', async () => {
      const res = await request(app).get('/api/v1/ready');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'ready');
    });
  });

  describe('GET /api/v1/live', () => {
    it('returns 200 with alive status', async () => {
      const res = await request(app).get('/api/v1/live');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'alive');
    });
  });

  describe('GET /api/v1/metrics', () => {
    it('returns 200 with process metrics', async () => {
      const res = await request(app).get('/api/v1/metrics');
      assert.strictEqual(res.status, 200);
      assert(res.body.data);
      assert(typeof res.body.data.uptime === 'number');
      assert(res.body.data.memory);
      assert(res.body.data.nodeVersion);
    });
  });

  describe('Authentication', () => {
    it('returns 401 when no auth header on protected route', async () => {
      const res = await request(app).get('/api/v1/conversations');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert(res.body.errors[0].code, 'AuthenticationError');
    });

    it('returns 401 with invalid API key', async () => {
      const res = await request(app)
        .get('/api/v1/conversations')
        .set('X-API-Key', 'invalid-key-12345');
      assert.strictEqual(res.status, 401);
    });

    it('returns 401 with invalid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/conversations')
        .set('Authorization', 'Bearer invalid-token');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('CORS', () => {
    it('returns CORS headers', async () => {
      const res = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'http://localhost:3000');
      assert.strictEqual(res.status, 204);
    });
  });

  describe('Validation', () => {
    it('returns 400 when creating conversation without body', async () => {
      const res = await request(app)
        .post('/api/v1/conversations')
        .set('X-API-Key', validApiKey)
        .send({});
      assert.strictEqual(res.status, 400);
    });

    it('returns 400 when required fields missing', async () => {
      const res = await request(app)
        .post('/api/v1/generate')
        .set('X-API-Key', validApiKey)
        .send({});
      assert.strictEqual(res.status, 400);
      assert(res.body.errors[0].details.fields);
    });
  });

  describe('404 handling', () => {
    it('returns 404 for unknown resource', async () => {
      const res = await request(app)
        .get('/api/v1/conversations/nonexistent-id-12345')
        .set('X-API-Key', validApiKey);
      assert.strictEqual(res.status, 404);
    });
  });

  describe('Response format', () => {
    it('returns standardized response shape on success', async () => {
      const res = await request(app).get('/api/v1/health');
      assert('success' in res.body);
      assert('data' in res.body);
      assert('errors' in res.body);
      assert('meta' in res.body);
      assert('requestId' in res.body);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.errors, null);
    });

    it('returns standardized response shape on error', async () => {
      const res = await request(app).get('/api/v1/conversations');
      assert('success' in res.body);
      assert('data' in res.body);
      assert('errors' in res.body);
      assert('meta' in res.body);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.data, null);
    });
  });

  describe('Rate limit headers', () => {
    it('includes rate limit headers on responses', async () => {
      const res = await request(app).get('/api/v1/health');
      assert('x-ratelimit-limit' in res.headers);
      assert('x-ratelimit-remaining' in res.headers);
    });
  });

  describe('Request ID', () => {
    it('echoes x-request-id from client', async () => {
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-Request-Id', 'my-custom-id');
      assert.strictEqual(res.body.requestId, 'my-custom-id');
    });

    it('generates requestId when none provided', async () => {
      const res = await request(app).get('/api/v1/health');
      assert(res.body.requestId);
      assert(res.body.requestId.startsWith('req-'));
    });
  });

  describe('Pipeline endpoints (unauthenticated edge cases)', () => {
    it('returns 401 on pipeline run without auth', async () => {
      const res = await request(app)
        .post('/api/v1/pipeline/run')
        .send({ conversationId: 'test' });
      assert.strictEqual(res.status, 401);
    });
  });

  describe('Error response structure', () => {
    it('errors array has code, message, details', async () => {
      const res = await request(app).get('/api/v1/conversations');
      const error = res.body.errors[0];
      assert(error.code);
      assert(error.message);
      assert('details' in error);
    });
  });
});
