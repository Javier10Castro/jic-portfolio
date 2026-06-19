function seoForPage(page, blueprint, designStrategy, toneProfile, lang) {
  const projectName = blueprint.project.name;
  const tagline = blueprint.project.tagline || '';
  const pageTitle = page.title;
  const type = blueprint.project.type;

  const titleTemplates = getTitleTemplates(lang);
  const descTemplates = getDescriptionTemplates(lang);

  let title = titleTemplates.default(pageTitle, projectName);
  let description = descTemplates.default(projectName, pageTitle);

  if (page.path === '/') {
    title = tagline
      ? titleTemplates.homeTagline(projectName, tagline)
      : titleTemplates.home(projectName);
    description = tagline
      ? descTemplates.homeTagline(projectName, tagline)
      : descTemplates.home(projectName);
  } else if (page.path.includes('contact')) {
    description = descTemplates.contact(projectName);
  } else if (page.path.includes('about')) {
    description = descTemplates.about(projectName);
  } else if (page.path.includes('service') || page.path.includes('Service')) {
    description = descTemplates.services(projectName);
  } else if (type === 'ecommerce' && (page.path.includes('shop') || page.path.includes('Shop'))) {
    description = descTemplates.shop(projectName);
  } else if (type === 'ecommerce' && (page.path.includes('cart') || page.path.includes('Cart'))) {
    description = descTemplates.cart(projectName);
  } else if (page.path.includes('blog') || page.path.includes('Blog')) {
    description = descTemplates.blog(projectName);
  } else if (page.path.includes('faq') || page.path.includes('Faq')) {
    description = descTemplates.faq(projectName);
  } else if (page.path.includes('booking') || page.path.includes('Book')) {
    description = descTemplates.booking(projectName);
  }

  if (toneProfile.formality >= 4) {
    description = formalizeSeo(description, lang);
  }

  return {
    title: applyTitleLength(title),
    description: applyDescriptionLength(description),
  };
}

function getTitleTemplates(lang) {
  if (lang === 'es') {
    return {
      home: (name) => name + ' — Soluciones Profesionales',
      homeTagline: (name, tagline) => name + ' — ' + tagline,
      default: (page, name) => page + ' | ' + name,
    };
  }
  return {
    home: (name) => name + ' — Professional Solutions',
    homeTagline: (name, tagline) => name + ' — ' + tagline,
    default: (page, name) => page + ' | ' + name,
  };
}

function getDescriptionTemplates(lang) {
  if (lang === 'es') {
    return {
      default: (name, page) => name + ' — ' + page + '. Descubre nuestros servicios y soluciones profesionales.',
      homeTagline: (name, tagline) => name + ': ' + tagline + '. Conoce nuestros servicios y soluciones.',
      home: (name) => name + ' — Soluciones profesionales para tu negocio. Contáctanos.',
      contact: (name) => 'Contacta con ' + name + '. Estamos listos para ayudarte con tu próximo proyecto.',
      about: (name) => 'Conoce más sobre ' + name + ': nuestra historia, misión y equipo.',
      services: (name) => 'Servicios profesionales de ' + name + '. Soluciones diseñadas para tus necesidades.',
      shop: (name) => 'Explora la tienda de ' + name + '. Productos seleccionados para ti.',
      cart: (name) => 'Revisa tu carrito de compras en ' + name + ' y completa tu pedido.',
      blog: (name) => 'Lee los artículos y novedades de ' + name + '. Mantente informado.',
      faq: (name) => 'Preguntas frecuentes de ' + name + '. Encuentra respuestas rápidas.',
      booking: (name) => 'Agenda tu cita con ' + name + '. Reserva en línea de forma rápida y sencilla.',
    };
  }
  return {
    default: (name, page) => name + ' — ' + page + '. Discover our professional services and solutions.',
    homeTagline: (name, tagline) => name + ': ' + tagline + '. Learn about our services and solutions.',
    home: (name) => name + ' — Professional solutions for your business. Get in touch.',
    contact: (name) => 'Get in touch with ' + name + '. We are ready to help with your next project.',
    about: (name) => 'Learn more about ' + name + ': our story, mission, and team.',
    services: (name) => 'Professional services by ' + name + '. Solutions designed for your needs.',
    shop: (name) => 'Browse the shop at ' + name + '. Products curated for you.',
    cart: (name) => 'Review your shopping cart at ' + name + ' and complete your order.',
    blog: (name) => 'Read articles and updates from ' + name + '. Stay informed.',
    faq: (name) => 'Frequently asked questions about ' + name + '. Find quick answers.',
    booking: (name) => 'Schedule your appointment with ' + name + '. Book online quickly and easily.',
  };
}

function applyTitleLength(title) {
  return title.length > 70 ? title.substring(0, 67) + '...' : title;
}

function applyDescriptionLength(desc) {
  return desc.length > 165 ? desc.substring(0, 162) + '...' : desc;
}

function formalizeSeo(text, lang) {
  if (lang === 'es') {
    return text.replace(/ayudarte/gi, 'proporcionar asistencia').replace(/ayuda/gi, 'asistencia');
  }
  return text.replace(/help/gi, 'assist').replace(/get in touch/gi, 'reach out');
}

module.exports = { seoForPage };
