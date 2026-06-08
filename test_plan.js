const { compile } = require('./lib/plan/index.js');

const prompt = `## 1. BUSINESS IDENTITY
name: Salmos Café
tagline: Donde el cafe es un verso al paladar
history: inició en un campamento juvenil vendiendo café, evolucionó a eventos (bodas, fiestas, campamentos)
mission: undefined
vision: abrir local propio y formar baristas
values: compañerismo, honestidad, amor, sinceridad
differentiator: enfoque empático y eventos personalizados
personality: cercana, amigable, tradicional, confiable, divertida, energética

## 2. BUSINESS GOALS
main_objective: fortalecer imagen de marca
secondary_objectives: educación del mercado, posicionamiento SEO, expansión de mercado, alianzas comerciales
kpi: contratación de eventos
timeline: 3-6 meses
conversion_goal: formulario de contacto

## 3. AUDIENCE
primary_audience: gente de iglesia + expansión a otros mercados
pain_points: presupuesto limitado en eventos
motivations: conexión emocional con el servicio
decision_behavior: decisiones rápidas
channel: Instagram

## 4. BRANDING
logo_status: needs update
colors: #529fb3, black, white
typography_style: moderno + coloquial
visual_style: fotográfico, inmersivo, colorido, vibrante, tecnológico
emotions: confianza, seguridad, tranquilidad, energía
forbidden_elements: logos no oficiales, colores LED
sophistication_level: 4/5

## 5. SITE ARCHITECTURE
pages: home, about_us, services, portfolio, contact, terms
priority_pages: about_us, gallery, quotes_form
user_flow: about_us → gallery → contact/quotes

## 6. CONTENT
assets_available: photos: yes, videos: no, downloadable_assets: yes

## 7. SERVICES
main_service: barra de café para eventos
benefit: experiencia premium en eventos
pricing_model: hidden
process: contacto → cotización → anticipo → evento

## 8. SOCIAL PROOF
experience: 3 años + 50 eventos
clients: caos creativo
media: videos y publicidad
testimonials: none

## 9. FUNCTIONALITY
basic: contact form, image gallery
advanced: booking system, ecommerce (future), admin panel (external)
tools: quotation form, gallery system

## 10. SEO
keywords: undefined
geo: ciudades
content_strategy: undefined

## 11. REFERENCES
liked: Apple UI style, Starbucks Mexico menu, BlueLuna animations
disliked: overloaded product sites
brand_keywords: moderno, clásico, elegante

## 12. CONVERSION
cta_primary: reserva ahora
lead_magnet: cata de café gratis
follow_up: llamada o email

## 13. BRAND ESSENCE
brand_metaphor: café como experiencia emocional
first_5_seconds_goal: calidez inmediata
deep_differentiator: conexión humana con clientes

## 14. SYSTEM RULES
- No inference outside data
- No missing section removal
- Missing values = null
- Output must be deterministic`;

const result = compile(prompt);

// === 1. Full JSON IR ===
console.log('=== 1. JSON IR GENERADO ===');
console.log(JSON.stringify(result, null, 2));

// === 2. Pages detected ===
console.log('\n=== 2. PÁGINAS DETECTADAS ===');
if (result.project.structure.pages && result.project.structure.pages.length > 0) {
  result.project.structure.pages.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
} else {
  console.log('  (ninguna — formato de prompt no compatible)');
}

// === 3. Components ===
console.log('\n=== 3. COMPONENTES DETECTADOS ===');
const components = [];
if (result.project.assets.basic_features) components.push(...result.project.assets.basic_features.map(f => `Basic: ${f}`));
if (result.project.assets.advanced_features) components.push(...result.project.assets.advanced_features.map(f => `Advanced: ${f}`));
if (result.project.conversion.main_cta) components.push(`CTA: ${result.project.conversion.main_cta}`);
if (components.length > 0) components.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
else console.log('  (ninguno — formato de prompt no compatible)');

// === 4. Design system ===
console.log('\n=== 4. DESIGN SYSTEM EXTRAÍDO ===');
const ds = result.project.ui;
console.log(`  Colors:         ${ds.color_palette || '(none)'}`);
console.log(`  Typography:     ${ds.typography || '(none)'}`);
console.log(`  Visual style:   ${ds.visual_style.length > 0 ? ds.visual_style.join(', ') : '(none)'}`);
console.log(`  Emotions:       ${ds.emotions.length > 0 ? ds.emotions.join(', ') : '(none)'}`);
console.log(`  Sophistication: ${ds.sophistication || '(none)'}`);

// === 5. Conversion flow ===
console.log('\n=== 5. CONVERSION FLOW IDENTIFICADO ===');
const cv = result.project.conversion;
console.log(`  Main CTA:       ${cv.main_cta || '(none)'}`);
console.log(`  Lead magnet:    ${cv.lead_magnet || '(none)'}`);
console.log(`  Follow-up:      ${cv.follow_up || '(none)'}`);
console.log(`  Timeline:       ${cv.timeline || '(none)'}`);
console.log(`  Main goal:      ${result.project.identity.main_goal || '(none)'}`);
console.log(`  Conversion:     ${result.project.structure.main_conversion || '(none)'}`);
