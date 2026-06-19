function extractEntitiesFromMessages(messages) {
  const entities = [];
  if (!messages || !messages.length) return entities;

  const PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i,
    phone: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    url: /\bhttps?:\/\/[^\s]+/gi,
    currency_amount: /\$\s?\d+(?:,\d{3})*(?:\.\d{2})?/g,
    number: /\b\d+\b/g,
  };

  for (const msg of messages) {
    const content = msg.content || '';
    for (const [type, pattern] of Object.entries(PATTERNS)) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          const exists = entities.some(e => e.type === type && e.value === match);
          if (!exists) {
            entities.push({ type, value: match, source: msg.role, messageId: msg.id });
          }
        }
      }
    }
  }

  return entities;
}

function mergeDetectedEntities(existingEntities, newEntities) {
  const merged = [...(existingEntities || [])];
  for (const e of (newEntities || [])) {
    const exists = merged.some(m => m.type === e.type && m.value === e.value);
    if (!exists) merged.push(e);
  }
  return merged;
}

function extractKeyValuePairs(messages) {
  const pairs = {};
  if (!messages) return pairs;

  const PATTERNS = [
    { key: 'email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i },
    { key: 'phone', regex: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
    { key: 'website', regex: /\bhttps?:\/\/[^\s]+/gi },
  ];

  for (const msg of messages) {
    for (const { key, regex } of PATTERNS) {
      if (!pairs[key]) {
        const match = msg.content.match(regex);
        if (match) pairs[key] = match[0];
      }
    }
  }
  return pairs;
}

module.exports = { extractEntitiesFromMessages, mergeDetectedEntities, extractKeyValuePairs };
