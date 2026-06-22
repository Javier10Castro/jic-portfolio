class GitlabMergeRequests {
  constructor(provider) {
    this.provider = provider;
  }

  async list(projectId, state = 'opened') {
    return {
      success: true,
      data: [
        { id: 1, iid: 1, project_id: projectId, title: 'Add new feature', state: 'opened', source_branch: 'feat-new', target_branch: 'main', author: { id: 1, username: 'dev1', name: 'Dev One' }, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z', web_url: `https://gitlab.com/${projectId}/merge_requests/1`, merge_status: 'can_be_merged' },
        { id: 2, iid: 2, project_id: projectId, title: 'Fix critical bug', state: 'opened', source_branch: 'fix-bug', target_branch: 'main', author: { id: 2, username: 'dev2', name: 'Dev Two' }, created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-04T00:00:00Z', web_url: `https://gitlab.com/${projectId}/merge_requests/2`, merge_status: 'cannot_be_merged' },
        { id: 3, iid: 3, project_id: projectId, title: 'Update docs', state: 'merged', source_branch: 'update-docs', target_branch: 'main', author: { id: 3, username: 'dev3', name: 'Dev Three' }, created_at: '2023-12-01T00:00:00Z', updated_at: '2023-12-02T00:00:00Z', web_url: `https://gitlab.com/${projectId}/merge_requests/3`, merge_status: 'can_be_merged', merged_at: '2023-12-02T00:00:00Z' },
      ],
    };
  }

  async get(projectId, mrId) {
    return {
      success: true,
      data: {
        id: mrId,
        iid: mrId,
        project_id: projectId,
        title: `Merge Request #${mrId}`,
        description: `Details for MR #${mrId}`,
        state: 'opened',
        source_branch: 'feature-branch',
        target_branch: 'main',
        source_project_id: projectId,
        target_project_id: projectId,
        author: { id: 1, username: 'author', name: 'Author' },
        assignees: [{ id: 2, username: 'reviewer', name: 'Reviewer' }],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        web_url: `https://gitlab.com/${projectId}/merge_requests/${mrId}`,
        merge_status: 'can_be_merged',
        should_remove_source_branch: false,
        force_remove_source_branch: false,
        pipeline: { id: 100, status: 'success' },
        diff_refs: { base_sha: 'abc', head_sha: 'def', start_sha: 'ghi' },
        user_notes_count: 3,
        upvotes: 5,
        downvotes: 0,
      },
    };
  }

  async create(projectId, title, sourceBranch, targetBranch, description = '') {
    return {
      success: true,
      data: {
        id: Date.now(),
        iid: Math.floor(Math.random() * 1000) + 10,
        project_id: projectId,
        title,
        description,
        state: 'opened',
        source_branch: sourceBranch,
        target_branch: targetBranch,
        author: { id: 1, username: 'current-user', name: 'Current User' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        web_url: `https://gitlab.com/${projectId}/merge_requests/${Math.floor(Math.random() * 1000) + 10}`,
        merge_status: 'can_be_merged',
      },
    };
  }

  async merge(projectId, mrId) {
    return {
      success: true,
      data: {
        id: mrId,
        state: 'merged',
        merged_at: new Date().toISOString(),
        merge_commit_sha: 'mergesha001',
        web_url: `https://gitlab.com/${projectId}/merge_requests/${mrId}`,
      },
    };
  }

  async approve(projectId, mrId) {
    return {
      success: true,
      data: {
        id: mrId,
        approvals_required: 2,
        approvals_left: 1,
        approved_by: [{ user: { id: 1, username: 'approver', name: 'Approver' } }],
        approved: true,
      },
    };
  }
}

module.exports = { GitlabMergeRequests };
