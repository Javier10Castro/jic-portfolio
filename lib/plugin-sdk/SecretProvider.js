class SecretProvider {
  constructor(config) {
    this.name = config.name;
    this.type = config.type || 'vault';
  }
  getSecret(key) { return null; }
  setSecret(key, value) { return false; }
  rotateSecret(key) { return { key, rotated: true, timestamp: Date.now() }; }
}
module.exports = { SecretProvider };
