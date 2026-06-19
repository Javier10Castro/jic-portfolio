class ContentPackValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ContentPackValidationError';
    this.details = details;
  }
}

function validateContentPack(contentPack) {
  if (!contentPack || typeof contentPack !== 'object') {
    throw new ContentPackValidationError('Content pack must be an object', { received: typeof contentPack });
  }

  if (!Array.isArray(contentPack.pages)) {
    throw new ContentPackValidationError('Content pack must contain a pages array', { pages: contentPack.pages });
  }

  if (contentPack.pages.length === 0) {
    throw new ContentPackValidationError('Content pack must contain at least one page');
  }

  for (let i = 0; i < contentPack.pages.length; i++) {
    validatePage(contentPack.pages[i], i);
  }

  if (!contentPack.global || typeof contentPack.global !== 'object') {
    throw new ContentPackValidationError('Content pack must contain a global object', { global: contentPack.global });
  }

  if (!contentPack.global.brandVoice || typeof contentPack.global.brandVoice !== 'object') {
    throw new ContentPackValidationError('global.brandVoice is required');
  }

  if (!contentPack.global.ctaLibrary || !Array.isArray(contentPack.global.ctaLibrary)) {
    throw new ContentPackValidationError('global.ctaLibrary must be an array');
  }

  if (!contentPack.global.seoDefaults || typeof contentPack.global.seoDefaults !== 'object') {
    throw new ContentPackValidationError('global.seoDefaults is required');
  }

  return contentPack;
}

function validatePage(page, index) {
  if (!page.path) {
    throw new ContentPackValidationError('Page at index ' + index + ' must have a path', { page });
  }

  if (!page.title) {
    throw new ContentPackValidationError('Page at index ' + index + ' (' + page.path + ') must have a title', { page });
  }

  if (!page.seo || typeof page.seo !== 'object') {
    throw new ContentPackValidationError('Page ' + page.path + ' must have a seo object');
  }

  if (!page.seo.title || !page.seo.description) {
    throw new ContentPackValidationError('Page ' + page.path + ' seo must have title and description');
  }

  if (!Array.isArray(page.sections)) {
    throw new ContentPackValidationError('Page ' + page.path + ' must have a sections array');
  }

  for (let j = 0; j < page.sections.length; j++) {
    validateSection(page.sections[j], page.path, j);
  }
}

function validateSection(section, pagePath, index) {
  if (!section.id) {
    throw new ContentPackValidationError('Section at index ' + index + ' in page ' + pagePath + ' must have an id', { section });
  }
}

module.exports = { validateContentPack, ContentPackValidationError };
