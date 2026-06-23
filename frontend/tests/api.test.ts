import { describe, it, expect, vi } from 'vitest';
import api from '@/services/api';

describe('API client', () => {
  it('has required methods', () => {
    expect(api).toHaveProperty('get');
    expect(api).toHaveProperty('post');
    expect(api).toHaveProperty('put');
    expect(api).toHaveProperty('patch');
    expect(api).toHaveProperty('delete');
    expect(api).toHaveProperty('health');
    expect(api).toHaveProperty('login');
    expect(api).toHaveProperty('register');
  });

  it('methods are functions', () => {
    expect(typeof api.get).toBe('function');
    expect(typeof api.post).toBe('function');
    expect(typeof api.put).toBe('function');
    expect(typeof api.patch).toBe('function');
    expect(typeof api.delete).toBe('function');
    expect(typeof api.health).toBe('function');
    expect(typeof api.login).toBe('function');
    expect(typeof api.register).toBe('function');
  });

  it('api instance is defined', () => {
    expect(api).toBeDefined();
    expect(api).not.toBeNull();
  });
});
