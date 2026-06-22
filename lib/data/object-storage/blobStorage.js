class BlobStorage {
  constructor() {
    this._blobs = {};
  }

  store(key, data, options) {
    if (!key || data === undefined || data === null) return null;
    const opts = options || {};
    this._blobs[key] = {
      data,
      size: Buffer.byteLength(String(data)),
      mimetype: opts.mimetype || 'application/octet-stream',
      storedAt: Date.now()
    };
    return { key, size: this._blobs[key].size, mimetype: this._blobs[key].mimetype, storedAt: this._blobs[key].storedAt };
  }

  retrieve(key) {
    return this._blobs[key] ? { ...this._blobs[key] } : null;
  }

  delete(key) {
    delete this._blobs[key];
    return true;
  }

  list(prefix) {
    if (!prefix) return Object.keys(this._blobs);
    return Object.keys(this._blobs).filter(k => k.startsWith(prefix));
  }

  exists(key) {
    return key in this._blobs;
  }

  clear() {
    this._blobs = {};
  }
}

module.exports = { BlobStorage };
