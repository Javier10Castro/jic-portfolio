const path = require('path');

const PROVIDER_STORAGE = path.resolve(__dirname, '../../data/providers.json');
const fs = require('fs');

function _ensureStorage() {
  const dir = path.dirname(PROVIDER_STORAGE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(PROVIDER_STORAGE)) fs.writeFileSync(PROVIDER_STORAGE, '[]', 'utf-8');
}

const PROVIDERS = new Map();

function registerProvider(name, impl) {
  if (!name || typeof name !== 'string') throw new Error('Provider name must be a non-empty string');
  if (!impl || typeof impl.deploy !== 'function') throw new Error('Provider must implement deploy()');
  PROVIDERS.set(name.toLowerCase(), impl);
}

function getProvider(name) {
  if (!name) throw new Error('Provider name is required');
  const impl = PROVIDERS.get(name.toLowerCase());
  if (!impl) throw new Error(`Provider "${name}" is not registered. Available: ${listProviders().join(', ')}`);
  return impl;
}

function listProviders() {
  return Array.from(PROVIDERS.keys());
}

function providerHealth(name) {
  const impl = getProvider(name);
  if (typeof impl.health === 'function') return impl.health();
  return { provider: name, status: 'unknown', message: 'health() not implemented' };
}

module.exports = { registerProvider, getProvider, listProviders, providerHealth };
