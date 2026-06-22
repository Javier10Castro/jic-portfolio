class DependencyResolver {
  constructor() {
    this._resolutions = new Map();
    this._counter = 0;
  }

  resolve(compositionId, nodes) {
    if (!compositionId || !Array.isArray(nodes)) {
      throw new Error('compositionId and nodes array are required');
    }

    const nodeMap = new Map();
    for (const node of nodes) {
      if (!node.id) continue;
      nodeMap.set(node.id, {
        id: node.id,
        dependencies: Array.isArray(node.dependencies) ? node.dependencies : []
      });
    }

    const visited = new Set();
    const inStack = new Set();
    const order = [];
    const cycles = [];
    let hasCycle = false;

    const dfs = (nodeId, path) => {
      if (inStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart);
        cycles.push(cycle);
        hasCycle = true;
        return;
      }
      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      inStack.add(nodeId);
      path.push(nodeId);

      const node = nodeMap.get(nodeId);
      if (node) {
        for (const dep of node.dependencies) {
          if (nodeMap.has(dep)) {
            dfs(dep, path);
          }
        }
      }

      path.pop();
      inStack.delete(nodeId);
      order.push(nodeId);
    };

    for (const [nodeId] of nodeMap) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    const result = hasCycle
      ? { resolved: false, order: [], cycles }
      : { resolved: true, order, cycles: [] };

    this._resolutions.set(compositionId, result);
    return result;
  }

  validateDependencies(nodes) {
    if (!Array.isArray(nodes)) {
      return { valid: false, issues: ['nodes must be an array'] };
    }

    const issues = [];
    const nodeIds = new Set();
    for (const node of nodes) {
      if (node.id) {
        nodeIds.add(node.id);
      } else {
        issues.push('node without id found');
      }
    }

    for (const node of nodes) {
      if (node.id && Array.isArray(node.dependencies)) {
        for (const dep of node.dependencies) {
          if (!nodeIds.has(dep)) {
            issues.push(`node '${node.id}' depends on missing node '${dep}'`);
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  getResolutionOrder(compositionId) {
    if (!compositionId) return [];
    const resolution = this._resolutions.get(compositionId);
    if (!resolution) return [];
    return resolution.order || [];
  }

  clear() {
    this._resolutions.clear();
    this._counter = 0;
  }
}

module.exports = { DependencyResolver };
