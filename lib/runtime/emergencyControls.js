const { KillSwitchManager } = require('./killSwitchManager');

class EmergencyControls {
  constructor() {
    this._killSwitch = new KillSwitchManager();
    this._emergency = {
      active: false,
      activatedAt: null,
      reason: null,
      activatedBy: null
    };
    this._actionLog = [];
  }

  activateEmergency(reason) {
    if (!reason) {
      return false;
    }
    if (this._emergency.active) {
      return false;
    }
    this._emergency.active = true;
    this._emergency.activatedAt = Date.now();
    this._emergency.reason = reason;
    this._emergency.activatedBy = 'system';
    this._killSwitch.activate('global-emergency', reason);
    this._actionLog.push({ action: 'activate-emergency', target: 'global', timestamp: Date.now(), reason: reason });
    return true;
  }

  deactivateEmergency() {
    if (!this._emergency.active) {
      return false;
    }
    this._emergency.active = false;
    this._emergency.activatedAt = null;
    this._emergency.reason = null;
    this._emergency.activatedBy = null;
    this._killSwitch.deactivate('global-emergency');
    this._actionLog.push({ action: 'deactivate-emergency', target: 'global', timestamp: Date.now() });
    return true;
  }

  isEmergencyActive() {
    return this._emergency.active;
  }

  getEmergencyInfo() {
    return {
      active: this._emergency.active,
      activatedAt: this._emergency.activatedAt,
      reason: this._emergency.reason,
      activatedBy: this._emergency.activatedBy
    };
  }

  executeAction(action, target) {
    if (!action || !target) {
      return false;
    }
    const validActions = ['disable-service', 'block-traffic', 'restart-service', 'scale-down', 'isolate-node'];
    if (!validActions.includes(action)) {
      return false;
    }
    if (!this._emergency.active) {
      return false;
    }
    const entry = { action: action, target: target, timestamp: Date.now() };
    this._actionLog.push(entry);
    this._killSwitch.activate(target, 'Emergency action: ' + action);
    return true;
  }

  getActionLog() {
    return this._actionLog.slice();
  }

  clear() {
    this._emergency = { active: false, activatedAt: null, reason: null, activatedBy: null };
    this._actionLog = [];
    this._killSwitch.clear();
  }
}

module.exports = { EmergencyControls };
