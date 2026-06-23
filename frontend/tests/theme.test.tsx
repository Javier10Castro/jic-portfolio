import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/providers/theme-provider';
import { useThemeStore } from '@/store/theme';

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
  useTheme: () => ({ theme: 'light', setTheme: vi.fn(), resolvedTheme: 'light' }),
}));

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Child</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId('child')).toBeDefined();
  });
});

describe('ThemeStore', () => {
  it('has default theme system', () => {
    const { theme } = useThemeStore.getState();
    expect(theme).toBe('system');
  });

  it('setTheme updates theme', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('persists theme preference', () => {
    useThemeStore.getState().setTheme('dark');
    const state = JSON.parse(localStorage.getItem('theme-preference') || '{}');
    expect(state.state.theme).toBe('dark');
  });
});
