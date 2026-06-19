function sectionContent(sectionId, sectionDef, blueprint, designStrategy, toneProfile, lang) {
  const type = blueprint.project.type;
  const projectName = blueprint.project.name;
  const name = projectName;
  const label = sectionDef.label ? (sectionDef.label[lang] || sectionDef.label.en || sectionId) : sectionId;
  const tone = toneProfile;

  const generator = generators[sectionId] || fallbackGenerator;

  return generator({ sectionId, sectionDef, type, name, label, tone, designStrategy, lang, blueprint });
}

const generators = {
  hero: generateHero,
  about: generateAbout,
  services: generateServices,
  portfolio: generatePortfolio,
  products: generateProducts,
  testimonials: generateTestimonials,
  contact: generateContact,
  footer: generateFooter,
  blog: generateBlog,
  faq: generateFaq,
  booking: generateBooking,
  story: generateStory,
  mission: generateMission,
  team: generateTeam,
  values: generateValues,
  form: generateForm,
  info: generateInfo,
  map: generateMap,
  overview: generateOverview,
  list: generateList,
  cta: generateCta,
  content: generateContent,
  products_cta: generateProductsCta,
  features: generateFeatures,
  pricing: generatePricingSection,
  grid: generateGrid,
  filter: generateFilter,
  featured: generateFeatured,
  description: generateDescription,
  testimonial: generateTestimonial,
  gallery: generateGallery,
  benefits: generateBenefits,
  process: generateProcess,
  plans: generatePlans,
  comparison: generateComparison,
  calendar: generateCalendar,
  confirmation: generateConfirmation,
  search: generateSearch,
  categories: generateCategories,
  items: generateItems,
  checkout: generateCheckout,
  payment: generatePayment,
  summary: generateSummary,
  profile: generateProfile,
  orders: generateOrders,
  settings: generateSettings,
  share: generateShare,
  related: generateRelated,
};

function heroContent(type, name, lang, tone) {
  const common = {
    ecommerce: {
      en: {
        heading: 'Shop ' + name,
        subheading: 'Premium products curated for you',
        body: 'Discover our collection of handpicked products designed to elevate your everyday experience.',
        cta: 'Shop Now',
      },
      es: {
        heading: 'Compra en ' + name,
        subheading: 'Productos premium seleccionados para ti',
        body: 'Descubre nuestra colección de productos cuidadosamente seleccionados para elevar tu día a día.',
        cta: 'Comprar Ahora',
      },
    },
    portfolio: {
      en: {
        heading: 'Our Work',
        subheading: 'Projects that speak for themselves',
        body: 'Explore a curated selection of projects showcasing our expertise across design, development, and strategy.',
        cta: 'View Portfolio',
      },
      es: {
        heading: 'Nuestro Trabajo',
        subheading: 'Proyectos que hablan por sí solos',
        body: 'Explora una selección curada de proyectos que muestran nuestra experiencia en diseño, desarrollo y estrategia.',
        cta: 'Ver Portafolio',
      },
    },
    service_business: {
      en: {
        heading: name,
        subheading: 'Expert solutions for your business',
        body: 'We deliver professional services that help your organization work smarter, faster, and more efficiently.',
        cta: 'Get Started',
      },
      es: {
        heading: name,
        subheading: 'Soluciones expertas para tu negocio',
        body: 'Ofrecemos servicios profesionales que ayudan a tu organización a trabajar de manera más inteligente, rápida y eficiente.',
        cta: 'Comenzar',
      },
    },
    landing_page: {
      en: {
        heading: 'Welcome to ' + name,
        subheading: 'Simple. Powerful. Effective.',
        body: 'Everything you need in one place. Designed to help you achieve more with less effort.',
        cta: 'Learn More',
      },
      es: {
        heading: 'Bienvenido a ' + name,
        subheading: 'Simple. Poderoso. Efectivo.',
        body: 'Todo lo que necesitas en un solo lugar. Diseñado para ayudarte a lograr más con menos esfuerzo.',
        cta: 'Saber Más',
      },
    },
  };

  const base = (common[type] && common[type][lang]) || {
    en: { heading: 'Welcome', subheading: 'We build great things', body: 'Discover what we can do for you.', cta: 'Get in Touch' },
    es: { heading: 'Bienvenido', subheading: 'Construimos cosas grandiosas', body: 'Descubre lo que podemos hacer por ti.', cta: 'Contáctanos' },
  };

  return applyToneToHero(base, tone, lang);
}

