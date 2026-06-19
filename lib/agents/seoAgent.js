const BaseAgent = require('./baseAgent');

class SEOAgent extends BaseAgent {
  constructor(options = {}) {
    super('seo', 'SEO Agent', options);
  }

  async execute(task, context) {
    const start = Date.now();
    this.log('agent.started', { task: task.type });

    try {
      const content = context?.shared?.getArtifact('content') || {};
      const pages = content.pages || [];

      const output = {
        metaTags: this._generateMetaTags(pages, task),
        structuredData: this._generateStructuredData(task),
        performance: this._seoRecommendations(task),
        sitemap: this._generateSitemap(pages),
        robots: this._generateRobots(),
        confidence: 0.9,
      };

      const duration = Date.now() - start;
      this._track(true, duration);
      this.log('agent.completed', { duration });

      return { success: true, output, confidence: 0.9, issues: [], suggestions: this._suggestions(output), metrics: this.metrics, executionTime: duration };
    } catch (err) {
      const duration = Date.now() - start;
      this._track(false, duration);
      return { success: false, output: null, confidence: 0, issues: [{ severity: 'error', message: err.message }], suggestions: [], metrics: this.metrics, executionTime: duration };
    }
  }

  _generateMetaTags(pages, task) {
    return pages.map(p => ({ path: p.path || 'index', title: p.title || '', description: '', keywords: [] }));
  }
  _generateStructuredData(task) { return { '@context': 'https://schema.org', '@type': 'WebSite', name: task.description?.slice(0, 50) || 'Website' }; }
  _seoRecommendations(task) { return { metaDescriptions: true, altTags: true, semanticHtml: true, headingStructure: true }; }
  _generateSitemap(pages) { return pages.map(p => ({ loc: `/${p.path || 'index'}`, priority: p.path === 'index' ? '1.0' : '0.8' })); }
  _generateRobots() { return 'User-agent: *\nAllow: /\n'; }
  _suggestions(output) { return ['Add more meta descriptions', 'Optimize image alt tags']; }
}

module.exports = SEOAgent;
