class GoogleOAuth {
  constructor(config = {}) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.tokens = { access_token: null, refresh_token: null, expiry_date: null };
  }

  generateAuthUrl(redirectUri, scopes = []) {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', redirectUri || this.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    return { success: true, url: url.toString() };
  }

  async exchangeCode(code, redirectUri) {
    this.tokens = {
      access_token: 'ya29.mock-access-token',
      refresh_token: '1//mock-refresh-token',
      expiry_date: Date.now() + 3600000,
      id_token: 'mock-id-token',
      scope: 'openid profile email',
      token_type: 'Bearer',
    };
    return { success: true, data: { ...this.tokens } };
  }

  async refreshToken(refreshToken) {
    this.tokens = {
      access_token: 'ya29.mock-refreshed-token',
      refresh_token: refreshToken || this.tokens.refresh_token,
      expiry_date: Date.now() + 3600000,
      scope: 'openid profile email',
      token_type: 'Bearer',
    };
    return { success: true, data: { ...this.tokens } };
  }

  async getAccessToken() {
    if (this.tokens.expiry_date && this.tokens.expiry_date > Date.now()) {
      return { success: true, accessToken: this.tokens.access_token };
    }
    if (this.tokens.refresh_token) {
      const result = await this.refreshToken(this.tokens.refresh_token);
      return { success: true, accessToken: result.data.access_token };
    }
    return { success: false, error: 'No valid tokens available' };
  }
}

module.exports = { GoogleOAuth };
