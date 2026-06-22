class VercelProjects {
  constructor(provider) {
    this.provider = provider;
  }

  async list() {
    return {
      success: true,
      data: [
        { id: 'prj_abc123', name: 'my-app', accountId: 'team_abc', createdAt: 1704067200000, updatedAt: 1704067200000, framework: 'nextjs', publicSource: false, region: 'iad1', link: { type: 'github', repo: 'user/my-app' } },
        { id: 'prj_def456', name: 'api-service', accountId: 'team_abc', createdAt: 1704153600000, updatedAt: 1704153600000, framework: null, publicSource: false, region: 'sfo1', link: { type: 'gitlab', repo: 'user/api-service' } },
      ],
    };
  }

  async get(id) {
    return {
      success: true,
      data: {
        id,
        name: 'my-app',
        accountId: 'team_abc',
        createdAt: 1704067200000,
        updatedAt: 1704067200000,
        framework: 'nextjs',
        publicSource: false,
        region: 'iad1',
        link: { type: 'github', repo: 'user/my-app' },
        alias: ['my-app.vercel.app'],
        latestDeployments: [{ id: 'dpl_111', url: 'my-app.vercel.app', createdAt: 1704067200000 }],
      },
    };
  }

  async create(name, options = {}) {
    return {
      success: true,
      data: {
        id: `prj_${Date.now().toString(36)}`,
        name,
        accountId: options.accountId || 'team_abc',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        framework: options.framework || null,
        publicSource: false,
        region: options.region || 'iad1',
      },
    };
  }

  async delete(id) {
    return { success: true, message: `Project ${id} deleted` };
  }
}

module.exports = { VercelProjects };
