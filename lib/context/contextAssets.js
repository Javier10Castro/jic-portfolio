function processAssets(assets = []) {
  return assets.map(a => {
    if (typeof a === 'string') {
      return { id: null, url: a, type: _inferType(a), name: null, size: null };
    }
    return {
      id: a.id || null,
      url: a.url || null,
      type: a.type || _inferType(a.url || a.name || ''),
      name: a.name || null,
      size: a.size || null,
      uploadedAt: a.uploadedAt || new Date().toISOString(),
    };
  });
}

function _inferType(path) {
  if (!path) return 'unknown';
  const ext = path.split('.').pop().toLowerCase();
  const map = {
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', svg: 'image', webp: 'image',
    pdf: 'document', doc: 'document', docx: 'document',
    mp4: 'video', mov: 'video',
    mp3: 'audio', wav: 'audio',
    zip: 'archive', rar: 'archive',
    json: 'data', csv: 'data',
    ttf: 'font', otf: 'font', woff: 'font', woff2: 'font',
  };
  return map[ext] || 'unknown';
}

function attachAssets(context, assets) {
  const processed = processAssets(assets);
  const existing = context.assets || [];
  return [...existing, ...processed];
}

module.exports = { processAssets, attachAssets };
