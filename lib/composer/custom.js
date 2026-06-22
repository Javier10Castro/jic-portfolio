class Custom {
  getName() {
    return 'Custom';
  }

  getDescription() {
    return 'A custom application template';
  }

  getModules() {
    return [];
  }

  getCapabilities() {
    return [];
  }

  getConfig() {
    return {};
  }

  apply(customizations) {
    return customizations || {};
  }
}

module.exports = { Custom };
