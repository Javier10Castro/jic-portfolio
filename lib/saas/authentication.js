const crypto = require('crypto');
const userManager = require('./userManager');
const auditLog = require('./auditLog');

const PROVIDERS = new Map();

function registerProvider(name, impl) {
  if (!name || !impl) throw new Error('Provider name and implementation required');
  if (typeof impl.authenticate !== 'function') throw new Error('Auth provider must implement authenticate()');
  PROVIDERS.set(name.toLowerCase(), impl);
}

function getProvider(name) {
  const impl = PROVIDERS.get(name.toLowerCase());
  if (!impl) throw new Error(`Auth provider "${name}" not found. Available: ${listProviders().join(', ')}`);
  return impl;
}

function listProviders() {
  return Array.from(PROVIDERS.keys());
}

const emailProvider = {
  name: 'email',
  async authenticate({ email, password }) {
    if (!email || !password) return { success: false, error: 'email and password required' };
    if (password.length < 8) return { success: false, error: 'Invalid credentials' };
    const user = userManager.findByEmail(email);
    if (!user) return { success: false, error: 'User not found' };
    return { success: true, user, provider: 'email' };
  },
  async createAccount({ email, password, name }) {
    if (!email || !password) throw new Error('email and password required');
    if (password.length < 8) throw new Error('Password must be at least 8 characters');
    const user = userManager.createUser({ email, name, authProvider: 'email' });
    return { success: true, user };
  },
};

const githubProvider = {
  name: 'github',
  async authenticate({ code, clientId, clientSecret }) {
    const client_id = clientId || process.env.GITHUB_CLIENT_ID;
    const client_secret = clientSecret || process.env.GITHUB_CLIENT_SECRET;
    if (!client_id || !client_secret) {
      return { success: false, error: 'GitHub OAuth not configured', simulated: true };
    }
    return { success: true, simulated: true, user: null, provider: 'github', message: 'GitHub OAuth requires callback endpoint' };
  },
};

const googleProvider = {
  name: 'google',
  async authenticate({ code, clientId, clientSecret }) {
    const client_id = clientId || process.env.GOOGLE_CLIENT_ID;
    const client_secret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    if (!client_id || !client_secret) {
      return { success: false, error: 'Google OAuth not configured', simulated: true };
    }
    return { success: true, simulated: true, user: null, provider: 'google', message: 'Google OAuth requires callback endpoint' };
  },
};

registerProvider('email', emailProvider);
registerProvider('github', githubProvider);
registerProvider('google', googleProvider);

module.exports = { registerProvider, getProvider, listProviders, emailProvider, githubProvider, googleProvider };
