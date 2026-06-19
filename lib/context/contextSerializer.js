function serialize(context) {
  return JSON.stringify(context, null, 2);
}

function deserialize(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

function toPlanIR(context) {
  return {
    meta: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      source: 'context-builder',
      conversationId: context.conversationId || null,
    },
    project: {
      name: context.project?.name || context.project?.brand_name || 'Untitled',
      tagline: context.project?.tagline || '',
      type: context.intentType || 'website',
      existingSite: context.project?.existing_site || null,
    },
    audience: {
      description: context.audience?.description || '',
      target: context.audience?.target || context.project?.target_user || '',
      problems: context.audience?.problems || [],
      motivations: context.audience?.motivations || [],
    },
    tone: {
      style: context.settings?.tone || 'professional',
      brandPersonality: [context.settings?.tone || 'professional'],
      brandFeeling: context.settings?.brand_feelings || ['trustworthy'],
    },
    structure: {
      pages: (context.pages || []).map(p => ({
        id: p.id || p.title?.toLowerCase().replace(/\s+/g, '_'),
        title: p.title || p.name,
        type: p.type || 'content',
        required: p.required !== false,
      })),
      priorityPages: context.pages?.filter(p => p.priority === 'high' || p.priority === 1).map(p => p.title) || [],
      userFlow: context.project?.user_flow || [],
    },
    features: _extractFeatures(context),
    design: {
      logoStatus: context.assets?.find(a => a.type === 'image') ? 'has_logo' : (context.project?.logo_status || 'text_only'),
      visualStyle: [context.settings?.visual_style || 'modern'],
      colors: context.settings?.color_palette ? [context.settings.color_palette] : [],
    },
    constraints: {
      forbiddenVisuals: [],
      extraContext: context.project?.extra_context || '',
    },
  };
}

function _extractFeatures(context) {
  const features = {};
  const featureMap = {
    contact_form: 'contact_form', booking_system: 'booking_system',
    online_ordering: 'online_ordering', newsletter: 'newsletter',
    analytics: 'analytics', dark_mode: 'dark_mode',
    reviews_enabled: 'reviews', social_share: 'social_share',
    reservation_system: 'reservation_system', delivery_available: 'delivery',
    team_collaboration: 'team_collaboration', comments_enabled: 'comments',
    testimonials: 'testimonials', video_enabled: 'video',
  };
  for (const [key, feature] of Object.entries(featureMap)) {
    if (context.settings?.[key] === true || context.settings?.[key] === 'true' || context.settings?.[key] === 'yes') {
      features[feature] = true;
    }
  }
  return features;
}

module.exports = { serialize, deserialize, toPlanIR };
