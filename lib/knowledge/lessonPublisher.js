class LessonPublisher {
  constructor() {
    this._publications = [];
    this._counter = 0;
  }

  publish(lessonId, lesson, channel) {
    if (!lessonId) throw new Error('lessonId is required');
    if (!lesson) throw new Error('lesson is required');
    const id = 'lpub_' + (++this._counter);
    const publication = {
      id,
      lessonId,
      lesson: { title: lesson.title, content: lesson.content, category: lesson.category },
      channel: channel || 'internal',
      publishedAt: new Date().toISOString()
    };
    this._publications.push(publication);
    return publication;
  }

  get(id) {
    if (!id) return null;
    return this._publications.find(p => p.id === id) || null;
  }

  findByChannel(channel) {
    if (!channel) return [];
    return this._publications.filter(p => p.channel === channel);
  }

  list() {
    return this._publications;
  }

  clear() {
    this._publications = [];
    this._counter = 0;
  }
}

module.exports = { LessonPublisher };
