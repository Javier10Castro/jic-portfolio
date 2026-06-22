class OAuthProvider {
  constructor(config) {
    this.name = config.name;
    this.authorizationUrl = config.authorizationUrl || '';
    this.tokenUrl = config.tokenUrl || '';
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
    this.scopes = config.scopes || [];
    this._authorizeHandler = config.onAuthorize || (() => ({ url: this.authorizationUrl }));
    this._tokenHandler = config.onToken || (() => ({ accessToken: 'mock-token' }));
  }

  authorize(redirectUri, scopes) {
    return this._authorizeHandler(redirectUri, scopes || this.scopes);
  }

  exchangeCode(code, redirectUri) {
    return this._tokenHandler(code, redirectUri);
  }

  refreshToken(refreshToken) {
    return { accessToken: 'refreshed-mock-token', expiresIn: 3600 };
  }

  setAuthorizeHandler(fn) { this._authorizeHandler = fn; }
  setTokenHandler(fn) { this._tokenHandler = fn; }
}

const createOAuthProvider = (config) => new OAuthProvider(config);

module.exports = { OAuthProvider, createOAuthProvider };
