class VercelDeployments {
  constructor(provider) {
    this.provider = provider;
  }

  async list(projectId) {
    return {
      success: true,
      data: [
        { id: 'dpl_001', name: 'main-abc123', url: 'my-app.vercel.app', state: 'READY', createdAt: 1704067200000, buildingAt: 1704067200000, readyAt: 1704067260000, creator: { uid: 'user_1', username: 'johndoe' }, meta: { githubCommitRef: 'main', githubCommitSha: 'abc123' } },
        { id: 'dpl_002', name: 'feat-new-dpl', url: 'my-app-feat-new.vercel.app', state: 'BUILDING', createdAt: 1704153600000, buildingAt: 1704153600000, readyAt: null, creator: { uid: 'user_1', username: 'johndoe' }, meta: { githubCommitRef: 'feat-new', githubCommitSha: 'def456' } },
        { id: 'dpl_003', name: 'main-def456', url: 'my-app-def456.vercel.app', state: 'ERROR', createdAt: 1704153600000, buildingAt: 1704153600000, readyAt: null, creator: { uid: 'user_2', username: 'janedoe' }, meta: { githubCommitRef: 'main', githubCommitSha: 'def456' }, error: { code: 'BUILD_FAILED', message: 'Build script exited with code 1' } },
      ],
    };
  }

  async get(id) {
    return {
      success: true,
      data: {
        id,
        name: 'main-abc123',
        url: 'my-app.vercel.app',
        state: 'READY',
        createdAt: 1704067200000,
        buildingAt: 1704067200000,
        readyAt: 1704067260000,
        creator: { uid: 'user_1', username: 'johndoe' },
        meta: { githubCommitRef: 'main', githubCommitSha: 'abc123' },
        target: 'production',
        alias: ['my-app.vercel.app'],
        regions: ['iad1'],
        public: true,
      },
    };
  }

  async create(projectId, options = {}) {
    return {
      success: true,
      data: {
        id: `dpl_${Date.now().toString(36)}`,
        name: `${options.ref || 'main'}-${Date.now().toString(36)}`,
        url: `${projectId}-${Date.now().toString(36)}.vercel.app`,
        state: 'QUEUED',
        createdAt: Date.now(),
        buildingAt: null,
        readyAt: null,
        creator: { uid: 'user_1', username: 'current-user' },
        meta: { githubCommitRef: options.ref || 'main' },
        target: options.target || 'production',
      },
    };
  }

  async cancel(id) {
    return {
      success: true,
      data: {
        id,
        state: 'CANCELED',
        canceledAt: Date.now(),
      },
    };
  }
}

module.exports = { VercelDeployments };
