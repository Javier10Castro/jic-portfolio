class SdkRegistry {
  constructor() { this._sdks = {}; this._languages = {}; }

  register(language, sdk) {
    this._sdks[language] = sdk;
    this._languages[language] = { language, registeredAt: Date.now(), status: 'registered' };
  }

  get(language) { return this._sdks[language] || null; }
  unregister(language) { delete this._sdks[language]; delete this._languages[language]; }
  list() { return Object.values(this._languages); }
  getCount() { return Object.keys(this._sdks).length; }
  clear() { this._sdks = {}; this._languages = {}; }
}

module.exports = { SdkRegistry };
