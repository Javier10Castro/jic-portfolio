const { sectionContent } = require('./sectionContentGenerator');

function pageContent(page, blueprint, designStrategy, toneProfile, lang) {
  const registry = blueprint.sections.registry || [];
  const sections = [];
  const pageSectionIds = page.sections || [];

  for (const sectionId of pageSectionIds) {
    const sectionDef = registry.find(s => s.id === sectionId);
    if (!sectionDef) continue;

    const content = sectionContent(sectionId, sectionDef, blueprint, designStrategy, toneProfile, lang);
    sections.push(content);
  }

  return {
    path: page.path,
    title: page.title,
    seo: generatePageSeo(page, blueprint, designStrategy, toneProfile, lang),
    sections,
  };
}

function generatePageSeo(page, blueprint, designStrategy, toneProfile, lang) {
  const projectName = blueprint.project.name;
  const pageTitle = page.title;
  const tagline = blueprint.project.tagline || '';
  const baseTitle = lang === 'es' ? pageTitle + ' | ' + projectName : pageTitle + ' | ' + projectName;

  let description;
  const type = blueprint.project.type;

  if (page.path === '/') {
    if (lang === 'es') {
      description = tagline
        ? projectName + ': ' + tagline + '. ' + 'Descubre nuestros servicios y soluciones.'
        : projectName + ' — ' + 'Soluciones profesionales para tu negocio. Conócenos.';
    } else {
      description = tagline
        ? projectName + ': ' + tagline + '. ' + 'Discover our services and solutions.'
        : projectName + ' — ' + 'Professional solutions for your business. Get to know us.';
    }
  } else if (page.path.includes('contact')) {
    description = lang === 'es'
      ? 'Ponte en contacto con ' + projectName + '. Estamos listos para ayudarte con tu próximo proyecto.'
      : 'Get in touch with ' + projectName + '. We are ready to help with your next project.';
  } else if (page.path.includes('about')) {
    description = lang === 'es'
      ? 'Conoce más sobre ' + projectName + ', nuestra historia, misión y equipo.'
      : 'Learn more about ' + projectName + ', our story, mission, and team.';
  } else if (page.path.includes('service') || page.path.includes('Service')) {
    description = lang === 'es'
      ? 'Servicios profesionales ofrecidos por ' + projectName + '. Soluciones diseñadas para tus necesidades.'
      : 'Professional services offered by ' + projectName + '. Solutions designed for your needs.';
  } else if (type === 'ecommerce' && (page.path.includes('shop') || page.path.includes('Shop'))) {
    description = lang === 'es'
      ? 'Explora nuestra tienda en ' + projectName + '. Productos seleccionados para ti.'
      : 'Explore the shop at ' + projectName + '. Products curated for you.';
  } else {
    description = lang === 'es'
      ? projectName + ' — ' + pageTitle + '. Conoce más sobre lo que ofrecemos.'
      : projectName + ' — ' + pageTitle + '. Learn more about what we offer.';
  }

  return { title: baseTitle, description };
}

module.exports = { pageContent };
