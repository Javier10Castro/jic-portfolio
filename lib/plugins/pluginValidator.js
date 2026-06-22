class PluginValidator {
  validate(manifest) {
    const errors = [];
    if (!manifest) return { valid: false, errors: ['Manifest is required'] };
    if (!manifest.id) errors.push('Missing id');
    if (!manifest.name) errors.push('Missing name');
    if (!manifest.version) errors.push('Missing version');
    if (!manifest.permissions && manifest.type !== 'theme') errors.push('Missing permissions array');
    if (manifest.id && !/^[a-z0-9_-]+$/.test(manifest.id)) errors.push('id must be lowercase alphanumeric with hyphens/underscores');
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) errors.push('version must be semver (x.y.z)');
    return { valid: errors.length === 0, errors };
  }

  validateHooks(hooks, allowedHooks) {
    const errors = [];
    if (!hooks) return { valid: true, errors: [] };
    Object.keys(hooks).forEach(hook => {
      if (!allowedHooks.includes(hook)) errors.push(`Unknown hook: ${hook}`);
    });
    return { valid: errors.length === 0, errors };
  }
}

module.exports = { PluginValidator };
