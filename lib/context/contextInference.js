function inferValues(context, intentType) {
  const inferred = { ...context };
  const known = Object.entries(context).filter(([, v]) => v != null && v !== '').map(([k]) => k);

  const RULES = {
    restaurant_website: [
      { if: ['cuisine_type'], then: { food_ordering: true } },
      { if: ['business_name'], then: { brand_name: context.business_name } },
      { if: ['has'], not: ['cuisine_type'], then: { cuisine_type: 'general' } },
    ],
    ecommerce_store: [
      { if: ['store_name'], then: { brand_name: context.store_name } },
      { if: ['product_type'], then: { has_catalog: true } },
    ],
    portfolio_site: [
      { if: ['profession'], then: { brand_name: context.profession === 'developer' || context.profession === 'designer' ? `${context.profession} portfolio` : context.you_name ? `${context.your_name} — ${context.profession}` : context.profession } },
      { if: ['your_name', 'profession'], then: { brand_name: `${context.your_name} — ${context.profession}` } },
    ],
    saas_platform: [
      { if: ['product_name'], then: { brand_name: context.product_name } },
      { if: ['core_functionality'], then: { has_dashboard: true, has_auth: true } },
    ],
    service_business: [
      { if: ['business_name'], then: { brand_name: context.business_name } },
      { if: ['booking_system'], then: { has_booking: context.booking_system === true || context.booking_system === 'true' } },
    ],
    blog_website: [
      { if: ['blog_name'], then: { brand_name: context.blog_name } },
    ],
    landing_page: [
      { if: ['product_name'], then: { brand_name: context.product_name } },
    ],
  };

  const rules = RULES[intentType] || [];
  for (const rule of rules) {
    if (rule.if && rule.if.includes('has') && rule.not) {
      const missing = rule.not.filter(f => !known.includes(f));
      if (missing.length === rule.not.length) {
        Object.assign(inferred, rule.then);
      }
      continue;
    }
    if (rule.if && rule.if.every(f => f === 'has' || known.includes(f))) {
      Object.assign(inferred, rule.then);
    }
  }

  if (!inferred.brand_name && inferred.business_name) inferred.brand_name = inferred.business_name;
  if (!inferred.brand_name && inferred.store_name) inferred.brand_name = inferred.store_name;
  if (!inferred.brand_name && inferred.product_name) inferred.brand_name = inferred.product_name;
  if (!inferred.brand_name && inferred.blog_name) inferred.brand_name = inferred.blog_name;
  if (!inferred.brand_name && inferred.website_name) inferred.brand_name = inferred.website_name;

  return inferred;
}

module.exports = { inferValues };