function generateHero(opts) {
  const base = heroContent(opts.type, opts.name, opts.lang, opts.tone);
  const cta = pickCta(opts.tone, opts.lang, 'hero');
  return { id: 'hero', heading: base.heading, subheading: base.subheading, body: base.body, cta: cta.text };
}

function generateAbout(opts) {
  const { type, name, lang, tone } = opts;
  const enHeadings = {
    ecommerce: 'About ' + name,
    portfolio: 'Our Story',
    service_business: 'Who We Are',
    landing_page: 'About Us',
  };
  const esHeadings = {
    ecommerce: 'Sobre ' + name,
    portfolio: 'Nuestra Historia',
    service_business: 'Quiénes Somos',
    landing_page: 'Sobre Nosotros',
  };
  const heading = lang === 'es' ? (esHeadings[type] || 'Sobre Nosotros') : (enHeadings[type] || 'About Us');

  const enBody = {
    ecommerce: name + ' is your destination for quality products. We carefully curate every item to ensure you get the best value, backed by exceptional customer service.',
    portfolio: 'We are a team of passionate creators dedicated to delivering work that makes an impact. Every project reflects our commitment to quality and creativity.',
    service_business: 'With years of industry experience, ' + name + ' helps businesses streamline operations, reduce costs, and scale with confidence.',
    landing_page: 'We believe in simple, effective solutions. ' + name + ' was built to help you focus on what matters most — your goals.',
  };
  const esBody = {
    ecommerce: name + ' es tu destino para productos de calidad. Seleccionamos cuidadosamente cada artículo para garantizarte el mejor valor, respaldado por un servicio excepcional.',
    portfolio: 'Somos un equipo de creadores apasionados dedicados a ofrecer un trabajo que genere impacto. Cada proyecto refleja nuestro compromiso con la calidad y la creatividad.',
    service_business: 'Con años de experiencia en la industria, ' + name + ' ayuda a las empresas a optimizar operaciones, reducir costos y escalar con confianza.',
    landing_page: 'Creemos en soluciones simples y efectivas. ' + name + ' fue creado para ayudarte a enfocarte en lo que realmente importa: tus objetivos.',
  };

  const body = lang === 'es' ? (esBody[type] || esBody.service_business) : (enBody[type] || enBody.service_business);
  const cta = pickCta(tone, lang, 'about');
  return { id: 'about', heading, subheading: '', body: applyToneToBody(body, tone), cta: cta.text };
}

function generateServices(opts) {
  const { type, name, lang, tone } = opts;
  const heading = lang === 'es' ? 'Servicios' : 'Services';
  const subheading = lang === 'es' ? 'Soluciones diseñadas para tus necesidades' : 'Solutions designed for your needs';
  const body = lang === 'es'
    ? 'Ofrecemos un conjunto completo de servicios para ayudarte a alcanzar tus objetivos. Desde consultoría hasta implementación, estamos aquí para apoyarte en cada paso.'
    : 'We offer a complete suite of services to help you achieve your goals. From consulting to implementation, we are here to support you every step of the way.';
  const cta = pickCta(tone, lang, 'services');
  return { id: 'services', heading, subheading, body: applyToneToBody(body, tone), cta: cta.text };
}

function generatePortfolio(opts) {
  const { type, name, lang, tone } = opts;
  const heading = lang === 'es' ? 'Portafolio' : 'Portfolio';
  const subheading = lang === 'es' ? 'Proyectos recientes' : 'Recent projects';
  const body = lang === 'es'
    ? 'Cada proyecto cuenta una historia. Explora nuestro trabajo y descubre cómo ayudamos a nuestros clientes a lograr resultados excepcionales.'
    : 'Every project tells a story. Explore our work and discover how we help our clients achieve exceptional results.';
  const cta = pickCta(tone, lang, 'portfolio');
  return { id: 'portfolio', heading, subheading, body: applyToneToBody(body, tone), cta: cta.text };
}

function generateProducts(opts) {
  const { type, name, lang } = opts;
  const heading = lang === 'es' ? 'Productos' : 'Products';
  const subheading = lang === 'es' ? 'Descubre nuestra colección' : 'Discover our collection';
  const body = lang === 'es'
    ? 'Explora nuestra selección de productos cuidadosamente elegidos para ofrecerte la mejor calidad y valor.'
    : 'Browse our selection of carefully chosen products offering the best quality and value.';
  return { id: 'products', heading, subheading, body, cta: '' };
}

function generateTestimonials(opts) {
  const { type, name, lang } = opts;
  const heading = lang === 'es' ? 'Testimonios' : 'Testimonials';
  const subheading = lang === 'es' ? 'Lo que dicen nuestros clientes' : 'What our clients say';
  const body = '';
  return { id: 'testimonials', heading, subheading, body, cta: '' };
}

