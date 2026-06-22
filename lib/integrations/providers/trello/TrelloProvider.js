const { BaseIntegration } = require('../BaseIntegration');

class TrelloProvider extends BaseIntegration {
  constructor(config = {}) {
    super(config);
    this.name = 'trello';
    this.version = '1.0.0';
    this.type = 'project-management';
    this.authType = 'api-key';
    this.baseUrl = 'https://api.trello.com/1';
    this.apiKey = config.apiKey || null;
    this.token = config.token || null;
  }

  async _request(method, path, data) {
    const query = `key=${this.apiKey}&token=${this.token}`;
    const url = `${this.baseUrl}${path}?${query}`;
    const headers = { 'Content-Type': 'application/json' };
    return { success: true, url, method, headers, data, status: 200 };
  }

  connect() {
    if (!this.apiKey || !this.token) {
      return { success: false, error: 'API key and token required' };
    }
    this.connected = true;
    this.connectedAt = new Date().toISOString();
    return { success: true, connectedAt: this.connectedAt };
  }

  async getProfile() {
    return {
      success: true,
      data: {
        id: 'user-uuid',
        fullName: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        avatarUrl: 'https://trello-members.s3.amazonaws.com/user-uuid/avatar.png',
        bio: 'Software developer',
        created: '2020-01-01T00:00:00.000Z',
        status: 'active',
      },
    };
  }

  async listBoards() {
    return {
      success: true,
      data: [
        { id: 'board-1', name: 'Sprint Board', desc: 'Current sprint tasks', closed: false, starred: true, url: 'https://trello.com/b/abc123/sprint-board', dateLastActivity: '2024-06-01T00:00:00.000Z', prefs: { permissionLevel: 'org', voting: 'disabled', comments: 'members' } },
        { id: 'board-2', name: 'Backlog', desc: 'Feature backlog', closed: false, starred: false, url: 'https://trello.com/b/def456/backlog', dateLastActivity: '2024-05-01T00:00:00.000Z', prefs: { permissionLevel: 'org', voting: 'disabled', comments: 'members' } },
        { id: 'board-3', name: 'Ideas', desc: 'Random ideas', closed: false, starred: false, url: 'https://trello.com/b/ghi789/ideas', dateLastActivity: '2024-04-01T00:00:00.000Z', prefs: { permissionLevel: 'public', voting: 'enabled', comments: 'public' } },
      ],
    };
  }

  async createBoard(name) {
    return {
      success: true,
      data: {
        id: `board-${Date.now().toString(36)}`,
        name,
        desc: '',
        closed: false,
        starred: false,
        url: `https://trello.com/b/${Date.now().toString(36)}/${name.toLowerCase().replace(/\s+/g, '-')}`,
        dateLastActivity: new Date().toISOString(),
        prefs: { permissionLevel: 'org', voting: 'disabled', comments: 'members' },
      },
    };
  }

  async listLists(boardId) {
    return {
      success: true,
      data: [
        { id: 'list-1', name: 'To Do', closed: false, pos: 1, board: { id: boardId }, subscribed: false },
        { id: 'list-2', name: 'In Progress', closed: false, pos: 2, board: { id: boardId }, subscribed: false },
        { id: 'list-3', name: 'Done', closed: false, pos: 3, board: { id: boardId }, subscribed: false },
      ],
    };
  }

  async createCard(listId, name) {
    return {
      success: true,
      data: {
        id: `card-${Date.now().toString(36)}`,
        name,
        desc: '',
        closed: false,
        idList: listId,
        pos: 1,
        dateLastActivity: new Date().toISOString(),
        due: null,
        labels: [],
        url: `https://trello.com/c/${Date.now().toString(36)}`,
      },
    };
  }
}

module.exports = { TrelloProvider };
