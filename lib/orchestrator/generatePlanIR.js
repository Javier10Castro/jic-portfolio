const { analyzeBrief } = require('./analyzeBrief');
const { validatePlanIR } = require('./validatePlanIR');

function generatePlanIR(formData) {
  const analysis = analyzeBrief(formData);

  const plan = {
    meta: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      source: 'brief_maestro',
    },
    project: {
      name: (formData && formData.biz_name) || null,
      tagline: (formData && formData.biz_tagline) || null,
      type: analysis.intent,
      existingSite: analysis.hasExistingSite,
      hasLogo: analysis.hasLogo,
      hasExistingContent: analysis.hasContent,
    },
    audience: {
      description: (formData && formData.pub_ideal) || null,
      problems: (formData && formData.pub_problemas) || null,
      motivations: (formData && formData.pub_motivaciones) || null,
      objections: (formData && formData.pub_objeciones) || null,
      decisionProcess: (formData && formData.pub_decision) || null,
      channels: formData && formData.pub_canales ? splitList(formData.pub_canales) : [],
    },
    tone: {
      style: analysis.tone,
      brandPersonality: formData && formData.biz_personalidad ? splitList(formData.biz_personalidad) : [],
      brandFeeling: formData && formData.ai_sentir ? splitList(formData.ai_sentir) : [],
    },
    structure: {
      sections: extractSections(formData, analysis),
      priorityPages: formData && formData.arq_prioridad ? splitList(formData.arq_prioridad) : [],
      userFlow: (formData && formData.arq_flujo) || null,
    },
    features: analysis.features,
    design: {
      logoStatus: (formData && formData.brand_logo) || null,
      visualStyle: formData && formData.brand_estilo ? splitList(formData.brand_estilo) : [],
      colors: (formData && formData.brand_colores) || null,
      typography: (formData && formData.brand_tipografia) || null,
      sophistication: (formData && formData.brand_nivel) || null,
    },
    constraints: {
      forbiddenVisuals: (formData && formData.brand_prohibido) || (formData && formData.ai_prohibido) || null,
      extraContext: (formData && formData.ai_extra) || null,
    },
  };

  return validatePlanIR(plan);
}

function extractSections(formData, analysis) {
  const sections = [
    { id: 'hero', required: true },
    { id: 'about', required: true },
    { id: 'services', required: analysis.intent === 'service_business' },
    { id: 'portfolio', required: analysis.intent === 'portfolio' },
    { id: 'products', required: analysis.intent === 'ecommerce' },
    { id: 'testimonials', required: analysis.features.testimonials },
    { id: 'contact', required: true },
    { id: 'footer', required: true },
  ];

  if (analysis.features.blog) sections.push({ id: 'blog', required: false });
  if (analysis.features.faq) sections.push({ id: 'faq', required: false });
  if (analysis.features.booking_system) sections.push({ id: 'booking', required: false });

  return sections;
}

function splitList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

module.exports = { generatePlanIR };
