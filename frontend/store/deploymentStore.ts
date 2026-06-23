import { create } from 'zustand';
import { DeploymentState, DeploymentLogEntry, DeploymentRecord } from '@/types/deployment';

interface DeploymentStoreState {
  deployment: DeploymentState;

  setStatus: (status: DeploymentState['status']) => void;
  setUrl: (url: string) => void;
  addLog: (entry: Omit<DeploymentLogEntry, 'id' | 'timestamp'>) => void;
  addToHistory: (record: DeploymentRecord) => void;
  rollback: (version: string) => void;
  setEnvironment: (env: DeploymentState['environment']) => void;
  resetDeployment: () => void;
}

const defaultDeployment: DeploymentState = {
  status: 'idle',
  url: null,
  logs: [],
  history: [],
  environment: 'development',
};

let depLogCounter = 0;

export const useDeploymentStore = create<DeploymentStoreState>()((set) => ({
  deployment: { ...defaultDeployment },

  setStatus: (status) => set((state) => ({ deployment: { ...state.deployment, status } })),
  setUrl: (url) => set((state) => ({ deployment: { ...state.deployment, url, status: 'deployed' } })),

  addLog: (entry) =>
    set((state) => ({
      deployment: {
        ...state.deployment,
        logs: [
          ...state.deployment.logs,
          { ...entry, id: `deploy_log_${++depLogCounter}`, timestamp: new Date().toISOString() },
        ],
      },
    })),

  addToHistory: (record) =>
    set((state) => ({
      deployment: { ...state.deployment, history: [record, ...state.deployment.history] },
    })),

  rollback: (version) =>
    set((state) => ({
      deployment: { ...state.deployment, history: state.deployment.history.filter((r) => r.version !== version) },
    })),

  setEnvironment: (environment) => set((state) => ({ deployment: { ...state.deployment, environment } })),
  resetDeployment: () => set({ deployment: { ...defaultDeployment } }),
}));
