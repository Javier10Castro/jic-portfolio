class JiraIssues {
  constructor(provider) {
    this.provider = provider;
  }

  async list(projectKey, jql = '') {
    return {
      success: true,
      data: {
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 3,
        issues: [
          { id: '10001', key: `${projectKey}-1`, self: `${this.provider.baseUrl}/rest/api/3/issue/${projectKey}-1`, fields: { summary: 'Login page broken', status: { name: 'In Progress' }, priority: { name: 'High' }, issuetype: { name: 'Bug' }, assignee: { displayName: 'John Doe' }, created: '2024-01-01T00:00:00.000+0000' } },
          { id: '10002', key: `${projectKey}-2`, fields: { summary: 'Add dark mode', status: { name: 'To Do' }, priority: { name: 'Medium' }, issuetype: { name: 'Story' }, assignee: null, created: '2024-01-02T00:00:00.000+0000' } },
          { id: '10003', key: `${projectKey}-3`, fields: { summary: 'Update documentation', status: { name: 'Done' }, priority: { name: 'Low' }, issuetype: { name: 'Task' }, assignee: { displayName: 'Jane Doe' }, created: '2024-01-03T00:00:00.000+0000' } },
        ],
      },
    };
  }

  async get(issueKey) {
    return {
      success: true,
      data: {
        id: '10001',
        key: issueKey,
        self: `${this.provider.baseUrl}/rest/api/3/issue/${issueKey}`,
        fields: {
          summary: 'Issue summary',
          description: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Issue description' }] }] },
          status: { name: 'In Progress', description: 'Work has started', category: { name: 'In Progress' } },
          priority: { name: 'High', iconUrl: 'https://example.com/icons/high.png' },
          issuetype: { name: 'Bug', iconUrl: 'https://example.com/icons/bug.png' },
          assignee: { displayName: 'John Doe', emailAddress: 'john@example.com' },
          reporter: { displayName: 'Jane Doe', emailAddress: 'jane@example.com' },
          created: '2024-01-01T00:00:00.000+0000',
          updated: '2024-06-01T00:00:00.000+0000',
          labels: ['frontend', 'urgent'],
          project: { key: issueKey.split('-')[0], name: 'Project' },
        },
      },
    };
  }

  async create(projectKey, summary, type = 'Task', priority = 'Medium') {
    return {
      success: true,
      data: {
        id: `${Date.now()}`,
        key: `${projectKey}-${Math.floor(Math.random() * 1000) + 100}`,
        self: `${this.provider.baseUrl}/rest/api/3/issue/${projectKey}-${Math.floor(Math.random() * 1000) + 100}`,
        fields: {
          summary,
          status: { name: 'To Do' },
          priority: { name: priority },
          issuetype: { name: type },
          created: new Date().toISOString(),
        },
      },
    };
  }

  async update(issueKey, fields) {
    return {
      success: true,
      data: {
        id: issueKey,
        key: issueKey,
        fields: { ...fields, updated: new Date().toISOString() },
      },
    };
  }

  async transition(issueKey, transitionId) {
    return {
      success: true,
      data: {
        key: issueKey,
        transition: { id: transitionId, name: 'Transitioned' },
        updated: new Date().toISOString(),
      },
    };
  }
}

module.exports = { JiraIssues };
