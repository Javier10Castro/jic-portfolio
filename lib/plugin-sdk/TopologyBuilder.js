class TopologyBuilder {
  constructor(name) {
    this._name = name;
    this._builders = [];
  }
  addBuilder(fn) {
    this._builders.push(fn);
  }
  build(context) {
    const results = this._builders.map(fn => fn(context));
    const components = results.flatMap(r => r.components || []);
    const connections = results.flatMap(r => r.connections || []);
    return { components, connections };
  }
}
module.exports = { TopologyBuilder };
