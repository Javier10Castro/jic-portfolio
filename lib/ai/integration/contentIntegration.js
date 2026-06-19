const contentGenerator = require('../../content-generator');
const ai = require('../../ai');

function generateContentWithAI(blueprint, designStrategy, options = {}) {
  const useAI = options.useAI !== false && process.env.AI_CONTENT !== 'off';

  if (!useAI) {
    return contentGenerator.generateContent(blueprint, designStrategy);
  }

  const contentPack = contentGenerator.generateContent(blueprint, designStrategy);

  return contentPack;
}

async function enhanceContentWithAI(contentPack, options = {}) {
  if (!options.enhanceCopy) return contentPack;

  const pages = contentPack.pages || [];
  const enhancedPages = [];

  for (const page of pages) {
    const sections = page.sections || [];
    const enhancedSections = [];

    for (const section of sections) {
      if (!section.copy || section.copy.length < 10) {
        enhancedSections.push(section);
        continue;
      }

      try {
        const systemPrompt = `You are a professional copywriter. Improve the following website copy while maintaining the brand voice, tone, and message. Return ONLY the improved copy text.`;
        const result = await ai.generate(section.copy, {
          context: 'content',
          strategy: 'quality',
          systemPrompt,
          preferredProvider: 'anthropic',
          ...options,
        });
        enhancedSections.push({ ...section, copy: result.text, aiEnhanced: true });
      } catch {
        enhancedSections.push(section);
      }
    }

    enhancedPages.push({ ...page, sections: enhancedSections });
  }

  return { ...contentPack, pages: enhancedPages, aiEnhanced: true };
}

module.exports = { generateContentWithAI, enhanceContentWithAI };
