class FeatureFlagProvider {
  constructor(config) {
    this.name = config.name;
    this.flags = config.flags || [];
  }
  isEnabled(key, context) { return false; }
  getValue(key, defaultValue) { return defaultValue; }
  listFlags() { return this.flags; }
}
module.exports = { FeatureFlagProvider };
