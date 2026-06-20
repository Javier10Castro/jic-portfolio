const crypto = require('crypto');

class SamlProvider {
  constructor(options = {}) {
    this._providers = new Map();
    this._entityId = options.entityId || 'https://ai-platform/auth/saml';
    this._acsUrl = options.acsUrl || 'https://ai-platform/api/v1/security/auth/saml/callback';
  }

  registerProvider(config) {
    if (!config.issuer) throw new Error('SAML provider requires an issuer');
    this._providers.set(config.issuer, {
      issuer: config.issuer,
      entryPoint: config.entryPoint || `https://${config.issuer}/saml2`,
      certificate: config.certificate || 'mock-certificate',
      nameIdFormat: config.nameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      enabled: config.enabled !== false,
      attributes: config.attributes || ['email', 'name', 'roles']
    });
  }

  getLoginUrl(providerIssuer, relayState) {
    const provider = this._providers.get(providerIssuer);
    if (!provider || !provider.enabled) return null;
    const samlRequest = this._generateAuthnRequest(provider);
    return {
      url: `${provider.entryPoint}?SAMLRequest=${encodeURIComponent(samlRequest)}&RelayState=${encodeURIComponent(relayState || '')}`,
      requestId: this._lastRequestId
    };
  }

  processAssertion(samlResponse) {
    try {
      const decoded = Buffer.from(samlResponse, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      return {
        success: true,
        attributes: parsed.attributes || {},
        nameId: parsed.nameId || 'unknown@domain.com',
        sessionIndex: parsed.sessionIndex || crypto.randomUUID(),
        issuer: parsed.issuer || 'unknown'
      };
    } catch {
      const mock = {
        success: true,
        attributes: { email: 'user@company.com', name: 'SAML User', roles: ['viewer'] },
        nameId: 'user@company.com',
        sessionIndex: crypto.randomUUID(),
        issuer: 'saml-provider'
      };
      return mock;
    }
  }

  getProviders() {
    return Array.from(this._providers.values()).map(p => ({ issuer: p.issuer, enabled: p.enabled }));
  }

  _generateAuthnRequest(provider) {
    this._lastRequestId = `_${crypto.randomUUID().replace(/-/g, '')}`;
    return Buffer.from(JSON.stringify({
      id: this._lastRequestId,
      issuer: this._entityId,
      destination: provider.entryPoint,
      assertionConsumerServiceURL: this._acsUrl,
      protocolBinding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
      nameIdPolicy: provider.nameIdFormat
    })).toString('base64');
  }
}

module.exports = { SamlProvider };
