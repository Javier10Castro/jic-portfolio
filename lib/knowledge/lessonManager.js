class LessonManager {
  constructor() {
    this._lessons = new Map();
    this._counter = 0;
  }

  create(title, content, category) {
    if (!title) throw new Error('title is required');
    if (!content) throw new Error('content is required');
    const id = 'lesson_' + (++this._counter);
    const lesson = {
      id,
      title,
      content,
      category: category || 'general',
      status: 'draft',
      createdAt: new Date().toISOString(),
      publishedAt: null
    };
    this._lessons.set(id, lesson);
    return lesson;
  }

  get(id) {
    if (!id) return null;
    return this._lessons.get(id) || null;
  }

  update(id, updates) {
    const lesson = this._lessons.get(id);
    if (!lesson) return null;
    Object.assign(lesson, updates);
    return lesson;
  }

  findByCategory(category) {
    if (!category) return [];
    return Array.from(this._lessons.values()).filter(l => l.category === category);
  }

  findByStatus(status) {
    if (!status) return [];
    return Array.from(this._lessons.values()).filter(l => l.status === status);
  }

  list() {
    return Array.from(this._lessons.values());
  }

  count() {
    return this._lessons.size;
  }

  remove(id) {
    if (!id) return false;
    return this._lessons.delete(id);
  }

  clear() {
    this._lessons.clear();
    this._counter = 0;
  }
}

module.exports = { LessonManager };
