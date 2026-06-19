class RetryEngine {
  constructor(options = {}) {
    this._defaultMaxRetries = options.maxRetries || 3;
    this._defaultBackoff = options.backoff || 'exponential';
    this._defaultBaseDelay = options.baseDelay || 1000;
    this._maxDelay = options.maxDelay || 60000;
    this._jitter = options.jitter !== false;
  }

  async executeWithRetry(fn, stepId, policy = {}) {
    const maxRetries = policy.maxRetries ?? this._defaultMaxRetries;
    const backoff = policy.backoff || this._defaultBackoff;
    const baseDelay = policy.baseDelay ?? this._defaultBaseDelay;
    let lastError = null;
    const attempts = [];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn(attempt);
        return { success: true, result, attempts: attempt + 1, lastAttempt: attempt };
      } catch (error) {
        lastError = error;
        attempts.push({ attempt: attempt + 1, error: error.message, timestamp: Date.now() });
        if (attempt < maxRetries) {
          const delay = this._calculateDelay(attempt + 1, backoff, baseDelay);
          await this._sleep(delay);
        }
      }
    }

    return {
      success: false,
      error: lastError.message,
      attempts: maxRetries + 1,
      lastAttempt: maxRetries,
      attemptHistory: attempts,
    };
  }

  _calculateDelay(attempt, backoff, baseDelay) {
    let delay;
    switch (backoff) {
      case 'linear':
        delay = baseDelay * attempt;
        break;
      case 'fixed':
        delay = baseDelay;
        break;
      case 'exponential':
      default:
        delay = baseDelay * Math.pow(2, attempt - 1);
        break;
    }
    if (this._jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    return Math.min(delay, this._maxDelay);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  shouldRetry(error, attempt, maxRetries) {
    if (attempt >= maxRetries) return false;
    if (error.code === 'VALIDATION_ERROR') return false;
    if (error.code === 'NOT_FOUND') return false;
    if (error.message && error.message.includes('timeout')) return true;
    return true;
  }
}

module.exports = RetryEngine;
