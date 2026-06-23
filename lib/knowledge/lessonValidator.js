class LessonValidator {
  constructor() {
    this._validations = [];
    this._counter = 0;
  }

  validate(lessonId, lesson) {
    if (!lessonId) throw new Error('lessonId is required');
    if (!lesson) throw new Error('lesson is required');
    const id = 'lval_' + (++this._counter);
    const issues = [];
    if (!lesson.title || lesson.title.trim().length === 0) {
      issues.push({ field: 'title', message: 'Title is required' });
    }
    if (!lesson.content || lesson.content.trim().length === 0) {
      issues.push({ field: 'content', message: 'Content is required' });
    }
    if (lesson.title && lesson.title.length < 5) {
      issues.push({ field: 'title', message: 'Title is too short (min 5 chars)' });
    }
    if (lesson.content && lesson.content.length < 20) {
      issues.push({ field: 'content', message: 'Content is too short (min 20 chars)' });
    }
    const valid = issues.length === 0;
    const validation = {
      id,
      lessonId,
      valid,
      issues,
      validatedAt: new Date().toISOString()
    };
    this._validations.push(validation);
    return validation;
  }

  get(id) {
    if (!id) return null;
    return this._validations.find(v => v.id === id) || null;
  }

  list() {
    return this._validations;
  }

  clear() {
    this._validations = [];
    this._counter = 0;
  }
}

module.exports = { LessonValidator };
