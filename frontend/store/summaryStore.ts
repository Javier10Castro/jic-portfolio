import { create } from 'zustand';
import { ProjectSummary, DeploymentTarget } from '@/types/summary';

interface SummaryStoreState {
  summary: ProjectSummary | null;
  editing: boolean;

  setSummary: (summary: ProjectSummary) => void;
  updateSummary: (updates: Partial<ProjectSummary>) => void;
  setEditing: (editing: boolean) => void;
  clearSummary: () => void;
}

export const useSummaryStore = create<SummaryStoreState>()((set) => ({
  summary: null,
  editing: false,

  setSummary: (summary) => set({ summary }),
  updateSummary: (updates) =>
    set((state) => ({
      summary: state.summary ? { ...state.summary, ...updates } : null,
    })),
  setEditing: (editing) => set({ editing }),
  clearSummary: () => set({ summary: null, editing: false }),
}));
