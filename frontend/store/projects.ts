import { create } from 'zustand';
import { Project, ProjectStatus, CreateProjectRequest } from '@/types';
import api from '@/services/api';

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  filter: ProjectStatus | 'all';
  search: string;

  fetchProjects: (params?: { status?: ProjectStatus; search?: string }) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<Project>;
  setFilter: (filter: ProjectStatus | 'all') => void;
  setSearch: (search: string) => void;
  clearSelection: () => void;
}

export const useProjectsStore = create<ProjectsState>()((set, get) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  total: 0,
  filter: 'all',
  search: '',

  fetchProjects: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getProjects({
        ...params,
        status: params?.status || (get().filter !== 'all' ? get().filter : undefined),
        search: params?.search || get().search || undefined,
      });
      const data = response as unknown as { projects: Project[]; total: number };
      set({
        projects: data.projects || [],
        total: data.total || 0,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch projects';
      set({ error: message, isLoading: false });
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getProject(id);
      const data = response as unknown as { project: Project };
      set({ selectedProject: data.project || null, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch project';
      set({ error: message, isLoading: false });
    }
  },

  createProject: async (data: CreateProjectRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.createProject(data);
      const result = response as unknown as { project: Project };
      set((state) => ({
        projects: [result.project, ...state.projects],
        total: state.total + 1,
        isLoading: false,
      }));
      return result.project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  clearSelection: () => set({ selectedProject: null }),
}));
