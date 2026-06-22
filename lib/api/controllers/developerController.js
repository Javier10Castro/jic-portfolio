const { DeveloperPlatform, createPlatform } = require('../../developer');

const platform = new DeveloperPlatform();

function generateSdk(req) {
  const { language, options } = req.body || {};
  const result = platform.generateSdk(language || 'javascript', options);
  return { success: true, data: result.sdk };
}

function generateOpenApi(req) {
  const { version } = req.params || req.query || {};
  const result = platform.generateOpenApi(version || '4.5.0');
  return { success: true, data: result.spec };
}

function getSchema(req) {
  const { domain } = req.params;
  if (domain) {
    const result = platform.generateSchema(domain);
    return { success: true, data: result.schema || result.schemas };
  }
  const result = platform.generateSchema();
  return { success: true, data: result.schemas };
}

function generatePostman(req) {
  const result = platform.generatePostman();
  return { success: true, data: result.collection };
}

function generateTerraform(req) {
  const result = platform.generateTerraform();
  return { success: true, data: result };
}

function generateGitHubAction(req) {
  const result = platform.generateGitHubAction();
  return { success: true, data: result };
}

function generateClient(req) {
  const { language, spec } = req.body || {};
  if (!language) return { success: false, error: 'language is required' };
  const result = platform.generateClient(language, spec);
  return { success: true, data: result.client };
}

function getStatus(req) {
  return { success: true, data: platform.getStatus() };
}

function getPortal(req) {
  return { success: true, data: platform.getPortal() };
}

function getAnalytics(req) {
  return { success: true, data: platform.getAnalytics() };
}

module.exports = { generateSdk, generateOpenApi, getSchema, generatePostman, generateTerraform, generateGitHubAction, generateClient, getStatus, getPortal, getAnalytics };
