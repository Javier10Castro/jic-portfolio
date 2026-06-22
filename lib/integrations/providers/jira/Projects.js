class JiraProjects {
  constructor(provider) {
    this.provider = provider;
  }

  async list() {
    return {
      success: true,
      data: [
        { expand: 'description,lead,issueTypes', self: `${this.provider.baseUrl}/rest/api/3/project/10000`, id: '10000', key: 'PROJ', name: 'Project Alpha', projectTypeKey: 'software', lead: { displayName: 'John Doe' }, avatarUrls: { '48x48': 'https://example.com/avatar.png' }, style: 'classic', simplified: false },
        { self: `${this.provider.baseUrl}/rest/api/3/project/10001`, id: '10001', key: 'SUP', name: 'Support Tickets', projectTypeKey: 'service_desk', lead: { displayName: 'Jane Doe' }, avatarUrls: { '48x48': 'https://example.com/avatar2.png' }, style: 'next-gen', simplified: true },
      ],
    };
  }

  async get(projectKey) {
    return {
      success: true,
      data: {
        expand: 'description,lead,issueTypes',
        self: `${this.provider.baseUrl}/rest/api/3/project/${projectKey}`,
        id: '10000',
        key: projectKey,
        name: projectKey === 'PROJ' ? 'Project Alpha' : `Project ${projectKey}`,
        projectTypeKey: 'software',
        lead: { displayName: 'John Doe', emailAddress: 'john@example.com' },
        avatarUrls: { '48x48': 'https://example.com/avatar.png' },
        style: 'classic',
        simplified: false,
        description: 'Main project for development work.',
        url: `https://your-domain.atlassian.net/projects/${projectKey}`,
      },
    };
  }

  async create(name, key, lead) {
    return {
      success: true,
      data: {
        self: `${this.provider.baseUrl}/rest/api/3/project/10002`,
        id: '10002',
        key,
        name,
        projectTypeKey: 'software',
        lead: { displayName: lead || 'Unknown' },
        style: 'next-gen',
        simplified: true,
      },
    };
  }
}

module.exports = { JiraProjects };
