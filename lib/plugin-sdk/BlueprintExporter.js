class BlueprintExporter {
  constructor() {
    this._exporters = new Map();
  }
  registerFormat(format, exporterFn) {
    this._exporters.set(format, exporterFn);
  }
  export(blueprint, format = 'json') {
    const exporter = this._exporters.get(format);
    if (!exporter) return null;
    return exporter(blueprint);
  }
  listFormats() {
    return Array.from(this._exporters.keys());
  }
}
module.exports = { BlueprintExporter };
