class ProjectTemplates {
  constructor() {
    this._templates = new Map();
  }

  registerTemplate(template) {
    if (!template || !template.id || !template.name) {
      throw new Error('Template must have id and name');
    }
    if (this._templates.has(template.id)) {
      throw new Error(`Template "${template.id}" already registered`);
    }
    const entry = {
      id: template.id,
      name: template.name,
      description: template.description || '',
      category: template.category || 'general',
      config: template.config || {},
      version: template.version || '1.0.0'
    };
    this._templates.set(template.id, entry);
    return entry;
  }

  getTemplate(id) {
    return this._templates.get(id) || null;
  }

  listTemplates(category) {
    let templates = Array.from(this._templates.values());
    if (category !== undefined) {
      templates = templates.filter(t => t.category === category);
    }
    return templates;
  }

  applyTemplate(projectId, templateId) {
    if (!projectId) throw new Error('Project ID is required');
    const template = this._templates.get(templateId);
    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }
    return { ...template.config };
  }

  removeTemplate(id) {
    return this._templates.delete(id);
  }

  clear() {
    this._templates.clear();
  }
}

module.exports = { ProjectTemplates };
