const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  pool.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err.message);
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