function generateContact(opts) {
  const { type, name, lang, tone } = opts;
  const heading = lang === 'es' ? 'Contacto' : 'Contact';
  const subheading = lang === 'es' ? 'Hablemos de tu proyecto' : 'Let\'s talk about your project';
  const body = lang === 'es'
    ? 'Estamos listos para escuchar tu idea. Contáctanos y te responderemos en menos de 24 horas.'
    : 'We are ready to hear your idea. Contact us and we will respond within 24 hours.';
  const cta = pickCta(tone, lang, 'contact');
  return { id: 'contact', heading, subheading, body: applyToneToBody(body, tone), cta: cta.text };
}

function generateFooter(opts) {
  const { name, lang } = opts;
  return { id: 'footer', heading: '', subheading: '', body: '© ' + new Date().getFullYear() + ' ' + name + '. All rights reserved.', cta: '' };
}

function generateBlog(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Blog' : 'Blog';
  const subheading = lang === 'es' ? 'Artículos y novedades' : 'Articles and updates';
  const body = lang === 'es'
    ? 'Mantente al día con nuestras últimas publicaciones, consejos y novedades del sector.'
    : 'Stay up to date with our latest posts, tips, and industry news.';
  return { id: 'blog', heading, subheading, body, cta: '' };
}

function generateFaq(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions';
  const subheading = lang === 'es' ? 'Respuestas a tus dudas' : 'Answers to your questions';
  const body = '';
  return { id: 'faq', heading, subheading, body, cta: '' };
}

function generateBooking(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Reservas' : 'Book Now';
  const subheading = lang === 'es' ? 'Agenda tu cita' : 'Schedule your appointment';
  const body = lang === 'es'
    ? 'Selecciona una fecha y hora disponible para agendar tu servicio.'
    : 'Select an available date and time to schedule your service.';
  return { id: 'booking', heading, subheading, body, cta: '' };
}

function generateStory(opts) {
  const { name, lang } = opts;
  const heading = lang === 'es' ? 'Nuestra Historia' : 'Our Story';
  const body = lang === 'es'
    ? 'Desde nuestros inicios, en ' + name + ' nos hemos dedicado a crear soluciones que marcan la diferencia. Cada paso que hemos dado ha sido con un propósito claro: ofrecer calidad y confianza.'
    : 'Since our beginnings, ' + name + ' has been dedicated to creating solutions that make a difference. Every step has been with a clear purpose: to deliver quality and trust.';
  return { id: 'story', heading, subheading: '', body, cta: '' };
}

function generateMission(opts) {
  const { name, lang } = opts;
  const heading = lang === 'es' ? 'Nuestra Misión' : 'Our Mission';
  const body = lang === 'es'
    ? 'Empoderar a nuestros clientes con soluciones que transforman la manera en que trabajan y viven.'
    : 'Empower our clients with solutions that transform the way they work and live.';
  return { id: 'mission', heading, subheading: '', body, cta: '' };
}

function generateTeam(opts) {
  const { name, lang } = opts;
  const heading = lang === 'es' ? 'Nuestro Equipo' : 'Our Team';
  const body = lang === 'es'
    ? 'Conoce a las personas detrás de ' + name + '. Un equipo comprometido con la excelencia y la innovación.'
    : 'Meet the people behind ' + name + '. A team committed to excellence and innovation.';
  return { id: 'team', heading, subheading: '', body, cta: '' };
}

function generateValues(opts) {
  const { name, lang, designStrategy } = opts;
  const values = designStrategy.brand.brandValues || ['quality', 'reliability'];
  const heading = lang === 'es' ? 'Nuestros Valores' : 'Our Values';
  const body = lang === 'es'
    ? 'Nos guiamos por ' + values.join(', ') + '. Estos principios definen cada decisión que tomamos.'
    : 'We are guided by ' + values.join(', ') + '. These principles define every decision we make.';
  return { id: 'values', heading, subheading: '', body, cta: '' };
}

function generateForm(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Envíanos un Mensaje' : 'Send Us a Message';
  return { id: 'form', heading, subheading: '', body: '', cta: '' };
}

function generateInfo(opts) {
  const { name, lang } = opts;
  const heading = lang === 'es' ? 'Información de Contacto' : 'Contact Information';
  const body = lang === 'es'
    ? 'Estamos disponibles para responder tus preguntas y ayudarte con tu proyecto.'
    : 'We are available to answer your questions and help with your project.';
  return { id: 'info', heading, subheading: '', body, cta: '' };
}

