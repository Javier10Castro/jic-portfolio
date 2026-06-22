class NotionDatabase {
  constructor(provider) {
    this.provider = provider;
  }

  async query(databaseId, filter = {}) {
    return {
      success: true,
      data: {
        object: 'list',
        results: [
          { object: 'page', id: 'page-1', created_time: '2024-01-01T00:00:00.000Z', last_edited_time: '2024-06-01T00:00:00.000Z', archived: false, url: `https://www.notion.so/page-1`, properties: { Name: { title: [{ plain_text: 'Task 1' }] }, Status: { status: { name: 'Done' } }, Priority: { select: { name: 'High' } } } },
          { object: 'page', id: 'page-2', created_time: '2024-01-02T00:00:00.000Z', last_edited_time: '2024-06-01T00:00:00.000Z', archived: false, url: `https://www.notion.so/page-2`, properties: { Name: { title: [{ plain_text: 'Task 2' }] }, Status: { status: { name: 'In Progress' } }, Priority: { select: { name: 'Medium' } } } },
          { object: 'page', id: 'page-3', created_time: '2024-01-03T00:00:00.000Z', last_edited_time: '2024-06-01T00:00:00.000Z', archived: false, url: `https://www.notion.so/page-3`, properties: { Name: { title: [{ plain_text: 'Task 3' }] }, Status: { status: { name: 'Not Started' } }, Priority: { select: { name: 'Low' } } } },
        ],
        next_cursor: null,
        has_more: false,
      },
    };
  }

  async get(databaseId) {
    return {
      success: true,
      data: {
        object: 'database',
        id: databaseId,
        created_time: '2024-01-01T00:00:00.000Z',
        last_edited_time: '2024-06-01T00:00:00.000Z',
        title: [{ type: 'text', plain_text: 'Project Database' }],
        description: [{ type: 'text', plain_text: 'Tracks project tasks' }],
        archived: false,
        url: `https://www.notion.so/${databaseId.replace(/-/g, '')}`,
        properties: {
          Name: { id: 'title', type: 'title', name: 'Name' },
          Status: { id: 'status', type: 'status', name: 'Status', status: { options: [{ name: 'Not Started', color: 'default' }, { name: 'In Progress', color: 'blue' }, { name: 'Done', color: 'green' }] } },
          Priority: { id: 'priority', type: 'select', name: 'Priority', select: { options: [{ name: 'High', color: 'red' }, { name: 'Medium', color: 'yellow' }, { name: 'Low', color: 'gray' }] } },
        },
      },
    };
  }

  async create(parentId, title, schema = {}) {
    return {
      success: true,
      data: {
        object: 'database',
        id: `db-${Date.now().toString(36)}`,
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString(),
        title: [{ type: 'text', plain_text: title }],
        archived: false,
        url: `https://www.notion.so/db-${Date.now().toString(36)}`,
        properties: schema,
        parent: { type: 'page_id', page_id: parentId },
      },
    };
  }
}

module.exports = { NotionDatabase };
