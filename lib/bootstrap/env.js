let _initialized = false;

function initEnv() {
  if (_initialized) return true;
  _initialized = true;

  if (typeof process === 'undefined') return true;

  if (process.env.DATABASE_URL) return true;

  if (process.env.NODE_ENV === 'production') {
    throw _makeError(
      'ENV_MISSING_DATABASE_URL',
      'DATABASE_URL is required but not set',
      'Set DATABASE_URL in Vercel environment variables'
    );
  }

  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });
    if (process.env.DATABASE_URL) return true;
    dotenv.config({ path: '.env' });
  } catch {}

  if (!process.env.DATABASE_URL) {
    throw _makeError(
      'ENV_MISSING_DATABASE_URL',
      'DATABASE_URL is required but not set',
      'Add DATABASE_URL to .env.local, .env, or environment variables'
    );
  }

  return true;
}

function _makeError(code, message, hint) {
  const err = new Error(message);
  err.error = true;
  err.code = code;
  err.message = message;
  err.hint = hint || '';
  err.timestamp = new Date().toISOString();
  return err;
}

module.exports = { initEnv };
