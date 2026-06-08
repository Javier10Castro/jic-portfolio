const crypto = require('crypto');
const { query, getPool } = require('./index.js');

const SECTION_MAP = {
  biz: 'business',
  obj: 'goals',
  comp: 'competition',
  pub: 'audience',
  brand: 'branding',
  arq: 'site',
  cont: 'content',
  serv: 'services',
  social: 'social_proof',
  func: 'functionality',
  seo: 'seo',
  ref: 'references',
  conv: 'conversion',
  ai: 'essence',
};

function detectSection(fieldKey) {
  for (const [prefix, section] of Object.entries(SECTION_MAP)) {
    if (fieldKey.startsWith(prefix + '_') || fieldKey === prefix) return section;
  }
  return 'other';
}

function normalizeValue(val) {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function generateProjectId(name, email) {
  const hash = crypto.createHash('sha256').update(`${name}|${email}|${Date.now()}`).digest('hex').slice(0, 12);
  return `proj_${hash}`;
}

async function createTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS form_responses (
      id SERIAL PRIMARY KEY,
      project_id VARCHAR(64) NOT NULL,
      section VARCHAR(64) NOT NULL,
      field_key VARCHAR(128) NOT NULL,
      value TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_form_responses_project_id ON form_responses(project_id);
    CREATE INDEX IF NOT EXISTS idx_form_responses_section ON form_responses(section);
  `;
  await query(sql);
}

async function saveFormResponse(project_id, section, field_key, value) {
  const val = normalizeValue(value);
  if (val === null) return;
  const sql = `INSERT INTO form_responses (project_id, section, field_key, value) VALUES ($1, $2, $3, $4)`;
  await query(sql, [project_id, section, field_key, val]);
}

async function saveBulkFormResponses(project_id, structuredData) {
  if (!structuredData || typeof structuredData !== 'object') return 0;

  let count = 0;
  for (const [fieldKey, value] of Object.entries(structuredData)) {
    const val = normalizeValue(value);
    if (val === null) continue;
    const section = detectSection(fieldKey);
    await saveFormResponse(project_id, section, fieldKey, val);
    count++;
  }
  return count;
}

async function getProjectFormResponses(project_id) {
  const sql = `SELECT * FROM form_responses WHERE project_id = $1 ORDER BY id ASC`;
  const result = await query(sql, [project_id]);
  return result.rows;
}

async function getResponsesGrouped(project_id) {
  const rows = await getProjectFormResponses(project_id);
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.section]) grouped[row.section] = {};
    grouped[row.section][row.field_key] = row.value;
  }
  return grouped;
}

module.exports = {
  createTable,
  saveFormResponse,
  saveBulkFormResponses,
  getProjectFormResponses,
  getResponsesGrouped,
  detectSection,
  generateProjectId,
};
