class KnowledgeBase {
  getName() {
    return 'Knowledge Base';
  }

  getDescription() {
    return 'A knowledge base application template';
  }

  getModules() {
    return ['documents', 'search', 'categories', 'versions', 'ai-assistant', 'feedback', 'analytics'];
  }

  getCapabilities() {
    return ['document-management', 'search-engine', 'category-management', 'versioning', 'ai-assistant', 'feedback-collection', 'analytics'];
  }

  getConfig() {
    return {
      name: 'Knowledge Base',
      documents: { formats: ['md', 'html', 'pdf'] },
      search: { engine: 'fulltext' },
      categories: { maxDepth: 3 },
      versions: { enabled: true },
      aiAssistant: { enabled: false },
      feedback: { enabled: true },
      analytics: { enabled: false },
    };
  }

  apply(customizations) {
    if (!customizations) return this.getConfig();
    const base = this.getConfig();
    return { ...base, ...customizations };
  }
}

module.exports = { KnowledgeBase };
