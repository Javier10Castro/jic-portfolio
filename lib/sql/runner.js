const { query } = require('../db');

function formatPgError(err, sql) {
  const lines = ['\u2716 Query failed'];
  lines.push('Error: ' + err.message);
  if (err.detail) lines.push('Detail: ' + err.detail);
  if (err.hint) lines.push('Hint: ' + err.hint);
  if (err.code) lines.push('Code: ' + err.code);
  lines.push('');
  lines.push('SQL:');
  lines.push(sql);
  if (err.position) {
    const pos = parseInt(err.position);
    const pointer = ' '.repeat(Math.max(0, pos - 1)) + '^';
    lines.push(pointer);
    lines.push('Position: ' + pos);
  }
  return lines.join('\n');
}

function normalizeSql(input) {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/;$/, '');
}

function buildSqlFromArgs(argv) {
  const flags = new Set(['--file', '--repl', '--json', '--pretty', '--help']);
  const parts = [];
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (flags.has(arg)) {
      if (arg === '--file' && i + 1 < argv.length && !argv[i + 1].startsWith('--')) i++;
      continue;
    }
    if (arg.startsWith('--')) continue;
    parts.push(arg);
  }
  return parts.join(' ');
}

function parseFlags(argv) {
  const flags = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--repl') flags.repl = true;
    if (arg === '--json') flags.json = true;
    if (arg === '--pretty') flags.pretty = true;
    if (arg === '--help') flags.help = true;
    if (arg === '--file' && i + 1 < argv.length) {
      flags.file = argv[i + 1];
      i++;
    }
  }
  return flags;
}

function formatOutput(rows, opts) {
  if (!rows || rows.length === 0) return console.log('(0 rows)');
  if (opts && opts.json) {
    process.stdout.write(JSON.stringify(rows));
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  console.log('\n(' + rows.length + ' row(s))');
}

async function runSql(sqlText) {
  const trimmed = normalizeSql(sqlText);
  if (!trimmed) return null;
  const result = await query(trimmed);
  return result;
}

module.exports = { runSql, formatPgError, normalizeSql, buildSqlFromArgs, parseFlags, formatOutput };
