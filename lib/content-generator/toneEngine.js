function buildToneProfile(designStrategy) {
  const brand = designStrategy.brand;
  const voice = brand.brandVoice;
  const tone = brand.brandTone;
  const values = brand.brandValues || [];

  const formality = resolveFormality(voice, tone);
  const warmth = resolveWarmth(voice, tone);
  const directness = resolveDirectness(voice, tone);
  const inspiration = resolveInspiration(voice, tone);
  const technicality = resolveTechnicality(voice, tone);

  return {
    formality,
    warmth,
    directness,
    inspiration,
    technicality,
    brandValues: values,
    brandTone: tone,
    ctaStyle: resolveCtaStyle(directness, warmth, tone),
    sentenceStructure: resolveSentenceStructure(formality),
    vocabularyTier: resolveVocabularyTier(formality, technicality),
    emphasisStyle: resolveEmphasisStyle(inspiration, warmth),
  };
}

function resolveFormality(voice, tone) {
  let score = 3;
  if (voice.formal === true) score += 2;
  if (voice.formal === false) score -= 1;
  if (tone.includes('professional') || tone.includes('corporate') || tone.includes('commercial')) score += 1;
  if (tone.includes('friendly') || tone.includes('playful')) score -= 1;
  return clamp(score, 1, 5);
}

function resolveWarmth(voice, tone) {
  let score = 3;
  if (voice.warm === true) score += 2;
  if (voice.warm === false) score -= 1;
  if (tone.includes('warm') || tone.includes('friendly') || tone.includes('aspirational')) score += 1;
  if (tone.includes('corporate') || tone.includes('technical')) score -= 1;
  return clamp(score, 1, 5);
}

function resolveDirectness(voice, tone) {
  let score = 3;
  if (voice.direct === true) score += 2;
  if (voice.inspirational === true) score -= 1;
  if (tone.includes('persuasive') || tone.includes('direct')) score += 1;
  if (tone.includes('editorial') || tone.includes('aspirational')) score -= 1;
  return clamp(score, 1, 5);
}

function resolveInspiration(voice, tone) {
  let score = 2;
  if (voice.inspirational === true) score += 2;
  if (tone.includes('aspirational') || tone.includes('creative') || tone.includes('showcase')) score += 2;
  if (tone.includes('corporate') || tone.includes('commercial') || tone.includes('functional')) score -= 1;
  return clamp(score, 1, 5);
}

function resolveTechnicality(voice, tone) {
  let score = 2;
  if (voice.technical === true) score += 2;
  if (tone.includes('technical') || tone.includes('corporate') || tone.includes('professional')) score += 1;
  if (tone.includes('friendly') || tone.includes('playful')) score -= 1;
  return clamp(score, 1, 5);
}

function resolveCtaStyle(directness, warmth, tone) {
  if (directness >= 4) return 'direct_action';
  if (warmth >= 4) return 'invitation';
  if (tone.includes('persuasive')) return 'benefit_driven';
  if (tone.includes('professional')) return 'polished_request';
  return 'neutral';
}

function resolveSentenceStructure(formality) {
  if (formality >= 4) return 'complex';
  if (formality <= 2) return 'short';
  return 'balanced';
}

function resolveVocabularyTier(formality, technicality) {
  const avg = (formality + technicality) / 2;
  if (avg >= 4) return 'sophisticated';
  if (avg <= 2) return 'simple';
  return 'standard';
}

function resolveEmphasisStyle(inspiration, warmth) {
  if (inspiration >= 4 && warmth >= 3) return 'aspirational';
  if (warmth >= 4) return 'empathetic';
  if (inspiration >= 4) return 'visionary';
  return 'direct_value';
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

module.exports = { buildToneProfile };
