class ProjectExporter {
  constructor() {
    this._exports = [];
    this._counter = 0;
  }

  exportProject(projectId, format) {
    if (!projectId || !format) {
      throw new Error('projectId and format are required');
    }
    const validFormats = ['json', 'yaml'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format "${format}". Must be one of: ${validFormats.join(', ')}`);
    }
    const data = { projectId, exported: true, timestamp: new Date().toISOString() };
    const size = JSON.stringify(data).length;
    const result = { data, format, exportedAt: new Date().toISOString(), size };
    this._exports.push({ projectId, ...result });
    return result;
  }

  exportBundle(projectIds, format) {
    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      throw new Error('projectIds must be a non-empty array');
    }
    const validFormats = ['json', 'yaml'];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format "${format}"`);
    }
    const projects = projectIds.map(id => ({ projectId: id, exported: true }));
    const data = { bundle: projects, exportedAt: new Date().toISOString() };
    const size = JSON.stringify(data).length;
    const result = { data, format, exportedAt: new Date().toISOString(), size };
    this._exports.push({ projectIds, bundle: true, ...result });
    return result;
  }

  exportTemplate(projectId, templateName) {
    if (!projectId || !templateName) {
      throw new Error('projectId and templateName are required');
    }
    const data = {
      templateName,
      projectId,
      config: {},
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
    const size = JSON.stringify(data).length;
    const result = { data, format: 'json', exportedAt: new Date().toISOString(), size };
    this._exports.push({ projectId, templateName, type: 'template', ...result });
    return result;
  }

  getExportHistory() {
    return [...this._exports];
  }

  clear() {
    this._exports = [];
  }
}

module.exports = { ProjectExporter };
