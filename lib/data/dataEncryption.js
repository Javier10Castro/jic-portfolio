const crypto = require('crypto');
class DataEncryption {
  encrypt(data, key) {
    const cipher = crypto.createCipher('aes-256-cbc', key || 'default-key');
    let encrypted = cipher.update(typeof data === 'string' ? data : JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { success: true, data: encrypted };
  }
  decrypt(data, key) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', key || 'default-key');
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return { success: true, data: decrypted };
    } catch (e) { return { success: false, error: e.message }; }
  }
}
module.exports = { DataEncryption };
