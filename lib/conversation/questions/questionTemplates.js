const QUESTION_TYPES = ['text', 'choice', 'multi_choice', 'boolean', 'scale', 'upload'];

const INTENT_MAP = {
  restaurant_website: {
    label: 'Restaurant Website',
    required: [
      { field: 'business_name', type: 'text', question: 'What is the name of your business?', reason: 'Needed for branding and header generation', options: null },
      { field: 'location', type: 'text', question: 'Where is your business located?', reason: 'Needed for location display and local SEO', options: null },
      { field: 'cuisine_type', type: 'choice', question: 'What type of cuisine do you serve?', reason: 'Drives imagery, menu layout, and design style', options: ['coffee', 'mexican', 'italian', 'japanese', 'american', 'indian', 'french', 'mediterranean', 'bakery', 'other'] },
    ],
    optional: [
      { field: 'reservation_system', type: 'boolean', question: 'Do you want online reservations?', reason: 'Adds booking widget', options: null },
      { field: 'menu_style', type: 'choice', question: 'How would you like your menu displayed?', reason: 'Affects page layout priority', options: ['simple_list', 'detailed_with_prices', 'pictorial', 'categorized'] },
      { field: 'tone', type: 'choice', question: 'What tone fits your brand best?', reason: 'Refines design strategy voice', options: ['casual_warm', 'modern_clean', 'rustic_charming', 'upscale_elegant'] },
      { field: 'online_ordering', type: 'boolean', question: 'Do you want online ordering?', reason: 'Adds ecommerce functionality', options: null },
      { field: 'delivery_available', type: 'boolean', question: 'Do you offer delivery?', reason: 'Adds delivery info section', options: null },
    ],
  },
  ecommerce_store: {
    label: 'Ecommerce Store',
    required: [
      { field: 'store_name', type: 'text', question: 'What is the name of your store?', reason: 'Needed for branding and header', options: null },
      { field: 'product_type', type: 'text', question: 'What type of products do you sell?', reason: 'Drives layout, imagery, and category structure', options: null },
    ],
    optional: [
      { field: 'payment_system', type: 'choice', question: 'Which payment system do you need?', reason: 'Required for checkout integration', options: ['stripe', 'paypal', 'both', 'not_sure'] },
      { field: 'shipping_regions', type: 'text', question: 'Where will you ship?', reason: 'Affects shipping logic display', options: null },
      { field: 'inventory_type', type: 'choice', question: 'How many products do you have?', reason: 'Affects catalog layout', options: ['less_than_10', '10_to_50', '50_to_200', '200_plus'] },
      { field: 'currency', type: 'choice', question: 'What currency will you use?', reason: 'Required for pricing display', options: ['usd', 'eur', 'gbp', 'mxn', 'cad', 'other'] },
      { field: 'reviews_enabled', type: 'boolean', question: 'Do you want product reviews?', reason: 'Adds review section to products', options: null },
    ],
  },
  saas_platform: {
    label: 'SaaS Platform',
    required: [
      { field: 'product_name', type: 'text', question: 'What is the name of your SaaS product?', reason: 'Needed for branding and header', options: null },
      { field: 'core_functionality', type: 'text', question: 'What is the core functionality of your product?', reason: 'Drives feature page structure and value proposition', options: null },
      { field: 'target_user', type: 'text', question: 'Who is your target user?', reason: 'Shapes messaging, tone, and UX patterns', options: null },
    ],
    optional: [
      { field: 'pricing_model', type: 'choice', question: 'What pricing model will you use?', reason: 'Required for pricing page', options: ['free', 'freemium', 'subscription', 'one_time', 'usage_based'] },
      { field: 'auth_system', type: 'choice', question: 'Do you need user authentication?', reason: 'Adds login/signup pages', options: ['email_password', 'social_login', 'both', 'none'] },
      { field: 'integrations', type: 'text', question: 'What third-party integrations do you need?', reason: 'Affects feature pages', options: null },
      { field: 'team_collaboration', type: 'boolean', question: 'Do you need team collaboration features?', reason: 'Adds team/workspace pages', options: null },
      { field: 'dark_mode', type: 'boolean', question: 'Do you want a dark mode option?', reason: 'Adds theme toggle', options: null },
    ],
  },
  portfolio_site: {
    label: 'Portfolio Site',
    required: [
      { field: 'your_name', type: 'text', question: 'What is your name?', reason: 'Needed for branding and header', options: null },
      { field: 'profession', type: 'text', question: 'What is your profession?', reason: 'Drives design style and section layout', options: null },
    ],
    optional: [
      { field: 'portfolio_type', type: 'choice', question: 'What type of portfolio do you need?', reason: 'Affects grid layout and visual density', options: ['visual_gallery', 'case_studies', 'minimal_list', 'hybrid'] },
      { field: 'dark_mode', type: 'boolean', question: 'Do you want dark mode?', reason: 'Adds theme toggle', options: null },
      { field: 'contact_form', type: 'boolean', question: 'Do you want a contact form?', reason: 'Adds contact section', options: null },
      { field: 'social_links', type: 'multi_choice', question: 'Which social links do you want to display?', reason: 'Adds social icons in header/footer', options: ['github', 'linkedin', 'twitter', 'dribbble', 'instagram', 'youtube'] },
    ],
  },
  blog_website: {
    label: 'Blog Website',
    required: [
      { field: 'blog_name', type: 'text', question: 'What is the name of your blog?', reason: 'Needed for branding and header', options: null },
      { field: 'topic', type: 'text', question: 'What topic will you write about?', reason: 'Drives design style and category structure', options: null },
    ],
    optional: [
      { field: 'newsletter', type: 'boolean', question: 'Do you want a newsletter signup?', reason: 'Adds email capture section', options: null },
      { field: 'comments_enabled', type: 'boolean', question: 'Do you want to allow comments?', reason: 'Adds comment section to posts', options: null },
      { field: 'categories', type: 'text', question: 'What categories will you have?', reason: 'Affects navigation structure', options: null },
      { field: 'social_share', type: 'boolean', question: 'Do you want social sharing buttons?', reason: 'Adds share buttons to posts', options: null },
    ],
  },
  landing_page: {
    label: 'Landing Page',
    required: [
      { field: 'product_name', type: 'text', question: 'What is the name of your product or service?', reason: 'Needed for hero and branding', options: null },
    ],
    optional: [
      { field: 'value_proposition', type: 'text', question: 'What is your main value proposition?', reason: 'Drives hero copy', options: null },
      { field: 'cta_type', type: 'choice', question: 'What is your primary call-to-action?', reason: 'Drives conversion goal', options: ['sign_up', 'book_demo', 'get_quote', 'download', 'learn_more'] },
      { field: 'video_enabled', type: 'boolean', question: 'Do you want to include a demo video?', reason: 'Affects hero layout', options: null },
      { field: 'testimonials', type: 'boolean', question: 'Do you want to show testimonials?', reason: 'Adds social proof section', options: null },
    ],
  },
  service_business: {
    label: 'Service Business',
    required: [
      { field: 'business_name', type: 'text', question: 'What is the name of your business?', reason: 'Needed for branding', options: null },
      { field: 'service_type', type: 'text', question: 'What service do you offer?', reason: 'Drives layout, imagery, and section structure', options: null },
    ],
    optional: [
      { field: 'booking_system', type: 'boolean', question: 'Do you want online booking?', reason: 'Adds appointment scheduling', options: null },
      { field: 'service_area', type: 'text', question: 'Where do you provide service?', reason: 'Affects location display', options: null },
      { field: 'pricing_tiers', type: 'boolean', question: 'Do you want to display pricing?', reason: 'Adds pricing section', options: null },
      { field: 'team_members', type: 'boolean', question: 'Do you want to feature your team?', reason: 'Adds team section', options: null },
    ],
  },
  default: {
    label: 'General Website',
    required: [
      { field: 'website_name', type: 'text', question: 'What is the name of your website?', reason: 'Needed for branding', options: null },
    ],
    optional: [
      { field: 'website_purpose', type: 'text', question: 'What is the main purpose of your website?', reason: 'Helps refine page structure', options: null },
      { field: 'color_preference', type: 'text', question: 'Do you have any color preferences?', reason: 'Helps with design system', options: null },
      { field: 'dark_mode', type: 'boolean', question: 'Do you want dark mode?', reason: 'Adds theme toggle', options: null },
    ],
  },
};

const GENERIC_QUESTIONS = [
  { field: 'color_palette', type: 'text', question: 'Do you have brand colors in mind?', reason: 'Feeds design system tokens', priority_adjustment: 3 },
  { field: 'logo_status', type: 'choice', question: 'Do you have a logo?', reason: 'Determines header design', priority_adjustment: 3, options: ['yes_upload', 'yes_provide', 'need_design', 'text_only'] },
];

function getTemplate(intentType) {
  return INTENT_MAP[intentType] || INTENT_MAP.default;
}

function listIntentTypes() {
  return Object.keys(INTENT_MAP).filter(k => k !== 'default');
}

module.exports = { INTENT_MAP, GENERIC_QUESTIONS, getTemplate, listIntentTypes, QUESTION_TYPES };
