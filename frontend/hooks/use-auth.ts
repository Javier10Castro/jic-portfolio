'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  const requireAuth = useCallback(() => {
    if (!store.checkSession()) {
      router.push('/login');
      return false;
    }
    return true;
  }, [store, router]);

  const logout = useCallback(() => {
    store.logout();
    router.push('/login');
  }, [store, router]);

  return {
    ...store,
    requireAuth,
    logout,
  };
}
