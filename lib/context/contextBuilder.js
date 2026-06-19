const { loadConversation, extractAnswers, extractProjectInfo } = require('./contextHistory');
const { normalizeContext } = require('./contextNormalizer');
const { inferValues } = require('./contextInference');
const { applyDefaults } = require('./contextDefaults');
const { merge } = require('./contextMerger');
const { validateContext } = require('./contextValidator');
const { serialize, toPlanIR } = require('./contextSerializer');
const { processAssets } = require('./contextAssets');
const { extractEntitiesFromMessages } = require('./contextEntities');
const { contextEvents } = require('./contextEvents');

function buildContext(conversationId, options = {}) {
  const conversation = loadConversation(conversationId);
  if (!conversation) {
    return { success: false, error: `Conversation "${conversationId}" not found` };
  }

  const intentType = conversation.session?.context?.currentIntent || options.intentType || 'default';

  const { answers, entities, answeredQuestions, pendingQuestions, messageCount, session } = extractAnswers(conversation);
  const projectInfo = extractProjectInfo(conversation);
  const extractedEntities = extractEntitiesFromMessages(conversation.messages || []);
  const mergedEntities = [...new Map([...entities, ...extractedEntities].map(e => [e.type + ':' + e.value, e])).values()];

  const rawContext = {
    conversationId,
    intentType,
    project: {
      name: answers.business_name || answers.store_name || answers.product_name || answers.blog_name || answers.website_name || answers.your_name || null,
      brand_name: answers.brand_name || answers.business_name || answers.store_name || answers.product_name || null,
      tagline: answers.tagline || '',
      target_user: answers.target_user || answers.target || null,
      existing_site: answers.existing_site || null,
      extra_context: answers.extra_context || '',
      user_flow: answers.user_flow || [],
      ...projectInfo,
    },
    audience: {
      description: answers.audience_description || answers.target_user || '',
      target: answers.target_user || answers.target || '',
      problems: [],
      motivations: [],
    },
    pages: _buildPages(answers, intentType),
    settings: {
      tone: answers.tone || null,
      color_palette: answers.color_palette || answers.color || null,
      dark_mode: _parseBoolean(answers.dark_mode),
      language: answers.language || 'en',
      currency: answers.currency || 'usd',
      cuisine_type: answers.cuisine_type || null,
      menu_style: answers.menu_style || null,
      online_ordering: _parseBoolean(answers.online_ordering),
      reservation_system: _parseBoolean(answers.reservation_system),
      delivery_available: _parseBoolean(answers.delivery_available),
      booking_system: _parseBoolean(answers.booking_system),
      payment_system: answers.payment_system || null,
      shipping_regions: answers.shipping_regions || null,
      inventory_type: answers.inventory_type || null,
      reviews_enabled: _parseBoolean(answers.reviews_enabled),
      pricing_model: answers.pricing_model || null,
      auth_system: answers.auth_system || null,
      integrations: answers.integrations || null,
      team_collaboration: _parseBoolean(answers.team_collaboration),
      portfolio_type: answers.portfolio_type || null,
      contact_form: _parseBoolean(answers.contact_form),
      social_links: answers.social_links || [],
      cta_type: answers.cta_type || null,
      video_enabled: _parseBoolean(answers.video_enabled),
      testimonials: _parseBoolean(answers.testimonials),
      newsletter: _parseBoolean(answers.newsletter),
      comments_enabled: _parseBoolean(answers.comments_enabled),
      social_share: _parseBoolean(answers.social_share),
      brand_feelings: answers.brand_feelings || [],
      visual_style: answers.visual_style || 'modern',
      logo_status: answers.logo_status || null,
      service_type: answers.service_type || null,
      service_area: answers.service_area || null,
      pricing_tiers: _parseBoolean(answers.pricing_tiers),
      team_members: _parseBoolean(answers.team_members),
      product_type: answers.product_type || null,
      core_functionality: answers.core_functionality || null,
      profession: answers.profession || null,
      topic: answers.topic || null,
      product_name: answers.product_name || null,
      your_name: answers.your_name || null,
      blog_name: answers.blog_name || null,
      website_name: answers.website_name || null,
      store_name: answers.store_name || null,
      business_name: answers.business_name || null,
    },
    entities: mergedEntities,
    assets: options.assets ? processAssets(options.assets) : [],
    conversations: {
      messageCount,
      answeredQuestions: answeredQuestions.length,
      pendingQuestions: pendingQuestions.length,
    },
    metadata: {
      builtAt: new Date().toISOString(),
      version: '1.0.0',
    },
  };

  const normalized = normalizeContext(rawContext);
  contextEvents.emitContextNormalized(conversationId, { intentType });

  const inferred = inferValues(normalized, intentType);
  const withDefaults = applyDefaults(inferred, intentType);

  const validationErrors = validateContext(withDefaults);
  if (validationErrors.length) {
    contextEvents.emitContextValidationFailed(conversationId, { errors: validationErrors.map(e => e.message) });
    if (options.strict) {
      return { success: false, error: 'Context validation failed', errors: validationErrors, context: withDefaults };
    }
  }

  const planIR = toPlanIR(withDefaults);
  const serialized = serialize(withDefaults);

  contextEvents.emitContextBuilt(conversationId, { intentType, messageCount, pages: (withDefaults.pages || []).length });

  return {
    success: true,
    conversationId,
    context: withDefaults,
    planIR,
    serialized,
    validation: { valid: validationErrors.length === 0, errors: validationErrors },
  };
}

function _buildPages(answers, intentType) {
  const commonPages = [
    { title: 'Home', type: 'home', priority: 1 },
    { title: 'About', type: 'about', priority: 2 },
    { title: 'Contact', type: 'contact', priority: 2 },
  ];

  const typePages = {
    restaurant_website: [
      { title: 'Menu', type: 'menu', priority: 1 },
    ],
    ecommerce_store: [
      { title: 'Shop', type: 'shop', priority: 1 },
      { title: 'Cart', type: 'cart', priority: 1 },
      { title: 'Checkout', type: 'checkout', priority: 1 },
    ],
    saas_platform: [
      { title: 'Features', type: 'features', priority: 1 },
      { title: 'Pricing', type: 'pricing', priority: 2 },
    ],
    portfolio_site: [
      { title: 'Portfolio', type: 'portfolio', priority: 1 },
    ],
    blog_website: [
      { title: 'Blog', type: 'blog', priority: 1 },
    ],
    landing_page: [],
    service_business: [
      { title: 'Services', type: 'services', priority: 1 },
    ],
  };

  const pages = [...commonPages];
  const extra = typePages[intentType] || [];
  for (const p of extra) {
    if (!pages.some(ex => ex.title === p.title)) pages.push(p);
  }

  if (answers.booking_system === true || answers.booking_system === 'true' || answers.booking_system === 'yes') {
    if (!pages.some(p => p.title === 'Book')) pages.push({ title: 'Book', type: 'booking', priority: 2 });
  }

  if (answers.online_ordering === true || answers.online_ordering === 'true') {
    if (!pages.some(p => p.title === 'Order')) pages.push({ title: 'Order', type: 'order', priority: 2 });
  }

  return pages;
}

function _parseBoolean(val) {
  if (val === true || val === 'true' || val === 'yes' || val === '1') return true;
  if (val === false || val === 'false' || val === 'no' || val === '0') return false;
  return null;
}

module.exports = { buildContext };
