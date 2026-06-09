const { Pool } = require('pg');
const { initEnv } = require('../bootstrap/env');

let pool = null;

function getPool() {
  if (pool) return pool;

  initEnv();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    maxUses: 75000,
  });

  pool.on('error', (err) => {
    console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), message: 'Unexpected pool error', error: err.message }));
  });

  return pool;
}

async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function testConnection() {
  const result = await query('SELECT NOW() as now');
  return result.rows[0].now;
}

async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, query, testConnection, close };
