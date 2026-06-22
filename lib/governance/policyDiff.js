const policyVersioning = require('./policyVersioning');

class PolicyDiff {
  diff(versionA, versionB) {
    if (!versionA || !versionB) return { added: [], removed: [], changed: [], same: [] };
    const a = versionA.policy || versionA;
    const b = versionB.policy || versionB;
    const added = [];
    const removed = [];
    const changed = [];
    const same = [];
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of allKeys) {
      if (key === 'version' || key === 'createdAt') continue;
      if (!(key in a)) added.push({ key, value: b[key] });
      else if (!(key in b)) removed.push({ key, value: a[key] });
      else if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) changed.push({ key, oldValue: a[key], newValue: b[key] });
      else same.push({ key, value: a[key] });
    }
    return { added, removed, changed, same };
  }

  diffAgainstCurrent(policyId, newPolicy) {
    if (!policyId || !newPolicy) return null;
    const current = policyVersioning.getLatestVersion(policyId);
    if (!current) return { added: Object.keys(newPolicy).filter(k => k !== 'id').map(k => ({ key: k, value: newPolicy[k] })), removed: [], changed: [], same: [] };
    return this.diff(current.policy, newPolicy);
  }

  summarizeDiff(diffResult) {
    if (!diffResult) return 'No changes';
    const parts = [];
    if (diffResult.added.length > 0) parts.push(`${diffResult.added.length} field(s) added`);
    if (diffResult.removed.length > 0) parts.push(`${diffResult.removed.length} field(s) removed`);
    if (diffResult.changed.length > 0) parts.push(`${diffResult.changed.length} field(s) changed`);
    if (diffResult.same.length > 0) parts.push(`${diffResult.same.length} field(s) unchanged`);
    return parts.length > 0 ? parts.join(', ') : 'No changes';
  }

  clear() {}
}

module.exports = new PolicyDiff();
