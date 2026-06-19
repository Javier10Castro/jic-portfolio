function normalizePhone(value) {
  if (!value) return value;
  const cleaned = value.replace(/[^\d+]/g, '');
  if (cleaned.length === 10 && !cleaned.startsWith('+')) return `+1${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
  if (cleaned.startsWith('+')) return cleaned;
  return cleaned;
}

function normalizeEmail(value) {
  if (!value) return value;
  return value.trim().toLowerCase();
}

function normalizeUrl(value) {
  if (!value) return value;
  const cleaned = value.trim();
  if (!/^https?:\/\//i.test(cleaned)) return `https://${cleaned}`;
  return cleaned;
}

function normalizeColor(value) {
  if (!value) return value;
  const cleaned = value.trim().toLowerCase();
  const COLOR_MAP = {
    black: '#000000', white: '#ffffff', red: '#ef4444', blue: '#3b82f6',
    green: '#22c55e', yellow: '#eab308', purple: '#a855f7', orange: '#f97316',
    pink: '#ec4899', gray: '#6b7280', navy: '#1e3a5f', teal: '#0d9488',
  };
  if (COLOR_MAP[cleaned]) return COLOR_MAP[cleaned];
  if (/^#[0-9a-f]{6}$/.test(cleaned)) return cleaned;
  if (/^#[0-9a-f]{3}$/.test(cleaned)) return cleaned.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3');
  return cleaned;
}

function normalizeCurrency(value) {
  if (!value) return value;
  const map = { usd: 'usd', us: 'usd', dollars: 'usd', dollar: 'usd', '$': 'usd',
    eur: 'eur', euro: 'eur', euros: 'eur', gbp: 'gbp', pound: 'gbp',
    mxn: 'mxn', mx: 'mxn', peso: 'mxn', pesos: 'mxn',
    cad: 'cad', canadian: 'cad' };
  return map[value.trim().toLowerCase()] || value.trim().toLowerCase();
}

function normalizeLanguage(value) {
  if (!value) return value;
  const map = { en: 'en', english: 'en', es: 'es', spanish: 'es', 'spanish': 'es',
    fr: 'fr', french: 'fr', de: 'de', german: 'de', it: 'it', italian: 'it',
    pt: 'pt', portuguese: 'pt', ja: 'ja', japanese: 'ja', '中文': 'zh' };
  return map[value.trim().toLowerCase()] || value.trim().toLowerCase();
}

function trimWhitespace(value) {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/\s+/g, ' ');
}

function removeDuplicates(arr) {
  if (!Array.isArray(arr)) return arr;
  return [...new Set(arr)];
}

function normalizeValue(key, value) {
  if (value == null || value === '') return value;
  const normalizers = {
    phone: normalizePhone,
    email: normalizeEmail,
    url: normalizeUrl,
    website: normalizeUrl,
    color: normalizeColor,
    color_palette: normalizeColor,
    currency: normalizeCurrency,
    language: normalizeLanguage,
  };
  const fn = normalizers[key];
  if (fn) return fn(value);
  if (typeof value === 'string') return trimWhitespace(value);
  return value;
}

function normalizeContext(context) {
  if (!context || typeof context !== 'object') return context;
  const result = {};
  for (const [key, val] of Object.entries(context)) {
    if (Array.isArray(val)) {
      result[key] = removeDuplicates(val.map(v => normalizeValue(key, v)));
    } else {
      result[key] = normalizeValue(key, val);
    }
  }
  return result;
}

module.exports = { normalizePhone, normalizeEmail, normalizeUrl, normalizeColor, normalizeCurrency, normalizeLanguage, trimWhitespace, removeDuplicates, normalizeValue, normalizeContext };
