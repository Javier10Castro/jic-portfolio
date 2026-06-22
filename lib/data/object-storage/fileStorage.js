const path = require('path');

class FileStorage {
  constructor() {
    this._files = {};
  }

  save(filename, data, options) {
    if (!filename || data === undefined || data === null) return null;
    const opts = options || {};
    this._files[filename] = {
      data,
      size: Buffer.byteLength(String(data)),
      extension: path.extname(filename),
      savedAt: Date.now(),
      metadata: opts.metadata || {}
    };
    return { filename, size: this._files[filename].size, extension: this._files[filename].extension, savedAt: this._files[filename].savedAt };
  }

  read(filename) {
    return this._files[filename] ? { ...this._files[filename] } : null;
  }

  delete(filename) {
    delete this._files[filename];
    return true;
  }

  list(directory) {
    const dir = directory || '';
    if (!dir) return Object.keys(this._files);
    return Object.keys(this._files).filter(f => f.startsWith(dir));
  }

  exists(filename) {
    return filename in this._files;
  }

  getInfo(filename) {
    if (!this._files[filename]) return null;
    const { data, ...info } = this._files[filename];
    return { ...info, filename };
  }

  clear() {
    this._files = {};
  }
}

module.exports = { FileStorage };