function generateMap(opts) {
  return { id: 'map', heading: '', subheading: '', body: '', cta: '' };
}

function generateOverview(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Descripción General' : 'Overview';
  const body = lang === 'es'
    ? 'Ofrecemos soluciones integrales diseñadas para satisfacer las necesidades específicas de tu negocio.'
    : 'We offer comprehensive solutions designed to meet the specific needs of your business.';
  return { id: 'overview', heading, subheading: '', body, cta: '' };
}

function generateList(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Lo Que Ofrecemos' : 'What We Offer';
  return { id: 'list', heading, subheading: '', body: '', cta: '' };
}

function generateCta(opts) {
  const { lang, tone } = opts;
  const cta = pickCta(tone, lang, 'banner');
  const heading = lang === 'es' ? '¿Listo para empezar?' : 'Ready to get started?';
  const body = lang === 'es'
    ? 'Contáctanos hoy y descubre cómo podemos ayudarte a alcanzar tus objetivos.'
    : 'Contact us today and discover how we can help you achieve your goals.';
  return { id: 'cta', heading, subheading: '', body, cta: cta.text };
}

function generateContent(opts) {
  return { id: 'content', heading: '', subheading: '', body: '', cta: '' };
}

function generateProductsCta(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Productos Destacados' : 'Featured Products';
  return { id: 'products_cta', heading, subheading: '', body: '', cta: '' };
}

function generateFeatures(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Características' : 'Features';
  return { id: 'features', heading, subheading: '', body: '', cta: '' };
}

function generatePricingSection(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Precios' : 'Pricing';
  const subheading = lang === 'es' ? 'Planes flexibles para ti' : 'Flexible plans for you';
  return { id: 'pricing', heading, subheading, body: '', cta: '' };
}

function generateGrid(opts) {
  return { id: 'grid', heading: '', subheading: '', body: '', cta: '' };
}

function generateFilter(opts) {
  return { id: 'filter', heading: '', subheading: '', body: '', cta: '' };
}

function generateFeatured(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Destacados' : 'Featured';
  return { id: 'featured', heading, subheading: '', body: '', cta: '' };
}

function generateDescription(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Descripción' : 'Description';
  return { id: 'description', heading, subheading: '', body: '', cta: '' };
}

function generateTestimonial(opts) {
  return { id: 'testimonial', heading: '', subheading: '', body: '', cta: '' };
}

function generateGallery(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Galería' : 'Gallery';
  return { id: 'gallery', heading, subheading: '', body: '', cta: '' };
}

function generateBenefits(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Beneficios' : 'Benefits';
  return { id: 'benefits', heading, subheading: '', body: '', cta: '' };
}

function generateProcess(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Nuestro Proceso' : 'Our Process';
  return { id: 'process', heading, subheading: '', body: '', cta: '' };
}

function generatePlans(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Planes' : 'Plans';
  return { id: 'plans', heading, subheading: '', body: '', cta: '' };
}

function generateComparison(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Comparación' : 'Compare Plans';
  return { id: 'comparison', heading, subheading: '', body: '', cta: '' };
}

function generateCalendar(opts) {
  return { id: 'calendar', heading: '', subheading: '', body: '', cta: '' };
}

function generateConfirmation(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Confirmación' : 'Confirmation';
  return { id: 'confirmation', heading, subheading: '', body: '', cta: '' };
}

function generateSearch(opts) {
  return { id: 'search', heading: '', subheading: '', body: '', cta: '' };
}

function generateCategories(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Categorías' : 'Categories';
  return { id: 'categories', heading, subheading: '', body: '', cta: '' };
}

function generateItems(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Artículos' : 'Items';
  return { id: 'items', heading, subheading: '', body: '', cta: '' };
}

function generateCheckout(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Finalizar Compra' : 'Checkout';
  return { id: 'checkout', heading, subheading: '', body: '', cta: '' };
}

function generatePayment(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Pago' : 'Payment';
  return { id: 'payment', heading, subheading: '', body: '', cta: '' };
}

function generateSummary(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Resumen' : 'Order Summary';
  return { id: 'summary', heading, subheading: '', body: '', cta: '' };
}

function generateProfile(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Mi Perfil' : 'My Profile';
  return { id: 'profile', heading, subheading: '', body: '', cta: '' };
}

function generateOrders(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Mis Pedidos' : 'My Orders';
  return { id: 'orders', heading, subheading: '', body: '', cta: '' };
}

function generateSettings(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Configuración' : 'Settings';
  return { id: 'settings', heading, subheading: '', body: '', cta: '' };
}

function generateShare(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Compartir' : 'Share';
  return { id: 'share', heading, subheading: '', body: '', cta: '' };
}

