class ComplianceTemplates {
  constructor() {
    this.templates = new Map();
  }

  registerTemplate(name, template) {
    if (!name || !template) return;
    this.templates.set(name, {
      name, sections: template.sections || [], format: template.format || 'markdown'
    });
  }

  getTemplate(name) {
    return this.templates.get(name) || null;
  }

  listTemplates() {
    return Array.from(this.templates.values());
  }

  render(templateName, data) {
    const template = this.templates.get(templateName);
    if (!template || !data) return '';
    let output = '';
    for (const section of template.sections) {
      if (section.type === 'header') output += `# ${this._interpolate(section.content, data)}\n\n`;
      else if (section.type === 'summary') {
        output += `## Summary\n`;
        output += `- **Score:** ${data.score || 0}/100\n`;
        output += `- **Total:** ${data.total || 0}\n`;
        output += `- **Compliant:** ${data.compliant || 0}\n`;
        output += `- **Violations:** ${data.violations || 0}\n\n`;
      } else if (section.type === 'findings' && Array.isArray(data.findings)) {
        output += `## Findings\n\n`;
        if (data.findings.length === 0) output += 'No violations found.\n\n';
        else {
          for (const finding of data.findings) {
            output += `### ${finding.policyId}\n`;
            if (Array.isArray(finding.issues)) {
              for (const issue of finding.issues) {
                output += `- ${issue.field}: expected ${issue.expected}, got ${issue.actual}\n`;
              }
            }
            output += '\n';
          }
        }
      } else if (section.type === 'custom' && section.content) {
        output += `${this._interpolate(section.content, data)}\n\n`;
      }
    }
    return output;
  }

  _interpolate(template, data) {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] !== undefined ? data[key] : `{{${key}}}`);
  }

  removeTemplate(name) {
    this.templates.delete(name);
  }

  clear() {
    this.templates.clear();
  }
}

module.exports = new ComplianceTemplates();
