function brandingStrategy(blueprint) {
  const type = blueprint.project.type;
  const pages = blueprint.pages || [];
  const sections = (blueprint.sections && blueprint.sections.registry) || [];
  const constraints = blueprint.constraints || {};

  const pageCount = pages.length;
  const hasTestimonials = sections.some(s => s.id === 'testimonials');
  const hasBlog = sections.some(s => s.id === 'blog');
  const hasFaq = sections.some(s => s.id === 'faq');

  const brandTone = deriveBrandTone(type);
  const brandValues = deriveBrandValues(type);
  const consistencyLevel = deriveConsistencyLevel(pageCount);
  const accessibilityPriority = 'high';

  const brandVoice = {
    formal: type === 'service_business' || type === 'ecommerce',
    warm: type === 'landing_page' || type === 'portfolio',
    technical: type === 'service_business',
    inspirational: type === 'portfolio',
    direct: type === 'ecommerce',
  };

  return {
    brandTone,
    brandValues,
    consistencyLevel,
    accessibilityPriority,
    brandVoice,
  };
}

function deriveBrandTone(type) {
  const map = {
    ecommerce: 'persuasive_professional',
    portfolio: 'creative_aspirational',
    service_business: 'authoritative_approachable',
    landing_page: 'friendly_inviting',
  };
  return map[type] || 'friendly_professional';
}

function deriveBrandValues(type) {
  const base = ['quality', 'reliability'];
  const map = {
    ecommerce: [...base, 'convenience', 'trust'],
    portfolio: [...base, 'creativity', 'innovation'],
    service_business: [...base, 'expertise', 'partnership'],
    landing_page: [...base, 'simplicity', 'accessibility'],
  };
  return map[type] || base;
}

function deriveConsistencyLevel(pageCount) {
  if (pageCount <= 5) return 'strict';
  if (pageCount <= 10) return 'balanced';
  return 'flexible';
}

module.exports = { brandingStrategy };
