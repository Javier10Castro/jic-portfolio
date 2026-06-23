export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
  requestId?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  requestId?: string;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface HealthStatus {
  healthy: boolean;
  version: string;
  uptime: number;
  memory: {
  used: number;
  total: number;
  };
}
