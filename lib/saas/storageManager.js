const fs = require('fs');
const path = require('path');

const DEFAULT_ROOT = path.resolve(__dirname, '../../data/storage');

const ADAPTERS = new Map();

function registerAdapter(name, adapter) {
  if (!name || !adapter) throw new Error('Adapter name and implementation required');
  if (typeof adapter.write !== 'function' || typeof adapter.read !== 'function') {
    throw new Error('Adapter must implement write() and read()');
  }
  ADAPTERS.set(name, adapter);
}

function getAdapter(name) {
  const adapter = ADAPTERS.get(name);
  if (!adapter) throw new Error(`Storage adapter "${name}" not found. Available: ${Array.from(ADAPTERS.keys()).join(', ')}`);
  return adapter;
}

const filesystemAdapter = {
  name: 'filesystem',
  write(relativePath, data, options = {}) {
    const fullPath = path.resolve(DEFAULT_ROOT, relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const encoding = options.encoding || 'utf-8';
    fs.writeFileSync(fullPath, data, encoding);
    return { success: true, path: fullPath, size: Buffer.byteLength(data, encoding) };
  },

  read(relativePath, options = {}) {
    const fullPath = path.resolve(DEFAULT_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return { success: false, error: 'File not found', path: fullPath };
    const encoding = options.encoding || 'utf-8';
    const data = fs.readFileSync(fullPath, encoding);
    return { success: true, data, path: fullPath };
  },

  delete(relativePath) {
    const fullPath = path.resolve(DEFAULT_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return { success: false, error: 'File not found' };
    fs.unlinkSync(fullPath);
    return { success: true };
  },

  list(relativePath) {
    const fullPath = path.resolve(DEFAULT_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return [];
    return fs.readdirSync(fullPath).map(entry => {
      const stat = fs.statSync(path.join(fullPath, entry));
      return { name: entry, isDirectory: stat.isDirectory(), size: stat.size };
    });
  },

  exists(relativePath) {
    return fs.existsSync(path.resolve(DEFAULT_ROOT, relativePath));
  },
};

registerAdapter('filesystem', filesystemAdapter);

module.exports = { registerAdapter, getAdapter, filesystemAdapter };
