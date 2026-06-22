function createProvider(config = {}) {
  let connected = false;
  let simulation = !config.host;
  return {
    name: 'PostgreSQL',
    type: 'postgres',
    connect(cfg) { config = cfg || config; simulation = !config.host; connected = true; return { connected: true, simulation }; },
    disconnect() { connected = false; },
    query(sql, params) { return { rows: [], fields: [], rowCount: 0, simulation }; },
    execute(sql, params) { return { affectedRows: 0, simulation }; },
    isConnected() { return connected; },
    getStatus() { return { type: 'postgres', connected, simulation, config: config ? { host: config.host, database: config.database } : null }; },
  };
}
module.exports = { createProvider };
