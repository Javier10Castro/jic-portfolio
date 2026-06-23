import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

let requestCounter = 0;

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['X-Request-ID'] = `req_${++requestCounter}_${Date.now()}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retry?: number };

        if (!config || error.response?.status !== 401) {
          return Promise.reject(this.normalizeError(error));
        }

        if (error.response?.status === 401 && !config._retry) {
          return this.handleRefresh(error);
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const session = localStorage.getItem('auth-session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.state?.session?.token || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const session = localStorage.getItem('auth-session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.state?.session?.refreshToken || null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private async handleRefresh(error: AxiosError): Promise<AxiosResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return Promise.reject(this.normalizeError(error));
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.client
        .post<ApiResponse<{ token: string }>>('/auth/refresh', { refreshToken })
        .then((res) => res.data.data.token)
        .catch(() => {
          this.clearSession();
          throw error;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    const newToken = await this.refreshPromise;
    const config = error.config!;
    config.headers.Authorization = `Bearer ${newToken}`;
    return this.client(config);
  }

  private clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-session');
      window.location.href = '/login';
    }
  }

  private normalizeError(error: AxiosError): Error {
    const response = error.response?.data as ApiResponse<unknown> | undefined;
    const err = new Error(response?.error || error.message || 'An unexpected error occurred') as Error & Record<string, unknown>;
    err.status = error.response?.status || 0;
    err.code = response?.error || error.code;
    err.requestId = response?.requestId;
    return err;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await requestFn();
        return response.data;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries && (error as Error & Record<string, unknown>).status !== 401) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }

  async get<T>(url: string, params?: Record<string, string | number | boolean | undefined>, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(() =>
      this.client.get<T>(url, { ...config, params })
    );
  }

  async getPaginated<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<T>> {
    return this.retryRequest(() =>
      this.client.get<PaginatedResponse<T>>(url, { params })
    );
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(() =>
      this.client.post<T>(url, data, config)
    );
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(() =>
      this.client.put<T>(url, data, config)
    );
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(() =>
      this.client.patch<T>(url, data, config)
    );
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.retryRequest(() =>
      this.client.delete<T>(url, config)
    );
  }

  async health(): Promise<ApiResponse<{ healthy: boolean; version: string }>> {
    return this.get('/health');
  }

  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: unknown }>> {
    return this.post('/auth/login', { email, password });
  }

  async register(name: string, email: string, password: string): Promise<ApiResponse<{ token: string; user: unknown }>> {
    return this.post('/auth/register', { name, email, password });
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/auth/forgot-password', { email });
  }

  async getProjects(params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<unknown[]>> {
    return this.get('/projects', params);
  }

  async getProject(id: string): Promise<ApiResponse<unknown>> {
    return this.get(`/projects/${id}`);
  }

  async createProject(data: { name: string; description?: string; prompt?: string }): Promise<ApiResponse<unknown>> {
    return this.post('/projects', data);
  }

  async startStudioBuild(prompt: string): Promise<ApiResponse<unknown>> {
    return this.post('/studio/project', { prompt });
  }

  async getBuildStatus(projectId: string): Promise<ApiResponse<unknown>> {
    return this.get(`/studio/project/${projectId}/build`);
  }

  async getStudioProjects(): Promise<ApiResponse<unknown[]>> {
    return this.get('/studio/projects');
  }

  async advancePipeline(projectId: string, stage: string, data?: unknown): Promise<ApiResponse<unknown>> {
    return this.post('/studio/pipeline/advance', { projectId, stage, data });
  }

  async getDeployments(params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<unknown[]>> {
    return this.get('/deployments', params);
  }
}

export const api = new ApiClient();
export default api;
