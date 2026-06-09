const fs = require('fs');
const path = require('path');
const { initEnv } = require('../lib/bootstrap/env');
const { query } = require('../lib/db');
const { analyze } = require('../lib/migrations/dependency-analyzer');

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'data', 'migrations');

const FORCE = process.argv.includes('--force');

async function confirmDrop() {
  if (FORCE) return true;
  return new Promise((resolve) => {
    process.stdout.write('\n  Type "y" to confirm: ');
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim().toLowerCase() === 'y');
    });
  });
}

async function dropAllTables() {
  const sql = `
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END$$;`;
  await query(sql);
}

async function runMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error('Migrations directory not found:', MIGRATIONS_DIR);
    process.exit(1);
  }

  console.log('Analyzing migration dependencies...');

  let order;
  try {
    const analysis = analyze(MIGRATIONS_DIR);
    order = analysis.order;

    if (analysis.warnings.length) {
      for (const w of analysis.warnings) console.log('  \u26a0\ufe0f ' + w);
    }

    console.log('\u2714 Dependency graph built');
    console.log('\u2714 Execution order resolved:');
    for (const f of order) console.log('    ' + f);
    console.log('');
  } catch (err) {
    console.error('Dependency analysis failed:', err.message);
    console.log('Falling back to filename sort...');
    order = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();
    console.log('');
  }

  if (order.length === 0) {
    console.log('No migration files found');
    process.exit(1);
  }

  console.log('Running', order.length, 'migration(s)\n');

  for (const file of order) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8').trim();

    if (!sql) {
      console.log('Skipping empty migration:', file);
      continue;
    }

    console.log('Running migration:', file);

    try {
      await query(sql);
      console.log('Success:', file);
    } catch (err) {
      console.error('Failed:', file, '-', err.message);
      process.exit(1);
    }
  }

  console.log('\n\u2714 All migrations completed successfully');
}

async function validate() {
  console.log('\n--- Validation ---');

  const tablesResult = await query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  console.log('\nTables in public schema:');
  const t = tablesResult.rows.map(r => '  - ' + r.tablename).join('\n');
  console.log(t || '  (none)');

  const tables = tablesResult.rows.map(r => r.tablename);

  for (const tbl of ['workspaces', 'users', 'projects']) {
    if (tables.includes(tbl)) {
      const count = await query('SELECT COUNT(*)::int AS count FROM ' + tbl);
      console.log(`  ${tbl}: ${count.rows[0].count} row(s)`);
    } else {
      console.log(`  ${tbl}: table not found`);
    }
  }

  const tableCount = tables.length;

  return tableCount;
}

async function main() {
  initEnv();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('Database reset tool');
  console.log('Target:', dbUrl.replace(/\/\/.*@/, '//<credentials>@'));
  console.log('');
  console.log('\u26a0\ufe0f  DROPPING ALL TABLES IN PUBLIC SCHEMA');
  console.log('  This will permanently delete all data.');
  console.log('  Extensions (pgcrypto, uuid-ossp) will NOT be affected.\n');

  const ok = await confirmDrop();
  if (!ok) {
    console.log('\nAborted by user.');
    process.exit(0);
  }

  await query('SELECT 1');
  console.log('\nConnection OK. Dropping tables...');

  await dropAllTables();

  const afterDrop = await query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  if (afterDrop.rows.length === 0) {
    console.log('\u2714 All tables dropped successfully');
  } else {
    console.log('\u26a0\ufe0f  Some tables remain:', afterDrop.rows.map(r => r.tablename).join(', '));
  }

  console.log('\n--- Running migrations ---\n');
  await runMigrations();

  console.log('\n--- Post-migration validation ---');
  const tableCount = await validate();

  console.log('\n' + '='.repeat(50));
  console.log('\u2705 Database reset completed');
  console.log('\u2705 Migrations executed successfully');
  console.log('Tables created:', tableCount);
  console.log('Environment: OK');
  console.log('DB: CONNECTED');
  console.log('='.repeat(50));

  process.exit(0);
}

main().catch((err) => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
