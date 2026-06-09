const { query } = require('../db');
const { makeError, assertUUID, assertRequired } = require('../runtime/validators');

const cache = new Map();
const CACHE_TTL = 60000;

function cacheGet(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  if (entry) cache.delete(key);
  return null;
}

function cacheSet(key, data) {
  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 1000) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

function clearCache() { cache.clear(); }

async function resolveWorkspace({ workspace_slug, workspace_id }) {
  if (!workspace_slug && !workspace_id) {
    throw makeError('INVALID_INPUT', 'workspace_id or workspace_slug is required', 'workspace_id');
  }

  const cacheKey = workspace_id || `slug:${workspace_slug}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached };

  let sql, params;
  if (workspace_id) {
    assertUUID(workspace_id, 'workspace_id');
    sql = 'SELECT id, slug, plan, subscription_status AS status FROM workspaces WHERE id = $1';
    params = [workspace_id];
  } else {
    sql = 'SELECT id, slug, plan, subscription_status AS status FROM workspaces WHERE slug = $1';
    params = [workspace_slug];
  }

  const r = await query(sql, params);
  if (!r.rows.length) {
    const field = workspace_id ? 'workspace_id' : 'workspace_slug';
    throw makeError('NOT_FOUND', 'Workspace not found. Ensure seed-test.js has been executed.', field);
  }

  const ws = { id: r.rows[0].id, slug: r.rows[0].slug, plan: r.rows[0].plan, status: r.rows[0].status };
  cacheSet(cacheKey, ws);
  return { ...ws };
}

async function resolveUser({ user_id, workspace_id }) {
  if (!user_id) throw makeError('INVALID_INPUT', 'user_id is required', 'user_id');
  if (!workspace_id) throw makeError('INVALID_INPUT', 'workspace_id is required', 'workspace_id');

  const r = await query(
    `SELECT u.id, u.name, u.email, wm.role
     FROM workspace_members wm
     JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = $1 AND wm.user_id = $2`,
    [workspace_id, user_id]
  );

  if (!r.rows.length) {
    throw makeError('NOT_FOUND', 'User is not a member of this workspace', 'user_id');
  }

  const row = r.rows[0];
  if (!['owner', 'admin', 'member', 'viewer'].includes(row.role)) {
    throw makeError('INVALID_INPUT', `Invalid role: ${row.role}`, 'role');
  }

  return { user: { id: row.id, name: row.name, email: row.email }, role: row.role };
}

async function resolveContext({ workspace_slug, workspace_id, user_id }) {
  const workspace = await resolveWorkspace({ workspace_slug, workspace_id });
  let user = null, role = null;
  if (user_id) {
    const resolved = await resolveUser({ user_id, workspace_id: workspace.id });
    user = resolved.user;
    role = resolved.role;
  }
  return { workspace, user, role };
}

module.exports = { resolveWorkspace, resolveUser, resolveContext, clearCache };
