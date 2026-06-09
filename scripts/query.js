const fs = require('fs');
const { initEnv } = require('../lib/bootstrap/env');
initEnv();
const { buildSqlFromArgs, parseFlags, runSql, formatOutput, formatPgError } = require('../lib/sql/runner');

const flags = parseFlags(process.argv);

async function run(sqlText, opts) {
  try {
    const result = await runSql(sqlText);
    if (!result) return;
    if (result.command === 'INSERT' || result.command === 'UPDATE' || result.command === 'DELETE') {
      console.log(result.command + ' ' + result.rowCount + ' row(s)');
      if (result.rows.length) formatOutput(result.rows, opts);
    } else if (['CREATE', 'DROP', 'ALTER', 'TRUNCATE'].includes(result.command)) {
      console.log(result.command + ' completed (' + (result.rowCount || 0) + ')');
    } else {
      formatOutput(result.rows, opts);
    }
  } catch (err) {
    console.error(formatPgError(err, sqlText));
    process.exit(1);
  }
}

function usage() {
  console.log('SQL Query Tool');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/query.js "<sql>"');
  console.log('  node scripts/query.js --file <path>');
  console.log('  node scripts/query.js --repl');
  console.log('');
  console.log('Flags:');
  console.log('  --file <path>    Read SQL from file');
  console.log('  --repl           Interactive REPL mode');
  console.log('  --json           Compact JSON output (no pretty-print)');
  console.log('  --pretty         Pretty-print output (default)');
  console.log('  --help           Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/query.js "SELECT NOW();"');
  console.log('  node scripts/query.js "SELECT * FROM workspaces;"');
  console.log('  node scripts/query.js "SELECT * FROM users WHERE email=\'test@test.com\';"');
  console.log('  node scripts/query.js "SELECT tablename FROM pg_tables WHERE schemaname=\'public\' ORDER BY tablename;"');
  console.log('  node scripts/query.js --file ./query.sql');
  console.log('  node scripts/query.js --repl');
  process.exit(1);
}

async function main() {
  if (flags.help) { usage(); return; }

  if (flags.repl) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'db> ' });
    console.log('SQL REPL (exit or .q to quit)\n');
    rl.prompt();
    rl.on('line', async (line) => {
      const t = line.trim();
      if (!t) { rl.prompt(); return; }
      if (t === 'exit' || t === '.q') { rl.close(); return; }
      await run(t, flags);
      rl.prompt();
    });
    rl.on('close', () => { console.log(''); process.exit(0); });
    return;
  }

  if (flags.file) {
    if (!fs.existsSync(flags.file)) {
      console.error('File not found: ' + flags.file);
      process.exit(1);
    }
    const content = fs.readFileSync(flags.file, 'utf8');
    if (!content.trim()) { console.log('(empty file)'); return; }
    await run(content.trim(), flags);
    process.exit(0);
    return;
  }

  const sql = buildSqlFromArgs(process.argv);
  if (!sql) { usage(); return; }
  await run(sql, flags);
  process.exit(0);
}

main().catch((err) => { console.error('Fatal:', err.message); process.exit(1); });
