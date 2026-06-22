class GitlabPipelines {
  constructor(provider) {
    this.provider = provider;
  }

  async list(projectId) {
    return {
      success: true,
      data: [
        { id: 1, project_id: projectId, status: 'success', ref: 'main', sha: 'abc123def', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:05:00Z', web_url: `https://gitlab.com/${projectId}/pipelines/1`, duration: 300 },
        { id: 2, project_id: projectId, status: 'failed', ref: 'main', sha: 'ghi456jkl', created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:03:00Z', web_url: `https://gitlab.com/${projectId}/pipelines/2`, duration: 180 },
        { id: 3, project_id: projectId, status: 'running', ref: 'develop', sha: 'mno789pqr', created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-03T00:00:00Z', web_url: `https://gitlab.com/${projectId}/pipelines/3`, duration: null },
      ],
    };
  }

  async get(projectId, pipelineId) {
    return {
      success: true,
      data: {
        id: pipelineId,
        project_id: projectId,
        status: 'success',
        ref: 'main',
        sha: 'abc123def',
        before_sha: '000000000',
        tag: false,
        yaml_errors: null,
        user: { id: 1, name: 'Admin', username: 'root' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
        started_at: '2024-01-01T00:00:00Z',
        finished_at: '2024-01-01T00:05:00Z',
        duration: 300,
        web_url: `https://gitlab.com/${projectId}/pipelines/${pipelineId}`,
        coverage: '98.5%',
      },
    };
  }

  async retry(projectId, pipelineId) {
    return {
      success: true,
      data: {
        id: Date.now(),
        project_id: projectId,
        status: 'pending',
        ref: 'main',
        sha: 'abc123def',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        web_url: `https://gitlab.com/${projectId}/pipelines/${Date.now()}`,
      },
    };
  }
}

module.exports = { GitlabPipelines };
