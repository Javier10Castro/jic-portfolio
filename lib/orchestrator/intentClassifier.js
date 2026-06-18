function classifyIntent(formData) {
  if (!formData || typeof formData !== 'object') return 'landing_page';

  const text = Object.values(formData).filter(Boolean).join(' ').toLowerCase();

  const patterns = {
    ecommerce: /\b(tienda|vender|venta|shop|store|sell|productos?|products?|carrito|catalogo\s*de\s*venta|ecommerce|e-?commerce|precios?|price|pagar|payment|checkout|carrito)\b/i,
    portfolio: /\b(portafolio|portfolio|trabajos?|works?|proyectos?|projects?|curriculum|resume|cv|hoja\s*de\s*vida|muestra|showcase|galería|gallery)\b/i,
    service_business: /\b(servicios?|services?|consultoría|consulting|agencia|agency|profesional|professional|contratar|hire|cotización|quote|presupuesto|budget|planes?|plans?|membresía|membership|suscripción|subscription)\b/i,
  };

  for (const [type, regex] of Object.entries(patterns)) {
    if (regex.test(text)) return type;
  }

  if (formData.obj_principal) {
    const mainGoal = formData.obj_principal.toLowerCase();
    if (mainGoal.includes('vender') || mainGoal.includes('producto')) return 'ecommerce';
    if (mainGoal.includes('lead') || mainGoal.includes('contacto')) return 'service_business';
  }

  return 'landing_page';
}

module.exports = { classifyIntent };
