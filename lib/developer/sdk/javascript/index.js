class PlatformClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.PLATFORM_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.platform.io/v1';
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this._rateLimitRemaining = 100;
  }

  async _request(method, path, data) {
    const headers = { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json', 'User-Agent': 'platform-sdk-js/4.5.0' };
    const url = `${this.baseUrl}${path}`;
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
      try {
        const response = await fetch(url, { method, headers, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(this.timeout) });
        this._rateLimitRemaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '100');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return await response.json();
      } catch (e) {
        lastError = e;
        if (e.name === 'AbortError') throw new Error('Request timeout');
        if (attempt < this.maxRetries && response && response.status >= 500) continue;
        throw e;
      }
    }
    throw lastError;
  }

  get(path) { return this._request('GET', path); }
  post(path, data) { return this._request('POST', path, data); }
  put(path, data) { return this._request('PUT', path, data); }
  delete(path) { return this._request('DELETE', path); }

  paginate(path, options = {}) {
    const limit = options.limit || 20;
    const _getPage = async (offset) => {
      const result = await this.get(`${path}?limit=${limit}&offset=${offset}`);
      return { items: result.data || result.results || [], total: result.total || 0, offset, limit };
    };
    return { _getPage, [Symbol.asyncIterator]: () => { let offset = 0; return { next: async () => { const page = await _getPage(offset); offset += limit; return { value: page, done: page.items.length === 0 }; } }; } };
  }

  stream(path, onData) {
    const es = new EventSource(`${this.baseUrl}${path}`, { headers: { 'Authorization': `Bearer ${this.apiKey}` } });
    es.onmessage = (e) => { try { onData(JSON.parse(e.data)); } catch (err) {} };
    es.onerror = () => es.close();
    return () => es.close();
  }

  plugins = { list: () => this.get('/plugins'), get: (id) => this.get(`/plugins/${id}`), install: (data) => this.post('/plugins/install', data) };
  integrations = { list: () => this.get('/integrations'), connect: (data) => this.post('/integrations/connect', data), disconnect: (provider) => this.post('/integrations/disconnect', { provider }) };
  deployments = { list: () => this.get('/deployments'), create: (data) => this.post('/deployments', data) };
  workflows = { list: () => this.get('/workflows'), run: (id, data) => this.post(`/workflows/${id}/run`, data) };
  billing = { getPlan: () => this.get('/billing/plans'), getInvoices: () => this.get('/billing/invoices'), getUsage: () => this.get('/billing/usage') };
}

module.exports = { PlatformClient };
