import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';

  setTheme: (theme: Theme) => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme: Theme) => set({ theme }),
      setResolvedTheme: (resolvedTheme: 'light' | 'dark') => set({ resolvedTheme }),
    }),
    {
      name: 'theme-preference',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
