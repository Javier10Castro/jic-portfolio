class KnowledgeEvents {
  static EVENTS = {
    KNOWLEDGE_INGESTED: 'knowledge:ingested',
    KNOWLEDGE_PROCESSED: 'knowledge:processed',
    KNOWLEDGE_INDEXED: 'knowledge:indexed',
    KNOWLEDGE_QUERIED: 'knowledge:queried',
    KNOWLEDGE_GRAPH_UPDATED: 'knowledge:graph:updated',
    KNOWLEDGE_GRAPH_VERSIONED: 'knowledge:graph:versioned',
    PATTERN_DISCOVERED: 'knowledge:pattern:discovered',
    PATTERN_MINED: 'knowledge:pattern:mined',
    BEST_PRACTICE_EXTRACTED: 'knowledge:bestpractice:extracted',
    ANTI_PATTERN_DETECTED: 'knowledge:antipattern:detected',
    RECOMMENDATION_GENERATED: 'knowledge:recommendation:generated',
    CASE_STORED: 'knowledge:case:stored',
    CASE_RETRIEVED: 'knowledge:case:retrieved',
    LESSON_EXTRACTED: 'knowledge:lesson:extracted',
    LESSON_VALIDATED: 'knowledge:lesson:validated',
    LESSON_PUBLISHED: 'knowledge:lesson:published',
    ENTITY_CREATED: 'knowledge:entity:created',
    RELATIONSHIP_CREATED: 'knowledge:relationship:created'
  };

  constructor() {
    this._listeners = new Map();
  }

  on(event, listener) {
    if (!event || typeof listener !== 'function') {
      throw new Error('event must be a non-empty string and listener must be a function');
    }
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(listener);
    return this;
  }

  off(event, listener) {
    if (!event || !listener) return this;
    const listeners = this._listeners.get(event);
    if (!listeners) return this;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    if (listeners.length === 0) {
      this._listeners.delete(event);
    }
    return this;
  }

  emit(event, ...args) {
    if (!event) throw new Error('event must be a non-empty string');
    const listeners = this._listeners.get(event);
    if (!listeners) return false;
    listeners.forEach(listener => {
      try { listener(...args); } catch (err) {}
    });
    return true;
  }

  listEvents() {
    return Array.from(this._listeners.keys());
  }

  clear() {
    this._listeners.clear();
  }
}

module.exports = { KnowledgeEvents };
