const assert = require('assert');

describe('API Error Classes', () => {
  const { ApiError, AuthenticationError, AuthorizationError, ValidationError, RateLimitError, NotFoundError } = require('../lib/api/errors');

  it('ApiError has correct defaults', () => {
    const err = new ApiError('test');
    assert.strictEqual(err.message, 'test');
    assert.strictEqual(err.statusCode, 500);
    assert.strictEqual(err.isApiError, true);
    assert(err instanceof Error);
  });

  it('ApiError accepts custom status and details', () => {
    const err = new ApiError('custom', 418, { teapot: true });
    assert.strictEqual(err.statusCode, 418);
    assert.deepStrictEqual(err.details, { teapot: true });
  });

  it('ApiError.toJSON returns expected shape', () => {
    const err = new ApiError('msg', 400, { field: 'x' });
    const json = err.toJSON();
    assert.strictEqual(json.code, 'ApiError');
    assert.strictEqual(json.message, 'msg');
    assert.strictEqual(json.statusCode, 400);
    assert.deepStrictEqual(json.details, { field: 'x' });
  });

  it('AuthenticationError has 401 status', () => {
    const err = new AuthenticationError();
    assert.strictEqual(err.statusCode, 401);
    assert.strictEqual(err.message, 'Authentication required');
  });

  it('AuthorizationError has 403 status', () => {
    const err = new AuthorizationError();
    assert.strictEqual(err.statusCode, 403);
    assert.strictEqual(err.message, 'Insufficient permissions');
  });

  it('ValidationError has 400 status', () => {
    const err = new ValidationError();
    assert.strictEqual(err.statusCode, 400);
    assert.strictEqual(err.message, 'Validation failed');
  });

  it('RateLimitError has 429 status', () => {
    const err = new RateLimitError();
    assert.strictEqual(err.statusCode, 429);
    assert.strictEqual(err.message, 'Rate limit exceeded');
  });

  it('NotFoundError has 404 status', () => {
    const err = new NotFoundError();
    assert.strictEqual(err.statusCode, 404);
    assert.strictEqual(err.message, 'Resource not found');
  });
});

describe('API Response Helpers', () => {
  const { success, created, noContent, error } = require('../lib/api/responses/apiResponse');
  const { ValidationError } = require('../lib/api/errors');

  let res;
  let capturedStatus;
  let capturedBody;

  beforeEach(() => {
    capturedStatus = null;
    capturedBody = null;
    res = {
      requestId: 'req-test',
      status(code) { capturedStatus = code; return this; },
      json(body) { capturedBody = body; },
      send() { capturedBody = true; },
    };
  });

  it('success returns 200 with correct shape', () => {
    success(res, { id: 1 }, { page: 1 });
    assert.strictEqual(capturedStatus, 200);
    assert.strictEqual(capturedBody.success, true);
    assert.deepStrictEqual(capturedBody.data, { id: 1 });
    assert.strictEqual(capturedBody.errors, null);
    assert.strictEqual(capturedBody.requestId, 'req-test');
  });

  it('created returns 201', () => {
    created(res, { id: 1 });
    assert.strictEqual(capturedStatus, 201);
  });

  it('noContent returns 204', () => {
    noContent(res);
    assert.strictEqual(capturedStatus, 204);
  });

  it('error returns correct error shape', () => {
    const apiErr = new ValidationError('Invalid', { fields: ['name'] });
    error(res, apiErr);
    assert.strictEqual(capturedStatus, 400);
    assert.strictEqual(capturedBody.success, false);
    assert.strictEqual(capturedBody.data, null);
    assert(capturedBody.errors[0].code);
    assert(capturedBody.errors[0].message);
  });
});

describe('Validation Middleware', () => {
  const { validate } = require('../lib/api/middleware/validation');
  const { ValidationError } = require('../lib/api/errors');

  let req, res;

  beforeEach(() => {
    req = { headers: {}, params: {}, query: {}, body: {} };
    res = {};
  });

  function runValidation(schema, reqObj) {
    return new Promise((resolve, reject) => {
      const mw = validate(schema);
      mw(Object.assign(req, reqObj), res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  it('passes when required fields present', async () => {
    await runValidation(
      { body: { name: { required: true, type: 'string' } } },
      { body: { name: 'test' } }
    );
  });

  it('fails when required field missing', async () => {
    try {
      await runValidation(
        { body: { name: { required: true } } },
        { body: {} }
      );
      assert.fail('should have thrown');
    } catch (err) {
      assert(err instanceof ValidationError);
      assert(err.details.fields[0].field === 'name');
    }
  });

  it('fails when type does not match', async () => {
    try {
      await runValidation(
        { body: { count: { required: true, type: 'number' } } },
        { body: { count: 'not-a-number' } }
      );
      assert.fail('should have thrown');
    } catch (err) {
      assert(err instanceof ValidationError);
    }
  });

  it('fails when string too short', async () => {
    try {
      await runValidation(
        { body: { name: { required: true, type: 'string', minLength: 3 } } },
        { body: { name: 'ab' } }
      );
      assert.fail('should have thrown');
    } catch (err) {
      assert(err instanceof ValidationError);
    }
  });

  it('validates enums', async () => {
    try {
      await runValidation(
        { query: { status: { enum: ['active', 'inactive'] } } },
        { query: { status: 'deleted' } }
      );
      assert.fail('should have thrown');
    } catch (err) {
      assert(err instanceof ValidationError);
    }
  });
});

describe('Rate Limiter Middleware', () => {
  const rateLimiter = require('../lib/api/middleware/rateLimiter');
  const { RateLimitError } = require('../lib/api/errors');

  it('allows requests under limit', (done) => {
    const mw = rateLimiter({ maxRequests: 5, windowMs: 60000 });
    const req = { ip: '127.0.0.1', headers: {} };
    const res = { setHeader() {} };
    mw(req, res, (err) => {
      assert(!err);
      done();
    });
  });
});

describe('Request ID Middleware', () => {
  const requestId = require('../lib/api/middleware/requestId');

  it('generates requestId when none provided', (done) => {
    const req = { headers: {} };
    const res = { setHeader() {} };
    requestId(req, res, () => {
      assert(req.requestId);
      assert(req.requestId.startsWith('req-'));
      done();
    });
  });

  it('uses x-request-id from headers', (done) => {
    const req = { headers: { 'x-request-id': 'custom-id' } };
    const res = { setHeader() {} };
    requestId(req, res, () => {
      assert.strictEqual(req.requestId, 'custom-id');
      done();
    });
  });
});
