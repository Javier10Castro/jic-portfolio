class FeatureFlagEvaluator {
  constructor(registry, targeting) {
    if (!registry || !targeting) {
      throw new Error('registry and targeting are required');
    }
    this._registry = registry;
    this._targeting = targeting;
  }

  isEnabled(flagKey, context) {
    const flag = this._registry.get(flagKey);
    if (!flag) return false;
    if (!flag.enabled) return false;
    return this._targeting.evaluate(flagKey, context);
  }

  getValue(flagKey, context, defaultValue) {
    const flag = this._registry.get(flagKey);
    if (!flag) return defaultValue;
    if (!flag.enabled) return defaultValue;
    if (!this._targeting.evaluate(flagKey, context)) return defaultValue;
    return true;
  }

  getAllFlags(context) {
    const flags = this._registry.list();
    const result = {};
    for (const flag of flags) {
      const enabled = flag.enabled && this._targeting.evaluate(flag.key, context);
      result[flag.key] = {
        key: flag.key,
        enabled: enabled,
        value: enabled
      };
    }
    return result;
  }

  clear() {
    this._registry.clear();
    this._targeting.clear();
  }
}

module.exports = { FeatureFlagEvaluator };
