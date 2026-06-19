const DEFAULTS = {
  restaurant_website: {
    tone: 'casual_warm',
    menu_style: 'categorized',
    dark_mode: false,
    online_ordering: false,
    reservation_system: false,
    delivery_available: false,
    color_palette: 'warm_neutrals',
    currency: 'usd',
    language: 'en',
    timezone: 'America/New_York',
  },
  ecommerce_store: {
    currency: 'usd',
    language: 'en',
    payment_system: 'stripe',
    shipping_regions: 'worldwide',
    inventory_type: '10_to_50',
    reviews_enabled: true,
    dark_mode: true,
    color_palette: 'clean_white',
  },
  saas_platform: {
    pricing_model: 'subscription',
    auth_system: 'email_password',
    team_collaboration: true,
    dark_mode: true,
    language: 'en',
    integrations: '',
    color_palette: 'modern_blue',
  },
  portfolio_site: {
    portfolio_type: 'case_studies',
    dark_mode: true,
    contact_form: true,
    social_links: ['github', 'linkedin'],
    color_palette: 'minimal_gray',
  },
  blog_website: {
    newsletter: true,
    comments_enabled: true,
    social_share: true,
    categories: 'general',
    dark_mode: true,
    color_palette: 'clean_white',
  },
  landing_page: {
    cta_type: 'sign_up',
    video_enabled: false,
    testimonials: true,
    color_palette: 'modern_blue',
    dark_mode: false,
  },
  service_business: {
    booking_system: true,
    pricing_tiers: true,
    team_members: false,
    dark_mode: true,
    color_palette: 'professional_navy',
    language: 'en',
  },
};

function getDefaults(intentType) {
  return DEFAULTS[intentType] || { language: 'en' };
}

function applyDefaults(context, intentType) {
  const defaults = getDefaults(intentType);
  const merged = JSON.parse(JSON.stringify(context));

  if (!merged.settings) merged.settings = {};

  for (const [key, val] of Object.entries(defaults)) {
    if (merged.settings[key] === undefined || merged.settings[key] === null || merged.settings[key] === '') {
      merged.settings[key] = val;
    }
    if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
      merged[key] = val;
    }
  }
  return merged;
}

module.exports = { DEFAULTS, getDefaults, applyDefaults };
