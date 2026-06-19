const websiteBuilder = require('../../generator');
const ai = require('../../ai');

function generateWebsiteWithAI(contentPack, blueprint, designStrategy, options = {}) {
  const useAI = options.useAI !== false && process.env.AI_GENERATOR !== 'off';

  if (!useAI) {
    return websiteBuilder.generateWebsite(contentPack, blueprint, designStrategy);
  }

  return websiteBuilder.generateWebsite(contentPack, blueprint, designStrategy);
}

async function enhanceWithAI(websiteResult, options = {}) {
  const files = websiteResult.files || {};
  const enhanced = { ...websiteResult, files: { ...files } };

  for (const [filename, content] of Object.entries(files)) {
    if (typeof content === 'string' && content.length > 50 && options.enhanceAll !== false) {
      try {
        const result = await ai.generate(
          `Review and improve this ${filename} code. Return ONLY the improved code, no explanations:\n\n${content.slice(0, 3000)}`,
          { context: 'code', strategy: 'quality', preferredProvider: 'openai', ...options }
        );
        if (result.text && result.text.length > content.length * 0.5) {
          enhanced.files[filename] = result.text;
        }
      } catch {
        // keep original on failure
      }
    }
  }

  return enhanced;
}

module.exports = { generateWebsiteWithAI, enhanceWithAI };
