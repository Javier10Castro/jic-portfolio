const { BaseIntegration } = require('../BaseIntegration');

class AsanaProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'asana';
    this.version = '1.0.0';
    this.type = 'project-management';
    this.authType = 'pat';
    this.baseUrl = 'https://app.asana.com/api/1.0';
    this.token = config.token || null;
  }

  async _request(method, path, data) {
    const url = `${this.baseUrl}${path}`;
    const headers = { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' };
    return { success: true, url, method, headers, data, status: 200 };
  }

  connect() {
    if (!this.token) {
      return { success: false, error: 'No token provided' };
    }
    this.connected = true;
    this.connectedAt = new Date().toISOString();
    return { success: true, connectedAt: this.connectedAt };
  }

  async getProfile() {
    return {
      success: true,
      data: {
        gid: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        photo: { image_128x128: 'https://photo.asana.com/user-uuid/128x128.png' },
        resource_type: 'user',
        workspaces: [{ gid: 'ws-1', name: 'My Workspace' }],
      },
    };
  }

  async listProjects(workspaceId) {
    return {
      success: true,
      data: [
        { gid: 'project-1', name: 'Mobile App', resource_type: 'project', workspace: { gid: workspaceId }, archived: false, color: 'blue', created_at: '2024-01-01T00:00:00.000Z', current_status: null },
        { gid: 'project-2', name: 'Website Redesign', resource_type: 'project', workspace: { gid: workspaceId }, archived: false, color: 'green', created_at: '2024-02-01T00:00:00.000Z', current_status: null },
      ],
    };
  }

  async createProject(workspaceId, name) {
    return {
      success: true,
      data: {
        gid: `project-${Date.now().toString(36)}`,
        name,
        resource_type: 'project',
        workspace: { gid: workspaceId },
        archived: false,
        color: 'blue',
        created_at: new Date().toISOString(),
      },
    };
  }

  async listTasks(projectId) {
    return {
      success: true,
      data: [
        { gid: 'task-1', name: 'Design login screen', resource_type: 'task', project: { gid: projectId }, assignee: null, completed: false, created_at: '2024-01-01T00:00:00.000Z', due_on: '2024-02-01', notes: 'Design specs here' },
        { gid: 'task-2', name: 'Implement API', resource_type: 'task', project: { gid: projectId }, assignee: { gid: 'user-uuid', name: 'John Doe' }, completed: false, created_at: '2024-01-02T00:00:00.000Z', due_on: '2024-03-01', notes: '' },
        { gid: 'task-3', name: 'Write tests', resource_type: 'task', project: { gid: projectId }, assignee: null, completed: true, created_at: '2024-01-03T00:00:00.000Z', due_on: null, notes: '' },
      ],
    };
  }

  async createTask(projectId, name) {
    return {
      success: true,
      data: {
        gid: `task-${Date.now().toString(36)}`,
        name,
        resource_type: 'task',
        project: { gid: projectId },
        assignee: null,
        completed: false,
        created_at: new Date().toISOString(),
        due_on: null,
        notes: '',
      },
    };
  }
}

module.exports = { AsanaProvider };
