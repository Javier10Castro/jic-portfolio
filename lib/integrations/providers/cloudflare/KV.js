class CloudflareKV {
  constructor(provider) {
    this.provider = provider;
  }

  async listNamespaces(accountId) {
    return {
      success: true,
      data: [
        { id: 'ns-1', title: 'app-config', supports_url_encoding: true },
        { id: 'ns-2', title: 'session-store', supports_url_encoding: true },
      ],
    };
  }

  async getValue(namespaceId, key) {
    return {
      success: true,
      data: {
        key,
        value: 'mock-kv-value',
        metadata: { created: '2024-01-01T00:00:00.000Z' },
      },
    };
  }

  async setValue(namespaceId, key, value) {
    return {
      success: true,
      data: {
        key,
        value,
        created: new Date().toISOString(),
      },
    };
  }

  async deleteValue(namespaceId, key) {
    return { success: true, message: `Key ${key} deleted from namespace ${namespaceId}` };
  }
}

module.exports = { CloudflareKV };
