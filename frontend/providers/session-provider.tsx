'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';

interface SessionContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkSession: () => boolean;
}

const SessionContext = createContext<SessionContextValue>({
  isAuthenticated: false,
  isLoading: false,
  checkSession: () => false,
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <SessionContext.Provider value={{ isAuthenticated, isLoading, checkSession }}>
      {children}
    </SessionContext.Provider>
  );
}
