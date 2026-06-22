function createProvider(config = {}) {
  let connected = false;
  let simulation = !config.host;
  return {
    name: 'Elasticsearch',
    type: 'elastic',
    connect(cfg) { config = cfg || config; simulation = !config.host; connected = true; return { connected: true, simulation }; },
    disconnect() { connected = false; },
    query(sql, params) { return { rows: [], fields: [], rowCount: 0, simulation }; },
    execute(sql, params) { return { affectedRows: 0, simulation }; },
    isConnected() { return connected; },
    getStatus() { return { type: 'elastic', connected, simulation, config: config ? { host: config.host, database: config.database } : null }; },
  };
}
module.exports = { createProvider };
