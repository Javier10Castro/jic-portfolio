const { initEnv } = require('../lib/bootstrap/env');
initEnv();
const { query } = require('../lib/db');

const WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';
const PROJECT_ID = '00000000-0000-0000-0000-000000000003';

async function seed() {
  console.log('Seeding test data...\n');

  await query(`INSERT INTO workspaces (id, name, slug, plan)
    VALUES ($1, 'Test Workspace', 'test-workspace', 'pro')
    ON CONFLICT (id) DO NOTHING`, [WORKSPACE_ID]);
  console.log('  ✔ workspace: test-workspace');

  await query(`INSERT INTO users (id, email, name, password_hash, email_verified)
    VALUES ($1, 'test@test.com', 'Test User', 'hash', TRUE)
    ON CONFLICT (id) DO NOTHING`, [USER_ID]);
  console.log('  ✔ user: test@test.com');

  await query(`INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES ($1, $2, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING`, [WORKSPACE_ID, USER_ID]);
  console.log('  ✔ workspace_member: owner');

  await query(`INSERT INTO projects (id, workspace_id, created_by, name, slug, status, metadata)
    VALUES ($1, $2, $3, 'Test Project', 'test', 'draft', '{}'::jsonb)
    ON CONFLICT (id) DO NOTHING`, [PROJECT_ID, WORKSPACE_ID, USER_ID]);
  console.log('  ✔ project: test (slug resolves via resolveProject)');

  console.log('\n✔ Seed complete — workspace, user, and project ready for tests');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
