const { pageContent } = require('./pageContentGenerator');
const { buildToneProfile } = require('./toneEngine');
const { seoForPage } = require('./seoGenerator');
const { validateContentPack } = require('./validateContentPack');

function generateContent(blueprint, designStrategy) {
  const pages = blueprint.pages || [];
  const lang = detectLanguage(blueprint);
  const toneProfile = buildToneProfile(designStrategy);

  const contentPages = [];
  for (const page of pages) {
    contentPages.push(pageContent(page, blueprint, designStrategy, toneProfile, lang));
  }

  const contentPack = {
    meta: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      source: 'content_generator',
      blueprintVersion: blueprint.meta ? blueprint.meta.version : 'unknown',
      designStrategyVersion: designStrategy.meta ? designStrategy.meta.version : 'unknown',
      language: lang,
    },
    pages: contentPages,
    global: {
      brandVoice: {
        tone: designStrategy.brand.brandTone,
        values: designStrategy.brand.brandValues,
        profile: toneProfile,
      },
      ctaLibrary: buildGlobalCtaLibrary(toneProfile, lang),
      seoDefaults: {
        siteName: blueprint.project.name,
        siteDescription: blueprint.project.tagline || '',
        language: lang,
      },
    },
  };

  return validateContentPack(contentPack);
}

function detectLanguage(blueprint) {
  return 'en';
}

function buildGlobalCtaLibrary(toneProfile, lang) {
  const ctaMap = {
    en: {
      primary: 'Get Started',
      secondary: 'Learn More',
      tertiary: 'Contact Us',
      shop: 'Shop Now',
      book: 'Book Now',
      subscribe: 'Subscribe',
    },
    es: {
      primary: 'Comenzar',
      secondary: 'Saber Más',
      tertiary: 'Contáctanos',
      shop: 'Comprar Ahora',
      book: 'Reservar',
      subscribe: 'Suscribirse',
    },
  };

  const ctas = ctaMap[lang] || ctaMap.en;
  return Object.values(ctas).map(text => ({ text }));
}

module.exports = { generateContent };
