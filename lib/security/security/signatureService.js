const crypto = require('crypto');

class SignatureService {
  constructor(options = {}) {
    this._algorithm = options.algorithm || 'sha256';
    this._key = options.key || crypto.randomBytes(32).toString('hex');
    this._encoding = options.encoding || 'hex';
  }

  sign(data) {
    if (typeof data === 'object') data = JSON.stringify(data);
    const hmac = crypto.createHmac(this._algorithm, this._key);
    hmac.update(data);
    return hmac.digest(this._encoding);
  }

  verify(data, signature) {
    const expected = this.sign(data);
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected, this._encoding), Buffer.from(signature, this._encoding));
  }

  signWithKey(data, privateKey) {
    if (typeof data === 'object') data = JSON.stringify(data);
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(data);
    return signer.sign(privateKey, this._encoding);
  }

  verifyWithKey(data, signature, publicKey) {
    if (typeof data === 'object') data = JSON.stringify(data);
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(data);
    return verifier.verify(publicKey, signature, this._encoding);
  }

  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
    return { publicKey, privateKey };
  }

  clear() {}
}

module.exports = { SignatureService };
