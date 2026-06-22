class DatabaseProvider {
  constructor(config) {
    this.name = config.name;
    this.type = config.type || 'database';
    this.dialect = config.dialect || 'sql';
    this._queries = {};
  }
  registerQuery(name, handler) { this._queries[name] = handler; }
  execute(name, params) { const h = this._queries[name]; return h ? h(params) : null; }
  getQueries() { return { ...this._queries }; }
}
module.exports = { DatabaseProvider };
