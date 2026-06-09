const crypto = require('crypto');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(value) {
  if (typeof value !== 'string') return false;
  return UUID_REGEX.test(value.trim());
}

function uuidv5(name) {
  const namespace = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
  const nsBytes = namespace.replace(/-/g, '').match(/.{2}/g).map(b => parseInt(b, 16));
  const nameBytes = Buffer.from(name, 'utf8');
  const hash = crypto.createHash('sha1').update(Buffer.from(nsBytes)).update(nameBytes).digest();
  const bytes = Array.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.substring(0, 8) + '-' + hex.substring(8, 12) + '-' + hex.substring(12, 16) + '-' + hex.substring(16, 20) + '-' + hex.substring(20);
}

function normalizeId(value, fieldName) {
  if (value === null || value === undefined) {
    const err = new Error((fieldName || 'id') + ' is required');
    err.error = true; err.code = 'INVALID_ID_FORMAT'; err.field = fieldName || 'id';
    err.message = (fieldName || 'id') + ' is required';
    err.timestamp = new Date().toISOString(); throw err;
  }
  if (typeof value !== 'string') {
    const err = new Error((fieldName || 'id') + ' must be a string');
    err.error = true; err.code = 'INVALID_ID_FORMAT'; err.field = fieldName || 'id';
    err.message = (fieldName || 'id') + ' must be a string';
    err.timestamp = new Date().toISOString(); throw err;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    const err = new Error((fieldName || 'id') + ' must not be empty');
    err.error = true; err.code = 'INVALID_ID_FORMAT'; err.field = fieldName || 'id';
    err.message = (fieldName || 'id') + ' must not be empty';
    err.timestamp = new Date().toISOString(); throw err;
  }
  if (isUUID(trimmed)) return trimmed;
  const err = new Error((fieldName || 'id') + ' must be a valid UUID v4');
  err.error = true; err.code = 'INVALID_ID_FORMAT'; err.field = fieldName || 'id';
  err.message = (fieldName || 'id') + ' must be a valid UUID v4';
  err.timestamp = new Date().toISOString(); throw err;
}

function normalizeProjectId(value, fieldName) {
  const name = fieldName || 'project_id';
  if (value === null || value === undefined) {
    const err = new Error(name + ' is required');
    err.error = true; err.code = 'INVALID_INPUT'; err.field = name;
    err.message = name + ' is required';
    err.timestamp = new Date().toISOString(); throw err;
  }
  if (typeof value !== 'string') {
    const err = new Error(name + ' must be a string');
    err.error = true; err.code = 'INVALID_INPUT'; err.field = name;
    err.message = name + ' must be a string';
    err.timestamp = new Date().toISOString(); throw err;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    const err = new Error(name + ' must not be empty');
    err.error = true; err.code = 'INVALID_INPUT'; err.field = name;
    err.message = name + ' must not be empty';
    err.timestamp = new Date().toISOString(); throw err;
  }
  return trimmed;
}

function safeUUID(value, fieldName) {
  if (value === null || value === undefined || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  if (isUUID(trimmed)) return trimmed;
  return null;
}

module.exports = { isUUID, normalizeId, normalizeProjectId, safeUUID, uuidv5, UUID_REGEX };
