let _bootstrapped = false;

function bootstrap() {
  if (_bootstrapped) return true;
  _bootstrapped = true;

  if (typeof process === 'undefined') return true;

  if (process.env.DATABASE_URL || process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production. Set it in Vercel environment variables.');
    }
    return true;
  }

  try {
    const dotenv = require('dotenv');
    dotenv.config();
  } catch {
    return process.env.DATABASE_URL ? true : false;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required. Set it in environment variables or create a .env file.'
    );
  }

  return true;
}

module.exports = bootstrap;
