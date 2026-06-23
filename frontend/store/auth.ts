import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, UserProfile, LoginRequest, RegisterRequest } from '@/types';
import api from '@/services/api';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setSession: (session: Session | null) => void;
  clearError: () => void;
  checkSession: () => boolean;
}

function createSession(token: string, user: unknown): Session {
  const profile = user as UserProfile;
  return {
    token,
    refreshToken: `rf_${token}`,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    user: profile,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login(credentials.email, credentials.password);
          const data = response as unknown as { token: string; user: UserProfile };
          const session = createSession(data.token, data.user);
          set({ session, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.register(data.name, data.email, data.password);
          const result = response as unknown as { token: string; user: UserProfile };
          const session = createSession(result.token, result.user);
          set({ session, isAuthenticated: true, isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ session: null, isAuthenticated: false, error: null });
      },

      setSession: (session: Session | null) => {
        set({ session, isAuthenticated: !!session });
      },

      clearError: () => set({ error: null }),

      checkSession: () => {
        const { session } = get();
        if (!session) return false;
        if (Date.now() > session.expiresAt) {
          set({ session: null, isAuthenticated: false });
          return false;
        }
        return true;
      },
    }),
    {
      name: 'auth-session',
      partialize: (state) => ({
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
