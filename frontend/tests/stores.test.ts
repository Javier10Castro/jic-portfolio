import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications';
import { useThemeStore } from '@/store/theme';
import { useWorkspaceStore } from '@/store/workspace';

describe('Auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, isAuthenticated: false, error: null, isLoading: false });
  });

  it('has initial session null', () => {
    const { session } = useAuthStore.getState();
    expect(session).toBeNull();
  });

  it('has isAuthenticated false', () => {
    const { isAuthenticated } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
  });

  it('setSession sets session and isAuthenticated', () => {
    const fakeSession = { token: 'abc', refreshToken: 'rf_abc', expiresAt: Date.now() + 10000, user: { id: '1', name: 'Test', email: 'test@test.com' } };
    useAuthStore.getState().setSession(fakeSession);
    const state = useAuthStore.getState();
    expect(state.session).toEqual(fakeSession);
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout clears', () => {
    useAuthStore.setState({ session: { token: 'x', refreshToken: 'rf_x', expiresAt: 9999999999999, user: { id: '1', name: 'T', email: 't@t.com' } }, isAuthenticated: true });
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('clearError clears error', () => {
    useAuthStore.setState({ error: 'Something went wrong' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});

describe('Notifications store', () => {
  beforeEach(() => {
    useNotificationsStore.setState({ notifications: [], unreadCount: 0 });
  });

  it('addNotification increments unreadCount', () => {
    useNotificationsStore.getState().addNotification({ type: 'info', title: 'Hello' });
    expect(useNotificationsStore.getState().unreadCount).toBe(1);
  });

  it('markAsRead updates notification', () => {
    useNotificationsStore.getState().addNotification({ type: 'info', title: 'Test' });
    const notif = useNotificationsStore.getState().notifications[0];
    useNotificationsStore.getState().markAsRead(notif.id);
    expect(useNotificationsStore.getState().notifications[0].read).toBe(true);
  });

  it('markAllAsRead sets all read', () => {
    useNotificationsStore.getState().addNotification({ type: 'info', title: 'A' });
    useNotificationsStore.getState().addNotification({ type: 'warning', title: 'B' });
    useNotificationsStore.getState().markAllAsRead();
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
    expect(useNotificationsStore.getState().notifications.every((n) => n.read)).toBe(true);
  });

  it('clearAll resets', () => {
    useNotificationsStore.getState().addNotification({ type: 'info', title: 'X' });
    useNotificationsStore.getState().clearAll();
    expect(useNotificationsStore.getState().notifications).toEqual([]);
    expect(useNotificationsStore.getState().unreadCount).toBe(0);
  });
});

describe('Theme store', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'system', resolvedTheme: 'light' });
  });

  it('has default theme system', () => {
    expect(useThemeStore.getState().theme).toBe('system');
  });

  it('setTheme updates theme', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
  });
});

describe('Workspace store', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ sidebarOpen: true, activeView: 'dashboard', sidebarWidth: 280 });
  });

  it('has sidebarOpen true', () => {
    expect(useWorkspaceStore.getState().sidebarOpen).toBe(true);
  });

  it('toggleSidebar toggles', () => {
    useWorkspaceStore.getState().toggleSidebar();
    expect(useWorkspaceStore.getState().sidebarOpen).toBe(false);
    useWorkspaceStore.getState().toggleSidebar();
    expect(useWorkspaceStore.getState().sidebarOpen).toBe(true);
  });

  it('setActiveView updates view', () => {
    useWorkspaceStore.getState().setActiveView('settings');
    expect(useWorkspaceStore.getState().activeView).toBe('settings');
  });
});
