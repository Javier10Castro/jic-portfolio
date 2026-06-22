class ProjectTemplate {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.category = config.category || 'custom';
    this.config = config.config || {};
    this.version = config.version || '1.0.0';
  }
  apply(projectId) { return { projectId, templateId: this.id, applied: true }; }
  getConfig() { return { ...this.config }; }
}
module.exports = { ProjectTemplate };
