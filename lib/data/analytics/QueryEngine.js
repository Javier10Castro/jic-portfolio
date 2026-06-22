class QueryEngine {
  constructor() { this._warehouses = {}; }
  register(name, warehouse) { this._warehouses[name] = warehouse; }
  execute(warehouseName, tableName, query) {
    const wh = this._warehouses[warehouseName];
    if (!wh) return { success: false, error: 'Warehouse not found' };
    return wh.query(tableName, query);
  }
  explain(query) { return { success: true, plan: [{ operation: 'scan', estimatedRows: 100 }, { operation: 'filter', estimatedRows: 10 }] }; }
  list() { return Object.keys(this._warehouses); }
  clear() { this._warehouses = {}; }
}
module.exports = { QueryEngine };
