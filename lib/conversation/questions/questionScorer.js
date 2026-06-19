function scoreQuestion(q, intentType, options = {}) {
  const impactMap = {
    1: { impact: 10, label: 'blocking' },
    2: { impact: 7, label: 'high_impact' },
    3: { impact: 3, label: 'optional' },
  };

  const priority = q.priority || 3;
  const impact = impactMap[priority] || impactMap[3];

  const relevance = _computeRelevance(q, intentType);
  const dependencyWeight = _computeDependencyWeight(q);
  const downstreamImportance = _computeDownstreamImportance(q);

  const totalScore = (
    impact.impact * 0.35 +
    relevance * 0.30 +
    dependencyWeight * 0.20 +
    downstreamImportance * 0.15
  );

  return {
    questionId: q.id || q.field,
    impactScore: impact.impact,
    relevanceScore: relevance,
    dependencyScore: dependencyWeight,
    downstreamScore: downstreamImportance,
    totalScore: Math.round(totalScore * 10) / 10,
    priorityLevel: priority,
    priorityLabel: impact.label,
  };
}

function _computeRelevance(q, intentType) {
  const KEYWORD_MAP = {
    restaurant_website: ['food', 'menu', 'cuisine', 'restaurant', 'cafe', 'dining', 'location', 'business_name'],
    ecommerce_store: ['store', 'shop', 'product', 'payment', 'shipping', 'inventory', 'cart'],
    saas_platform: ['saas', 'software', 'app', 'platform', 'user', 'pricing', 'auth', 'integration'],
    portfolio_site: ['portfolio', 'name', 'profession', 'gallery', 'showcase'],
    blog_website: ['blog', 'post', 'article', 'newsletter', 'category', 'content'],
    landing_page: ['landing', 'product', 'cta', 'conversion', 'lead'],
    service_business: ['service', 'booking', 'appointment', 'pricing', 'service_area'],
  };

  const keywords = KEYWORD_MAP[intentType] || [];
  if (!keywords.length) return 5;

  const field = q.field || '';
  let score = 0;
  for (const kw of keywords) {
    if (field.includes(kw)) score += 2;
  }
  return Math.min(10, score + 3);
}

function _computeDependencyWeight(q) {
  const weightMap = {
    business_name: 10, store_name: 10, product_name: 10, blog_name: 10,
    website_name: 10, your_name: 10,
    location: 8, service_type: 8, cuisine_type: 8, product_type: 8,
    core_functionality: 8, profession: 8, topic: 8, target_user: 8,
    pricing_model: 6, payment_system: 6, booking_system: 6,
    color_palette: 5, logo_status: 5,
    dark_mode: 2, social_share: 2, newsletter: 2,
  };
  return weightMap[q.field] || 4;
}

function _computeDownstreamImportance(q) {
  const upstreamMap = {
    business_name: 'blueprint, design_strategy',
    store_name: 'blueprint, design_strategy',
    cuisine_type: 'design_strategy, content_generator',
    location: 'content_generator, deploy',
    payment_system: 'generator, deploy',
    pricing_model: 'content_generator',
    dark_mode: 'design_system',
  };
  const downstream = upstreamMap[q.field];
  if (!downstream) return 5;
  const parts = downstream.split(', ').length;
  return Math.min(10, parts * 3);
}

module.exports = { scoreQuestion };
