class GithubActions {
  constructor(provider) {
    this.provider = provider;
  }

  async listWorkflows(owner, repo) {
    return {
      success: true,
      total_count: 2,
      data: [
        { id: 1, node_id: 'MDg6V29ya2Zsb3cx', name: 'CI', path: `.github/workflows/ci.yml`, state: 'active', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', url: `https://api.github.com/repos/${owner}/${repo}/actions/workflows/1` },
        { id: 2, name: 'Deploy', path: `.github/workflows/deploy.yml`, state: 'active', created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z', url: `https://api.github.com/repos/${owner}/${repo}/actions/workflows/2` },
      ],
    };
  }

  async triggerWorkflow(owner, repo, workflowId, ref = 'main') {
    return {
      success: true,
      data: {
        id: Date.now(),
        node_id: `MDg6V29ya2Zsb3dSdW4${Date.now()}`,
        name: `workflow-${workflowId}-run`,
        head_branch: ref,
        status: 'queued',
        conclusion: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        html_url: `https://github.com/${owner}/${repo}/actions/runs/${Date.now()}`,
      },
    };
  }

  async listRuns(owner, repo) {
    return {
      success: true,
      total_count: 3,
      data: [
        { id: 101, name: 'CI run 1', status: 'completed', conclusion: 'success', head_branch: 'main', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:05:00Z', html_url: `https://github.com/${owner}/${repo}/actions/runs/101` },
        { id: 102, name: 'CI run 2', status: 'completed', conclusion: 'failure', head_branch: 'main', created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:05:00Z', html_url: `https://github.com/${owner}/${repo}/actions/runs/102` },
        { id: 103, name: 'Deploy run 1', status: 'in_progress', conclusion: null, head_branch: 'develop', created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-03T00:00:00Z', html_url: `https://github.com/${owner}/${repo}/actions/runs/103` },
      ],
    };
  }

  async getRun(owner, repo, runId) {
    return {
      success: true,
      data: {
        id: runId,
        name: `Run ${runId}`,
        status: 'completed',
        conclusion: 'success',
        head_branch: 'main',
        head_sha: 'abc123def456',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
        html_url: `https://github.com/${owner}/${repo}/actions/runs/${runId}`,
        run_started_at: '2024-01-01T00:00:00Z',
        jobs_url: `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`,
        logs_url: `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/logs`,
      },
    };
  }
}

module.exports = { GithubActions };
