'use client';

import { useProjectsStore } from '@/store/projects';
import { useCallback, useEffect } from 'react';

export function useProjects() {
  const store = useProjectsStore();

  useEffect(() => {
    if (store.projects.length === 0 && !store.isLoading) {
      store.fetchProjects();
    }
  }, []);

  const refetch = useCallback(() => {
    store.fetchProjects();
  }, [store]);

  return {
    ...store,
    refetch,
  };
}