function generateRelated(opts) {
  const { lang } = opts;
  const heading = lang === 'es' ? 'Relacionados' : 'Related';
  return { id: 'related', heading, subheading: '', body: '', cta: '' };
}

function fallbackGenerator(opts) {
  const { sectionId, label } = opts;
  return { id: sectionId, heading: label, subheading: '', body: '', cta: '' };
}

function pickCta(tone, lang, context) {
  const style = tone.ctaStyle;
  const ctaLibrary = getCtaLibrary(lang);
  const contextCtas = ctaLibrary[context] || ctaLibrary.default;

  if (style === 'direct_action') return contextCtas[0] || ctaLibrary.default[0];
  if (style === 'invitation') return contextCtas[1] || contextCtas[0];
  if (style === 'benefit_driven') return contextCtas[2] || contextCtas[0];
  return contextCtas[0];
}

function getCtaLibrary(lang) {
  if (lang === 'es') {
    return {
      hero: [{ text: 'Comienza Ahora' }, { text: 'Te Ayudamos' }, { text: 'Descubre Más' }],
      about: [{ text: 'Conócenos' }, { text: 'Saber Más' }, { text: 'Nuestra Historia' }],
      services: [{ text: 'Ver Servicios' }, { text: 'Contáctanos' }, { text: 'Explorar Soluciones' }],
      portfolio: [{ text: 'Ver Proyectos' }, { text: 'Explorar' }, { text: 'Ver Trabajo' }],
      contact: [{ text: 'Contáctanos' }, { text: 'Hablemos' }, { text: 'Solicitar Información' }],
      banner: [{ text: 'Solicitar Cotización' }, { text: 'Hablemos de tu Proyecto' }, { text: 'Empieza Hoy' }],
      default: [{ text: 'Más Información' }, { text: 'Contáctanos' }, { text: 'Saber Más' }],
    };
  }
  return {
    hero: [{ text: 'Get Started' }, { text: 'Let\'s Talk' }, { text: 'Discover More' }],
    about: [{ text: 'Learn More' }, { text: 'About Us' }, { text: 'Our Story' }],
    services: [{ text: 'View Services' }, { text: 'Get in Touch' }, { text: 'Explore Solutions' }],
    portfolio: [{ text: 'View Projects' }, { text: 'Explore' }, { text: 'See Our Work' }],
    contact: [{ text: 'Contact Us' }, { text: 'Let\'s Talk' }, { text: 'Get a Quote' }],
    banner: [{ text: 'Request a Quote' }, { text: 'Let\'s Discuss' }, { text: 'Start Today' }],
    default: [{ text: 'Learn More' }, { text: 'Contact Us' }, { text: 'Find Out More' }],
  };
}

function applyToneToHero(base, tone, lang) {
  const result = { heading: base.heading, subheading: base.subheading, body: base.body, cta: base.cta };

  if (tone.directness >= 4) {
    result.body = shortenSentence(result.body);
  }
  if (tone.formality >= 4) {
    result.subheading = formalize(result.subheading, lang);
    result.body = formalize(result.body, lang);
  }
  if (tone.inspiration >= 4) {
    result.subheading = aspirationalize(result.subheading, lang);
  }
  return result;
}

function applyToneToBody(body, tone) {
  let text = body;
  if (tone.directness >= 4) text = shortenSentence(text);
  if (tone.formality >= 4) text = formalize(text, 'en');
  if (tone.inspiration >= 4 && tone.warmth >= 3) text = aspirationalize(text, 'en');
  return text;
}

function shortenSentence(text) {
  const sentences = text.split('. ');
  if (sentences.length > 2) {
    return sentences.slice(0, 2).join('. ') + '.';
  }
  return text;
}

function formalize(text, lang) {
  if (lang === 'es') {
    return text
      .replace(/ayudarte/gi, 'proporcionarte asistencia')
      .replace(/ayuda/gi, 'asistencia')
      .replace(/habla/gi, 'comunícate');
  }
  return text
      .replace(/help your/gi, 'assist your')
      .replace(/help you/gi, 'assist you')
    .replace(/get in touch/gi, 'reach out')
    .replace(/talk/gi, 'connect')
    .replace(/great/gi, 'exceptional');
}

function aspirationalize(text, lang) {
  const prefix = lang === 'es' ? 'Imagina ' : 'Imagine ';
  if (!text.startsWith('Imagine') && !text.startsWith('Imagina')) {
    return prefix + text.charAt(0).toLowerCase() + text.slice(1);
  }
  return text;
}

module.exports = { sectionContent };
