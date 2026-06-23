class DefaultPatterns {
  constructor() {
    this._patterns = new Map();
  }

  load() {
    const defaults = [
      { name: 'Layered', category: 'structural', description: 'Layered architecture pattern with horizontal separation of concerns',
        characteristics: ['separation-of-concerns', 'testability', 'maintainability'], suitable: ['enterprise-apps', 'web-apps'] },
      { name: 'Hexagonal', category: 'structural', description: 'Hexagonal (Ports and Adapters) architecture pattern',
        characteristics: ['testability', 'domain-centric', 'loose-coupling'], suitable: ['domain-driven', 'test-heavy'] },
      { name: 'Event Driven', category: 'messaging', description: 'Event-driven architecture for asynchronous communication',
        characteristics: ['scalability', 'loose-coupling', 'asynchronous'], suitable: ['real-time', 'microservices'] },
      { name: 'Microservices', category: 'structural', description: 'Microservices architecture for independently deployable services',
        characteristics: ['scalability', 'independence', 'resilience'], suitable: ['large-teams', 'cloud-native'] },
      { name: 'Modular Monolith', category: 'structural', description: 'Modular monolith with strong module boundaries in a single deployment',
        characteristics: ['simplicity', 'performance', 'evolution'], suitable: ['startups', 'small-teams', 'mvp'] },
      { name: 'Serverless', category: 'deployment', description: 'Serverless architecture using FaaS and managed services',
        characteristics: ['cost-efficiency', 'auto-scaling', 'ops-reduction'], suitable: ['event-driven', 'variable-load'] },
      { name: 'Pipeline', category: 'processing', description: 'Pipeline architecture for sequential data processing stages',
        characteristics: ['throughput', 'deterministic', 'pluggable'], suitable: ['data-processing', 'ci-cd', 'etl'] },
      { name: 'AI Native', category: 'ai', description: 'AI-native architecture with agents, embeddings, and LLM integration at its core',
        characteristics: ['agentic', 'context-aware', 'adaptive'], suitable: ['ai-agents', 'rag', 'intelligent-automation'] }
    ];
    for (const p of defaults) {
      this._patterns.set(p.name, p);
    }
    return defaults;
  }

  get(name) {
    if (!name) return null;
    return this._patterns.get(name) || null;
  }

  list() {
    return Array.from(this._patterns.values());
  }

  clear() {
    this._patterns.clear();
  }
}

module.exports = { DefaultPatterns };
