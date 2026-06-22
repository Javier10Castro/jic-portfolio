class IntegrationInstaller {
  constructor({ registry, loader }) {
    this._registry = registry;
    this._loader = loader;
  }

  install(providerType, config) {
    const provider = this._registry.getProvider(providerType);
    if (!provider) {
      return { success: false, error: `Provider type '${providerType}' not registered` };
    }

    const integration = {
      provider: providerType,
      name: config.name || providerType,
      type: provider.type,
      authType: provider.authType,
      status: 'installed',
      config
    };

    this._registry.register(integration);
    const loadResult = this._loader.load(integration);
    if (!loadResult.success) {
      this._registry.unregister(providerType);
      return { success: false, error: 'Failed to load integration' };
    }

    return { success: true, integration };
  }

  uninstall(provider) {
    this._loader.unload(provider);
    this._registry.unregister(provider);
  }
}

module.exports = { IntegrationInstaller };
