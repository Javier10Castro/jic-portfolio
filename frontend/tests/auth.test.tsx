import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, isAuthenticated: false, isLoading: false, error: null });
  });

  it('has expected shape', () => {
    const state = useAuthStore.getState();
    expect(state).toHaveProperty('session');
    expect(state).toHaveProperty('isAuthenticated');
    expect(state).toHaveProperty('isLoading');
    expect(state).toHaveProperty('error');
    expect(state).toHaveProperty('login');
    expect(state).toHaveProperty('register');
    expect(state).toHaveProperty('logout');
    expect(state).toHaveProperty('setSession');
    expect(state).toHaveProperty('clearError');
    expect(state).toHaveProperty('checkSession');
  });

  it('initial state has null session', () => {
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('setSession updates session', () => {
    const session = {
      token: 'test-token',
      refreshToken: 'test-refresh',
      expiresAt: Date.now() + 3600000,
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'user' as const, createdAt: new Date().toISOString() },
    };
    useAuthStore.getState().setSession(session);
    expect(useAuthStore.getState().session).toEqual(session);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('logout clears session', () => {
    useAuthStore.getState().setSession({
      token: 'test',
      refreshToken: 'test',
      expiresAt: Date.now() + 3600000,
      user: { id: '1', email: 't@t.com', name: 'T', role: 'user', createdAt: new Date().toISOString() },
    });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('checkSession returns false when session expired', () => {
    useAuthStore.getState().setSession({
      token: 'test',
      refreshToken: 'test',
      expiresAt: Date.now() - 1000,
      user: { id: '1', email: 't@t.com', name: 'T', role: 'user', createdAt: new Date().toISOString() },
    });
    expect(useAuthStore.getState().checkSession()).toBe(false);
  });
});
