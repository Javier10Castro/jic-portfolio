function merge(base, ...sources) {
  const result = { ...base };
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const [key, val] of Object.entries(source)) {
      if (val === undefined || val === null) continue;
      if (Array.isArray(val)) {
        result[key] = [...new Set([...(result[key] || []), ...val])];
      } else if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
        result[key] = { ...(result[key] || {}), ...val };
      } else if (val !== '' || (result[key] === undefined || result[key] === null)) {
        result[key] = val;
      }
    }
  }
  return result;
}

function prioritizeBySource(base, answers, inferences, defaults) {
  let context = { ...base };
  context = merge(context, inferences);
  context = merge(context, answers);
  context = merge(context, defaults);
  return context;
}

module.exports = { merge, prioritizeBySource };
