class IntegrationSecrets {
  constructor({ storage }) {
    this._storage = storage;
  }

  store(provider, key, value) {
    const encoded = Buffer.from(value).toString('base64');
    this._storage.setNamespaced(provider, `secret:${key}`, encoded);
    return { success: true };
  }

  get(provider, key) {
    const encoded = this._storage.getNamespaced(provider, `secret:${key}`);
    if (!encoded) return null;
    return Buffer.from(encoded, 'base64').toString('utf8');
  }

  delete(provider, key) {
    this._storage.deleteNamespaced(provider, `secret:${key}`);
    return { success: true };
  }

  rotate(provider, key) {
    const newValue = [...Array(32)].map(() => Math.random().toString(36)[2]).join('');
    this.store(provider, key, newValue);
    return { success: true, value: newValue };
  }

  list(provider) {
    const data = this._storage.getProviderData(provider);
    const prefix = 'secret:';
    return Object.keys(data)
      .filter(k => k.startsWith(prefix))
      .map(k => k.slice(prefix.length));
  }

  clear() {
  }
}

module.exports = { IntegrationSecrets };
