function detectTone(formData) {
  if (!formData || typeof formData !== 'object') return 'friendly_professional';

  const text = Object.values(formData).filter(Boolean).join(' ').toLowerCase();

  const luxuryWords = /\b(lujo|luxury|exclusiv|premium|elegante|elegant|sofisticad|sophisticat|gourmet|alta\s*gama|high.?end|deluxe|boutique|distinguido|prestigio|prestige|lujoso)\b/i;
  const luxuryScore = (text.match(luxuryWords) || []).length;

  const casualWords = /\b(casual|relajad|relaxed|informal|divertido|fun|amigable|friendly|joven|young|moderno|modern|cool|genial|fresh|fresco|desenfadado|funny|gracioso)\b/i;
  const casualScore = (text.match(casualWords) || []).length;

  const professionalWords = /\b(profesional|professional|serio|serious|formal|corporativ|corporate|empresa|business|confiable|trustworthy|seriedad|responsabilidad|responsibility|trayectoria|experience)\b/i;
  const professionalScore = (text.match(professionalWords) || []).length;

  if (luxuryScore > casualScore && luxuryScore > professionalScore) return 'luxury';
  if (casualScore > professionalScore && casualScore >= luxuryScore) return 'casual';

  return 'friendly_professional';
}

module.exports = { detectTone };
