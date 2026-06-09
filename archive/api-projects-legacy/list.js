require('dotenv').config();
const { query, close } = require('../../lib/db');

const HEADERS = { 'Content-Type': 'application/json' };

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.writeHead(405, HEADERS).end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  try {
    const result = await query(
      `SELECT project_id, section, field_key, value, created_at FROM form_responses ORDER BY project_id, section, field_key`
    );

    const projects = {};
    for (const row of result.rows) {
      if (!projects[row.project_id]) {
        projects[row.project_id] = {
          project_id: row.project_id,
          sections: {},
          first_seen: row.created_at,
          last_seen: row.created_at,
        };
      }
      if (!projects[row.project_id].sections[row.section]) {
        projects[row.project_id].sections[row.section] = {};
      }
      projects[row.project_id].sections[row.section][row.field_key] = row.value;
      if (row.field_key === 'biz_name') projects[row.project_id].name = row.value;
      if (row.field_key === 'biz_contacto' || row.field_key === 'email') projects[row.project_id].email = row.value;
      if (new Date(row.created_at) > new Date(projects[row.project_id].last_seen)) {
        projects[row.project_id].last_seen = row.created_at;
      }
    }

    const list = Object.values(projects).map(p => ({
      project_id: p.project_id,
      name: p.name || p.project_id,
      email: p.email || null,
      sections: Object.keys(p.sections).length,
      fields: Object.values(p.sections).reduce((sum, s) => sum + Object.keys(s).length, 0),
      created_at: p.first_seen,
    }));

    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.writeHead(200, HEADERS).end(JSON.stringify({ projects: list }));
  } catch (err) {
    console.error('[projects/list]', err.message);
    return res.writeHead(500, HEADERS).end(JSON.stringify({ error: err.message }));
  }
};
