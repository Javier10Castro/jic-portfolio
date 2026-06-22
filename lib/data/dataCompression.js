const zlib = require('zlib');
class DataCompression {
  compress(data) {
    const buf = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
    const compressed = zlib.gzipSync(buf);
    return { success: true, data: compressed.toString('base64'), originalSize: buf.length, compressedSize: compressed.length };
  }
  decompress(data) {
    try {
      const buf = Buffer.from(data, 'base64');
      const decompressed = zlib.gunzipSync(buf);
      return { success: true, data: decompressed.toString('utf8') };
    } catch (e) { return { success: false, error: e.message }; }
  }
}
module.exports = { DataCompression };
