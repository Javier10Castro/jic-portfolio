function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const clamp = (v) => Math.round(Math.max(0, Math.min(255, v)));
  const toHex = (v) => clamp(v).toString(16).padStart(2, '0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function linearize(channel) {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return relativeLuminance(r, g, b);
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function lighten(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function isLight(hex) {
  return luminance(hex) > 0.5;
}

function bestContrast(hex, candidates) {
  let best = candidates[0];
  let bestRatio = 0;
  for (const c of candidates) {
    const ratio = contrastRatio(hex, c);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = c;
    }
  }
  return best;
}

function computeTheme(colors) {
  const palette = (colors.palette || []).filter(Boolean);
  const allColors = [colors.primary, colors.secondary, colors.accent, ...palette].filter(Boolean);
  const avgLuminance = allColors.length
    ? allColors.reduce((sum, c) => sum + luminance(c), 0) / allColors.length
    : 0.5;

  const isDarkTheme = avgLuminance < 0.4;
  const bg = isDarkTheme ? '#F8F9FA' : '#0B0F19';
  const text = isDarkTheme ? '#1A1A1A' : '#F3F4F6';
  const surface = isDarkTheme ? '#FFFFFF' : '#131829';
  const border = isDarkTheme ? '#E5E7EB' : '#1E2640';

  const validText = contrastRatio(text, bg) >= 4.5
    ? text
    : (isDarkTheme ? '#000000' : '#FFFFFF');

  return {
    theme: isDarkTheme ? 'light' : 'dark',
    background: bg,
    text: validText,
    surface,
    border,
    isDark: !isDarkTheme,
  };
}

function generateCSSVariables(colors) {
  const { primary, secondary, accent, palette } = colors;
  const theme = computeTheme(colors);

  let css = ':root {\n';
  if (primary) css += `  --color-primary: ${primary};\n`;
  if (secondary) css += `  --color-secondary: ${secondary};\n`;
  if (accent) css += `  --color-accent: ${accent};\n`;
  css += `  --color-bg: ${theme.background};\n`;
  css += `  --color-text: ${theme.text};\n`;
  css += `  --color-surface: ${theme.surface};\n`;
  css += `  --color-border: ${theme.border};\n`;
  if (palette && palette.length) {
    palette.forEach((c, i) => {
      css += `  --color-${i}: ${c};\n`;
    });
  }
  css += '}\n';
  return css;
}

function generateDesignTokens(colors) {
  const theme = computeTheme(colors);
  const primary = colors.primary || null;
  const secondary = colors.secondary || null;
  const accent = colors.accent || null;

  return {
    colors: { primary, secondary, accent },
    palette: (colors.palette || []).filter(Boolean),
    semantic: {
      background: theme.background,
      text: theme.text,
      surface: theme.surface,
      border: theme.border,
      primary: primary || theme.text,
      secondary: secondary || theme.surface,
      accent: accent || theme.text,
    },
    theme: theme.theme,
  };
}

function generateThemeMapping(colors) {
  const theme = computeTheme(colors);
  const primary = colors.primary || null;

  const hover = primary
    ? (theme.isDark ? lighten(primary, 0.12) : darken(primary, 0.15))
    : null;
  const active = primary
    ? (theme.isDark ? lighten(primary, 0.2) : darken(primary, 0.25))
    : null;
  const muted = primary
    ? (theme.isDark ? lighten(primary, 0.5) : darken(primary, 0.5))
    : null;

  const textOnPrimary = primary
    ? bestContrast(primary, ['#FFFFFF', '#1A1A1A', theme.text])
    : theme.text;

  return {
    background: theme.background,
    text: theme.text,
    surface: theme.surface,
    border: theme.border,
    primaryUI: primary || theme.text,
    hover,
    active,
    muted,
    textOnPrimary,
    primaryLuminance: primary ? luminance(primary) : null,
    theme: theme.theme,
  };
}

function buildDesignSystem(branding_colors) {
  const colors = {
    primary: branding_colors.primary || null,
    secondary: branding_colors.secondary || null,
    accent: branding_colors.accent || null,
    palette: (branding_colors.palette || []).filter(Boolean),
  };

  const css = generateCSSVariables(colors);
  const tokens = generateDesignTokens(colors);
  const mapping = generateThemeMapping(colors);

  return {
    colors,
    css,
    tokens,
    mapping,
  };
}

module.exports = {
  generateCSSVariables,
  generateDesignTokens,
  generateThemeMapping,
  buildDesignSystem,
};
