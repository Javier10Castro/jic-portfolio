const { classifyIntent } = require('./intentClassifier');
const { detectTone } = require('./toneDetector');
const { selectFeatures } = require('./featureSelector');

function analyzeBrief(formData) {
  const intent = classifyIntent(formData);
  const tone = detectTone(formData);
  const features = selectFeatures(formData);

  return {
    intent,
    tone,
    features,
    hasExistingSite: !!(formData && formData.comp_sitio),
    hasLogo: formData && formData.brand_logo ? !formData.brand_logo.includes('no') : false,
    hasContent: formData && formData.cont_textos ? !formData.cont_textos.includes('nada') && !formData.cont_textos.includes('nothing') : false,
    wantsEcommerce: intent === 'ecommerce',
    wantsBlog: features.blog,
    wantsBooking: features.booking_system,
  };
}

module.exports = { analyzeBrief };
