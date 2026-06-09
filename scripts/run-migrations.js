const fs = require('fs');
const path = require('path');
const { initEnv } = require('../lib/bootstrap/env');
initEnv();
const { query } = require('../lib/db');
const { analyze } = require('../lib/migrations/dependency-analyzer');
const { formatPgError } = require('../lib/sql/runner');

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'data', 'migrations');

async function ensureTrackingTable() {
  await query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await query('CREATE INDEX IF NOT EXISTS idx_schema_migrations_name ON schema_migrations(name)');
  await query('CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON schema_migrations(executed_at)');
}

async function isExecuted(name) {
  const r = await query('SELECT id FROM schema_migrations WHERE name = $1', [name]);
  return r.rows.length > 0;
}

async function markExecuted(name) {
  await query('INSERT INTO schema_migrations (id, name) VALUES (gen_random_uuid(), $1)', [name]);
}

async function runMigrations() {
  await ensureTrackingTable();

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
    process.exit(0);
  }

  console.log('Checking', order.length, 'migration(s) against tracking table\n');

  let executed = 0, skipped = 0;

  for (const file of order) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8').trim();

    if (!sql) {
      console.log('  \u26a0\ufe0f Skipping empty migration:', file);
      continue;
    }

    const alreadyRan = await isExecuted(file);

    if (alreadyRan) {
      console.log('\u2714 Skipping migration:', file, '(already executed)');
      skipped++;
      continue;
    }

    console.log('\u25b6 Running migration:', file);

    try {
      await query(sql);
      await markExecuted(file);
      console.log('\u2714 Migration completed:', file);
      executed++;
    } catch (err) {
      console.error(formatPgError(err, sql.substring(0, 200)));
      process.exit(1);
    }
  }

  console.log('');
  if (skipped > 0 && executed === 0) {
    console.log('\u2714 All migrations already up-to-date (' + skipped + ' skipped)');
  } else {
    console.log('\u2714 Migrations complete —', executed, 'executed,', skipped, 'skipped');
  }

  process.exit(0);
}

runMigrations();
