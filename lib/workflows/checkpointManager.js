const crypto = require('crypto');

class CheckpointManager {
  constructor(storage) {
    this._storage = storage;
    this._checkpoints = new Map();
    this._sequence = 0;
  }

  async saveCheckpoint(workflowId, state) {
    const checkpoint = {
      id: `cp-${crypto.randomBytes(8).toString('hex')}-${Date.now().toString(36)}`,
      workflowId,
      sequence: ++this._sequence,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state)),
      completedNodes: [...(state.completedNodes || [])],
      currentNode: state.currentNode || null,
      errors: [...(state.errors || [])],
      outputs: JSON.parse(JSON.stringify(state.outputs || {})),
      metadata: {
        nodeCount: (state.completedNodes || []).length,
        totalNodes: state.totalNodes || 0,
        elapsed: state.elapsed || 0,
      },
    };

    this._checkpoints.set(checkpoint.id, checkpoint);
    if (this._storage) {
      await this._storage.saveCheckpoint(workflowId, checkpoint);
    }
    return checkpoint;
  }

  async loadCheckpoint(checkpointId) {
    if (this._checkpoints.has(checkpointId)) {
      return JSON.parse(JSON.stringify(this._checkpoints.get(checkpointId)));
    }
    if (this._storage) {
      const checkpoints = await this._storage.getCheckpoints('*');
      const found = checkpoints.find(c => c.id === checkpointId);
      if (found) return JSON.parse(JSON.stringify(found));
    }
    return null;
  }

  async loadLatestCheckpoint(workflowId) {
    const local = Array.from(this._checkpoints.values())
      .filter(c => c.workflowId === workflowId)
      .sort((a, b) => (b.sequence || 0) - (a.sequence || 0));

    if (local.length > 0) return JSON.parse(JSON.stringify(local[0]));

    if (this._storage) {
      const stored = await this._storage.getCheckpoints(workflowId);
      stored.sort((a, b) => (b.sequence || 0) - (a.sequence || 0));
      if (stored.length > 0) return JSON.parse(JSON.stringify(stored[0]));
    }
    return null;
  }

  async deleteCheckpoint(checkpointId) {
    this._checkpoints.delete(checkpointId);
    return true;
  }

  async deleteWorkflowCheckpoints(workflowId) {
    for (const [id, cp] of this._checkpoints) {
      if (cp.workflowId === workflowId) this._checkpoints.delete(id);
    }
    if (this._storage) {
      await this._storage.deleteCheckpoints(workflowId);
    }
    return true;
  }

  async listCheckpoints(workflowId) {
    let list = Array.from(this._checkpoints.values())
      .filter(c => c.workflowId === workflowId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (this._storage && list.length === 0) {
      const stored = await this._storage.getCheckpoints(workflowId);
      stored.sort((a, b) => b.timestamp - a.timestamp);
      list = stored;
    }
    return list;
  }
}

module.exports = CheckpointManager;
