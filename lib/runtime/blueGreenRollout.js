class BlueGreenRollout {
  constructor() {
    this._deployments = {};
  }

  startBlueGreen(config) {
    if (!config || !config.service || !config.blueVersion || !config.greenVersion) {
      return null;
    }
    if (this._deployments[config.service]) {
      return null;
    }
    const deployment = {
      name: config.service,
      service: config.service,
      blueVersion: config.blueVersion,
      greenVersion: config.greenVersion,
      active: config.active || 'blue',
      trafficPercent: config.active === 'green' ? 0 : 100,
      createdAt: Date.now()
    };
    this._deployments[config.service] = deployment;
    return { name: deployment.name, blueVersion: deployment.blueVersion, greenVersion: deployment.greenVersion, active: deployment.active };
  }

  switchToGreen(name) {
    if (!name) {
      return false;
    }
    const deployment = this._deployments[name];
    if (!deployment) {
      return false;
    }
    if (deployment.active === 'green') {
      return false;
    }
    deployment.active = 'green';
    deployment.trafficPercent = 0;
    return true;
  }

  switchToBlue(name) {
    if (!name) {
      return false;
    }
    const deployment = this._deployments[name];
    if (!deployment) {
      return false;
    }
    if (deployment.active === 'blue') {
      return false;
    }
    deployment.active = 'blue';
    deployment.trafficPercent = 100;
    return true;
  }

  getStatus(name) {
    if (!name) {
      return null;
    }
    const deployment = this._deployments[name];
    if (!deployment) {
      return null;
    }
    return {
      active: deployment.active,
      blue: deployment.blueVersion,
      green: deployment.greenVersion,
      trafficPercent: deployment.active === 'blue' ? 100 : 0
    };
  }

  clear() {
    this._deployments = {};
  }
}

module.exports = { BlueGreenRollout };
