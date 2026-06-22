const semver = {};

semver.satisfies = (version, range) => {
  if (range === '*' || range === 'x') return true;
  const v = version.split('.').map(Number);
  const r = range.split('.');
  for (let i = 0; i < r.length; i++) {
    if (r[i] === 'x' || r[i] === '*') return true;
    const rn = parseInt(r[i], 10);
    if (isNaN(rn)) continue;
    if ((v[i] || 0) < rn) return false;
    if ((v[i] || 0) > rn) return i === 0 ? true : false;
  }
  return true;
};

semver.gte = (version, min) => {
  if (min === '*' || !min) return true;
  const va = version.split('.').map(Number);
  const vb = min.split('.').map(Number);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const a = va[i] || 0, b = vb[i] || 0;
    if (a < b) return false;
    if (a > b) return true;
  }
  return true;
};

semver.lte = (version, max) => {
  if (max === '*' || !max) return true;
  const va = version.split('.').map(Number);
  const vb = max.split('.').map(Number);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const a = va[i] || 0, b = vb[i] || 0;
    if (a > b) return false;
    if (a < b) return true;
  }
  return true;
};

class PluginCompatibility {
  check(plugin, platformVersion) {
    const issues = [];
    if (!plugin || !plugin.manifest) return { compatible: false, issues: ['No manifest'] };

    const { minimumPlatformVersion, maximumPlatformVersion } = plugin.manifest;

    if (minimumPlatformVersion && !semver.gte(platformVersion, minimumPlatformVersion)) {
      issues.push(`Platform version ${platformVersion} is below minimum ${minimumPlatformVersion}`);
    }
    if (maximumPlatformVersion && !semver.lte(platformVersion, maximumPlatformVersion)) {
      issues.push(`Platform version ${platformVersion} exceeds maximum ${maximumPlatformVersion}`);
    }

    return { compatible: issues.length === 0, issues };
  }

  checkDependencies(plugin, registry) {
    const deps = plugin.manifest.dependencies || {};
    const missing = [];
    Object.entries(deps).forEach(([depId, depVersion]) => {
      const dep = registry.getPlugin(depId);
      if (!dep) { missing.push(`Missing dependency: ${depId}`); return; }
      if (depVersion && !semver.satisfies(dep.manifest.version, depVersion)) {
        missing.push(`Dependency ${depId} version ${dep.manifest.version} does not satisfy ${depVersion}`);
      }
    });
    return { ok: missing.length === 0, missing };
  }
}

module.exports = { PluginCompatibility, semver };
