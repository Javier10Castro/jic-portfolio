const crypto = require('crypto');

class DeviceManager {
  constructor() {
    this._devices = new Map();
    this._trustedDevices = new Map();
  }

  register(deviceInfo) {
    const fingerprint = this._generateFingerprint(deviceInfo);
    const id = `dev-${crypto.randomUUID().substring(0, 8)}`;
    const device = {
      id, fingerprint,
      userId: deviceInfo.userId,
      name: deviceInfo.name || 'Unknown Device',
      type: deviceInfo.type || 'unknown',
      os: deviceInfo.os || 'unknown',
      browser: deviceInfo.browser || 'unknown',
      ip: deviceInfo.ip || '0.0.0.0',
      userAgent: deviceInfo.userAgent || '',
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      trusted: false,
      status: 'active'
    };
    this._devices.set(id, device);
    return device;
  }

  update(id, updates) {
    const device = this._devices.get(id);
    if (!device) return null;
    Object.assign(device, updates, { lastSeen: Date.now() });
    return device;
  }

  get(id) {
    return this._devices.get(id) || null;
  }

  findByFingerprint(fingerprint) {
    for (const device of this._devices.values()) {
      if (device.fingerprint === fingerprint) return device;
    }
    return null;
  }

  listByUser(userId) {
    return Array.from(this._devices.values()).filter(d => d.userId === userId);
  }

  trustDevice(deviceId) {
    const device = this._devices.get(deviceId);
    if (!device) return false;
    device.trusted = true;
    this._trustedDevices.set(deviceId, { deviceId, trustedAt: Date.now() });
    return true;
  }

  revokeTrust(deviceId) {
    const device = this._devices.get(deviceId);
    if (!device) return false;
    device.trusted = false;
    this._trustedDevices.delete(deviceId);
    return true;
  }

  isTrusted(deviceId) {
    return this._trustedDevices.has(deviceId);
  }

  removeDevice(id) {
    this._trustedDevices.delete(id);
    return this._devices.delete(id);
  }

  getStats() {
    const devices = Array.from(this._devices.values());
    return {
      total: devices.length,
      trusted: devices.filter(d => d.trusted).length,
      byType: this._countBy(devices, 'type'),
      byOs: this._countBy(devices, 'os')
    };
  }

  _generateFingerprint(info) {
    const raw = `${info.userAgent || ''}|${info.ip || ''}|${info.os || ''}|${info.browser || ''}`;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  _countBy(items, field) {
    const counts = {};
    for (const item of items) {
      const key = item[field] || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  clear() {
    this._devices.clear();
    this._trustedDevices.clear();
  }
}

module.exports = { DeviceManager };
