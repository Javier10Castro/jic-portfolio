const BaseAgent = require('./baseAgent');

class ContentAgent extends BaseAgent {
  constructor(options = {}) {
    super('content', 'Content Agent', options);
  }

  async execute(task, context) {
    const start = Date.now();
    this.log('agent.started', { task: task.type });

    try {
      const prompt = `Generate content for a ${task.type || 'website'}.\n${task.description || ''}\nTone: ${task.requirements?.tone || 'professional'}`;
      const response = await this._simulate(prompt, 'content');

      const output = {
        pages: this._generatePageContent(task),
        global: { brandVoice: { tone: task.requirements?.tone || 'professional' }, ctaLibrary: [], seoDefaults: {} },
        wordCount: 500,
        confidence: 0.78,
        raw: response,
      };

      const duration = Date.now() - start;
      this._track(true, duration);
      this.log('agent.completed', { duration });

      return { success: true, output, confidence: 0.78, issues: [], suggestions: [], metrics: this.metrics, executionTime: duration };
    } catch (err) {
      const duration = Date.now() - start;
      this._track(false, duration);
      return { success: false, output: null, confidence: 0, issues: [{ severity: 'error', message: err.message }], suggestions: [], metrics: this.metrics, executionTime: duration };
    }
  }

  _generatePageContent(task) {
    return [
      { path: 'index', title: 'Home', sections: [{ id: 'hero', copy: 'Welcome' }, { id: 'features', copy: 'Our features' }] },
      { path: 'about', title: 'About', sections: [{ id: 'story', copy: 'Our story' }] },
    ];
  }
}

module.exports = ContentAgent;
