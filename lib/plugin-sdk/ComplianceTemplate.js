class ComplianceTemplate {
  constructor(config) {
    this.name = config.name;
    this.sections = config.sections || [];
    this.format = config.format || 'markdown';
    this.metadata = config.metadata || {};
  }

  render(data) {
    var output = '';
    for (var i = 0; i < this.sections.length; i++) {
      var section = this.sections[i];
      output += '## ' + section.title + '\n\n';
      if (section.content) output += section.content + '\n\n';
      if (section.dynamic) {
        var resolved = typeof section.dynamic === 'function' ? section.dynamic(data) : data[section.dynamic];
        if (resolved) output += resolved + '\n\n';
      }
    }
    return output;
  }
}

module.exports = { ComplianceTemplate };
