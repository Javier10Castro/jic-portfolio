class MongoSync {
  constructor(config = {}) {
    this.config = config;
    this.connected = false;
    this.url = config.url || 'mongodb://localhost:27017';
    this.database = config.database || 'test';
  }

  connect(url) {
    this.url = url || this.url;
    this.connected = true;
    return { success: true, message: `Connected to MongoDB at ${this.url}/${this.database}` };
  }

  async disconnect() {
    this.connected = false;
    return { success: true, message: 'Disconnected from MongoDB' };
  }

  async find(collection, query = {}) {
    return {
      success: true,
      data: [
        { _id: '64a1b2c3d4e5f6a7b8c9d0e1', name: 'doc-1', value: 100, created_at: new Date('2024-01-01') },
        { _id: '64a1b2c3d4e5f6a7b8c9d0e2', name: 'doc-2', value: 200, created_at: new Date('2024-01-02') },
      ],
      count: 2,
    };
  }

  async insert(collection, doc) {
    return {
      success: true,
      data: {
        _id: `64a1b2c3d4e5f6a7b8c9d${Date.now().toString(36)}`,
        ...doc,
        insertedAt: new Date(),
      },
      insertedCount: 1,
    };
  }

  async update(collection, query, update) {
    return {
      success: true,
      data: {
        matchedCount: 1,
        modifiedCount: 1,
        upsertedId: null,
      },
    };
  }

  async delete(collection, query) {
    return {
      success: true,
      data: {
        deletedCount: 1,
      },
    };
  }

  async listCollections() {
    return {
      success: true,
      data: [
        { name: 'users', type: 'collection', options: {} },
        { name: 'orders', type: 'collection', options: {} },
        { name: 'products', type: 'collection', options: {} },
        { name: 'system.views', type: 'view', options: { viewOn: 'users' } },
      ],
    };
  }

  async testConnection() {
    const start = Date.now();
    try {
      await this.connect();
      return { success: true, latency: Date.now() - start };
    } catch (err) {
      return { success: false, latency: Date.now() - start, error: err.message };
    }
  }
}

module.exports = { MongoSync };
