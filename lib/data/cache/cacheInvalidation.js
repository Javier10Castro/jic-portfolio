class CacheInvalidation {
  constructor() {
    this._staleKeys = {};
  }

  invalidateByKey(cache, key) {
    if (!cache || !key) return false;
    cache.delete(key);
    return true;
  }

  invalidateByPattern(cache, pattern) {
    if (!cache || !pattern) return 0;
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    const keys = cache.list ? cache.list() : Object.keys(cache._data || {});
    let count = 0;
    keys.forEach(k => {
      if (regex.test(k)) { cache.delete(k); count++; }
    });
    return count;
  }

  invalidateByTag(cache, tag) {
    if (!cache || !tag) return 0;
    const keys = cache.list ? cache.list() : Object.keys(cache._data || {});
    let count = 0;
    keys.forEach(k => {
      const entry = cache.get ? cache.get(k) : null;
      if (entry && entry.tags && entry.tags.includes(tag)) { cache.delete(k); count++; }
    });
    return count;
  }

  invalidateAll(cache) {
    if (!cache) return false;
    if (cache.clear) cache.clear();
    return true;
  }

  markStale(cache, key) {
    if (!cache || !key) return false;
    this._staleKeys[key] = Date.now();
    return true;
  }

  isStale(cache, key) {
    return key in this._staleKeys;
  }

  clear() {
    this._staleKeys = {};
  }
}

module.exports = { CacheInvalidation };
