class ArchitectureIntegration {
  constructor(manager) {
    this._manager = manager;
  }

  get manager() {
    return this._manager;
  }

  clear() {
  }
}

module.exports = { ArchitectureIntegration };
