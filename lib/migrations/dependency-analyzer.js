const fs = require('fs');
const path = require('path');

const CREATE_TABLE_RE = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi;
const REFERENCES_RE = /REFERENCES\s+(?:public\.)?(\w+)\s*\(/gi;
const ALTER_FK_RE = /ALTER\s+TABLE\s+(?:public\.)?(\w+)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\([^)]+\)\s+REFERENCES\s+(?:public\.)?(\w+)\s*\(/gi;

function extractMatches(sql, regex) {
  const results = new Set();
  regex.lastIndex = 0;
  let m;
  while ((m = regex.exec(sql)) !== null) results.add(m[1].toLowerCase());
  return results;
}

function parseCreateTables(sql) {
  return extractMatches(sql, CREATE_TABLE_RE);
}

function parseReferences(sql) {
  const refs = new Set();
  for (const t of extractMatches(sql, REFERENCES_RE)) refs.add(t);
  for (const t of extractMatches(sql, ALTER_FK_RE)) refs.add(t);
  return refs;
}

function parseMigration(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  return { tables: parseCreateTables(sql), refs: parseReferences(sql) };
}

function analyze(migrationsDir) {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  if (!files.length) return { order: [], graph: [], warnings: [] };

  const parsed = files.map(f => ({ name: f, ...parseMigration(path.join(migrationsDir, f)) }));

  const allTables = new Set();
  for (const m of parsed) for (const t of m.tables) allTables.add(t);

  const warnings = [];
  for (const m of parsed) {
    for (const ref of m.refs) {
      if (m.tables.has(ref)) continue;
      if (allTables.has(ref)) continue;
      const definedIn = parsed.find(o => o.tables.has(ref));
      if (!definedIn) warnings.push('"' + ref + '" referenced in ' + m.name + ' is not defined in any migration');
    }
  }

  const graph = [];
  for (const m of parsed) {
    const deps = [];
    for (const ref of m.refs) {
      if (m.tables.has(ref)) continue;
      const def = parsed.find(o => o.tables.has(ref) && o !== m);
      if (def) deps.push(def.name);
    }
    graph.push({ name: m.name, tables: [...m.tables], refs: [...m.refs], deps });
  }

  const order = topologicalSort(graph);
  return { order, graph, warnings };
}

function topologicalSort(graph) {
  const UNVISITED = 0, VISITING = 1, VISITED = 2;
  const state = new Map();
  const order = [];
  const cyclePath = [];

  for (const n of graph) state.set(n.name, UNVISITED);

  function dfs(name) {
    if (state.get(name) === VISITED) return;
    if (state.get(name) === VISITING) {
      const idx = cyclePath.indexOf(name);
      const cycle = cyclePath.slice(idx).concat(name);
      throw new Error('Circular dependency detected: ' + cycle.join(' -> '));
    }
    state.set(name, VISITING);
    cyclePath.push(name);
    const node = graph.find(n => n.name === name);
    if (node) for (const dep of node.deps) dfs(dep);
    state.set(name, VISITED);
    cyclePath.pop();
    order.push(name);
  }

  for (const n of graph) dfs(n.name);
  return order;
}

module.exports = { analyze, parseCreateTables, parseReferences, topologicalSort };
