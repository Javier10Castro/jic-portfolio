export interface PlatformConfig { apiKey?: string; baseUrl?: string; timeout?: number; maxRetries?: number; }
export interface PaginatedResult<T> { items: T[]; total: number; offset: number; limit: number; }

export class PlatformClient {
  private apiKey: string; private baseUrl: string; private timeout: number; private maxRetries: number;
  private _rateLimitRemaining = 100;

  constructor(config: PlatformConfig = {}) {
    this.apiKey = config.apiKey || process.env.PLATFORM_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.platform.io/v1';
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
  }

  private async _request<T>(method: string, path: string, data?: any): Promise<T> {
    const headers: Record<string, string> = { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json', 'User-Agent': 'platform-sdk-ts/4.5.0' };
    let lastError: any;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
      try {
        const response = await fetch(`${this.baseUrl}${path}`, { method, headers, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(this.timeout) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (e) { lastError = e; if (attempt < this.maxRetries && e.message?.includes('5')) continue; throw e; }
    }
    throw lastError;
  }

  async get<T>(path: string): Promise<T> { return this._request<T>('GET', path); }
  async post<T>(path: string, data?: any): Promise<T> { return this._request<T>('POST', path, data); }
  async put<T>(path: string, data?: any): Promise<T> { return this._request<T>('PUT', path, data); }
  async delete<T>(path: string): Promise<T> { return this._request<T>('DELETE', path); }

  async *paginate<T>(path: string, options?: { limit?: number }): AsyncGenerator<PaginatedResult<T>> {
    const limit = options?.limit || 20; let offset = 0;
    while (true) { const result = await this.get<{ data?: T[]; results?: T[]; total: number }>(`${path}?limit=${limit}&offset=${offset}`); const items = result.data || result.results || []; yield { items, total: result.total, offset, limit }; offset += limit; if (items.length < limit) break; }
  }

  plugins = { list: () => this.get('/plugins'), get: (id: string) => this.get(`/plugins/${id}`) };
  integrations = { list: () => this.get('/integrations'), connect: (data: any) => this.post('/integrations/connect', data) };
}
