function selectFeatures(formData) {
  const features = {
    contact_form: true,
    email_integration: true,
    analytics: true,
    booking_system: false,
    product_catalog: false,
    blog: false,
    testimonials: false,
    faq: false,
    newsletter: false,
    live_chat: false,
  };

  if (!formData || typeof formData !== 'object') return features;

  const text = Object.values(formData).filter(Boolean).join(' ').toLowerCase();

  if (/\b(reservas?|booking|appointment|cita|agendar|schedule|reservation|calendly|calendario|turnos?)\b/i.test(text)) {
    features.booking_system = true;
  }

  if (/\b(catalogo|catalog|productos?|products?|inventario|inventory|stock|catálogo)\b/i.test(text)) {
    features.product_catalog = true;
  }

  if (/\b(blog|noticias?|news|artículos?|articles?|publicaciones?|posts?|contenido|content)\b/i.test(text)) {
    features.blog = true;
  }

  if (/\b(testimonios?|testimonials?|reseñas?|reviews?|casos?\s*de\s*éxito|case\s*stud(y|ies)|clientes?\s*felices|happy\s*client)\b/i.test(text)) {
    features.testimonials = true;
  }

  if (/\b(faq|preguntas?\s*frecuentes|frequently\s*asked|dudas|questions)\b/i.test(text)) {
    features.faq = true;
  }

  if (/\b(newsletter|boletín|boletin|correo\s*electrónico|email\s*marketing|suscripción|subscription|notificaciones?)\b/i.test(text)) {
    features.newsletter = true;
  }

  if (/\b(chat\s*en\s*vivo|live\s*chat|whatsapp|chatbot|soporte\s*en\s*línea|online\s*support|messenger)\b/i.test(text)) {
    features.live_chat = true;
  }

  return features;
}

module.exports = { selectFeatures };
