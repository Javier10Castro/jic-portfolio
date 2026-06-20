class OAuthProvider {
  constructor(options = {}) {
    this._providers = {
      google: { clientId: options.googleClientId || 'dev-google-client-id', enabled: !!options.googleClientId || !options.googleClientId },
      github: { clientId: options.githubClientId || 'dev-github-client-id', enabled: !!options.githubClientId || !options.githubClientId },
      microsoft: { clientId: options.microsoftClientId || 'dev-microsoft-client-id', enabled: !!options.microsoftClientId || !options.microsoftClientId }
    };
    if (options.googleClientId === '') this._providers.google.enabled = false;
    this._users = new Map();
  }

  getProvider(name) {
    return this._providers[name] || null;
  }

  getAuthorizationUrl(provider, redirectUri) {
    const p = this._providers[provider];
    if (!p || !p.enabled) return null;
    const state = this._generateState();
    const urls = {
      google: `https://accounts.google.com/o/oauth2/auth?client_id=${p.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&state=${state}`,
      github: `https://github.com/login/oauth/authorize?client_id=${p.clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${state}`,
      microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${p.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=User.Read&state=${state}`
    };
    return { url: urls[provider] || null, state };
  }

  exchangeCode(provider, code, redirectUri) {
    const p = this._providers[provider];
    if (!p || !p.enabled) return { success: false, error: 'Provider not available' };
    const mockUsers = {
      google: { sub: 'google-user-001', email: 'user@gmail.com', name: 'Google User', provider: 'google' },
      github: { sub: 'github-user-001', email: 'user@github.com', name: 'GitHub User', provider: 'github' },
      microsoft: { sub: 'ms-user-001', email: 'user@outlook.com', name: 'Microsoft User', provider: 'microsoft' }
    };
    const user = mockUsers[provider];
    if (!user) return { success: false, error: 'Invalid provider' };
    return { success: true, user: { ...user, id: user.sub } };
  }

  findOrCreateUser(profile) {
    for (const [id, u] of this._users) {
      if (u.provider === profile.provider && u.sub === profile.sub) return u;
    }
    const user = { ...profile, id: profile.id || crypto.randomUUID(), createdAt: Date.now() };
    this._users.set(user.id, user);
    return user;
  }

  _generateState() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let state = '';
    for (let i = 0; i < 32; i++) state += chars.charAt(Math.floor(Math.random() * chars.length));
    return state;
  }
}

const crypto = require('crypto');

module.exports = { OAuthProvider };
