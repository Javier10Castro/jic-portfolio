import { create } from 'zustand';

interface WorkspaceState {
  sidebarOpen: boolean;
  activeView: string;
  sidebarWidth: number;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: string) => void;
  setSidebarWidth: (width: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  sidebarOpen: true,
  activeView: 'dashboard',
  sidebarWidth: 280,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setActiveView: (view: string) => set({ activeView: view }),
  setSidebarWidth: (width: number) => set({ sidebarWidth: width }),
}));
