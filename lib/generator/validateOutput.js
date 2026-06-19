class GeneratedWebsiteValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'GeneratedWebsiteValidationError';
    this.details = details || {};
  }
}

function validateOutput(output) {
  if (!output || typeof output !== 'object') {
    throw new GeneratedWebsiteValidationError('Output must be an object', { received: typeof output });
  }

  if (!output.files || typeof output.files !== 'object') {
    throw new GeneratedWebsiteValidationError('Output must contain a files object');
  }

  var fileCount = Object.keys(output.files).length;
  if (fileCount === 0) {
    throw new GeneratedWebsiteValidationError('Output must contain at least one file');
  }

  var hasIndex = false;
  var hasStyles = false;
  var hasScript = false;

  for (var filePath in output.files) {
    if (!output.files.hasOwnProperty(filePath)) continue;
    var content = output.files[filePath];

    if (typeof content !== 'string') {
      throw new GeneratedWebsiteValidationError('File ' + filePath + ' content must be a string');
    }

    if (content.length === 0) {
      throw new GeneratedWebsiteValidationError('File ' + filePath + ' is empty');
    }

    if (filePath === '/dist/index.html') {
      hasIndex = true;
      if (content.indexOf('<!DOCTYPE html>') === -1) {
        throw new GeneratedWebsiteValidationError('index.html must contain DOCTYPE');
      }
      if (content.indexOf('<html') === -1) {
        throw new GeneratedWebsiteValidationError('index.html must contain <html> tag');
      }
      if (content.indexOf('</html>') === -1) {
        throw new GeneratedWebsiteValidationError('index.html must contain closing </html>');
      }
      if (content.indexOf('<nav') === -1) {
        throw new GeneratedWebsiteValidationError('index.html must contain navigation');
      }
      if (content.indexOf('assets/styles.css') === -1) {
        throw new GeneratedWebsiteValidationError('index.html must reference styles.css');
      }
    }

    if (filePath.indexOf('.html') !== -1 && filePath.indexOf('/dist/') !== -1) {
      if (content.indexOf('<!DOCTYPE html>') === -1) {
        throw new GeneratedWebsiteValidationError(filePath + ' must contain DOCTYPE');
      }
    }

    if (filePath === '/dist/assets/styles.css') {
      hasStyles = true;
      if (content.indexOf(':root') === -1) {
        throw new GeneratedWebsiteValidationError('styles.css must contain :root selector');
      }
      if (content.indexOf('--accent') === -1) {
        throw new GeneratedWebsiteValidationError('styles.css must contain design tokens');
      }
    }

    if (filePath === '/dist/assets/script.js') {
      hasScript = true;
    }
  }

  if (!hasIndex) {
    throw new GeneratedWebsiteValidationError('Output must include /dist/index.html');
  }

  if (!hasStyles) {
    throw new GeneratedWebsiteValidationError('Output must include /dist/assets/styles.css');
  }

  if (!output.meta || typeof output.meta !== 'object') {
    throw new GeneratedWebsiteValidationError('Output must contain meta object');
  }

  if (typeof output.meta.pagesGenerated !== 'number' || output.meta.pagesGenerated < 1) {
    throw new GeneratedWebsiteValidationError('meta.pagesGenerated must be a positive number');
  }

  if (typeof output.meta.buildTimeMs !== 'number') {
    throw new GeneratedWebsiteValidationError('meta.buildTimeMs must be a number');
  }

  return output;
}

module.exports = { validateOutput, GeneratedWebsiteValidationError };
