class ResourceAllocator {
  constructor() {
    this._allocations = new Map();
    this._counter = 0;
  }

  allocate(compositionId, requirements = {}) {
    if (!compositionId) {
      throw new Error('compositionId is required');
    }

    const allocation = {
      id: compositionId,
      cpu: requirements.cpu || 1,
      memory: requirements.memory || 512,
      storage: requirements.storage || 1024,
      instances: requirements.instances || 1,
      status: 'allocated',
      allocatedAt: new Date().toISOString()
    };

    this._allocations.set(compositionId, allocation);
    return allocation;
  }

  getAllocation(compositionId) {
    if (!compositionId) return null;
    return this._allocations.get(compositionId) || null;
  }

  release(compositionId) {
    if (!compositionId) return false;
    const allocation = this._allocations.get(compositionId);
    if (!allocation) return false;
    allocation.status = 'released';
    return true;
  }

  estimate(requirements = {}) {
    return {
      cpu: requirements.cpu || 1,
      memory: requirements.memory || 512,
      storage: requirements.storage || 1024,
      instances: requirements.instances || 1,
      estimated: true,
      estimatedAt: new Date().toISOString()
    };
  }

  clear() {
    this._allocations.clear();
    this._counter = 0;
  }
}

module.exports = { ResourceAllocator };
