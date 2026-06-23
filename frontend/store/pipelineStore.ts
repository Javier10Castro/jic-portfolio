import { create } from 'zustand';
import { PipelineState, PipelineStageState, PipelineLog, PipelineStatus, PIPELINE_STAGES } from '@/types/pipeline';
import { StudioStage } from '@/types/studio';

interface PipelineStoreState {
  pipeline: PipelineState | null;

  startPipeline: (projectId: string) => void;
  advanceStage: (stage: StudioStage) => void;
  completeStage: (stage: StudioStage) => void;
  failStage: (stage: StudioStage, error: string) => void;
  setStageProgress: (stage: StudioStage, progress: number) => void;
  addLog: (log: Omit<PipelineLog, 'id' | 'timestamp'>) => void;
  retryStage: (stage: StudioStage) => void;
  setPipelineFromApi: (pipelineData: PipelineState) => void;
  resetPipeline: () => void;
  getCurrentStage: () => PipelineStageState | null;
}

function createStage(name: StudioStage): PipelineStageState {
  const stage = PIPELINE_STAGES.find((s) => s.name === name);
  return {
    name,
    label: stage?.label || name,
    status: 'pending',
    progress: 0,
    logs: [],
  };
}

let logCounter = 0;

export const usePipelineStore = create<PipelineStoreState>()((set, get) => ({
  pipeline: null,

  startPipeline: (projectId) => {
    const stages = PIPELINE_STAGES.map((s) => createStage(s.name));
    stages[0].status = 'running';
    const pipeline: PipelineState = {
      projectId,
      stages,
      currentStage: stages[0].name,
      status: 'running',
      startedAt: new Date().toISOString(),
      logs: [],
    };
    set({ pipeline });
  },

  advanceStage: (stage) =>
    set((state) => {
      if (!state.pipeline) return state;
      const stages = state.pipeline.stages.map((s) => {
        if (s.name === stage) return { ...s, status: 'running' as const, startedAt: new Date().toISOString() };
        return s;
      });
      return { pipeline: { ...state.pipeline, stages, currentStage: stage } };
    }),

  completeStage: (stage) =>
    set((state) => {
      if (!state.pipeline) return state;
      const stages = state.pipeline.stages.map((s) => {
        if (s.name === stage) {
          return { ...s, status: 'completed' as const, progress: 100, completedAt: new Date().toISOString() };
        }
        return s;
      });
      const stageIndex = PIPELINE_STAGES.findIndex((s) => s.name === stage);
      const nextStage = stageIndex < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[stageIndex + 1].name : null;
      const allCompleted = stages.every((s) => s.status === 'completed');
      return {
        pipeline: {
          ...state.pipeline,
          stages,
          currentStage: nextStage || stage,
          status: (allCompleted ? 'completed' : 'running') as PipelineStatus,
        },
      };
    }),

  failStage: (stage, error) =>
    set((state) => {
      if (!state.pipeline) return state;
      const stages = state.pipeline.stages.map((s) =>
        s.name === stage ? { ...s, status: 'failed' as const } : s
      );
      return { pipeline: { ...state.pipeline, stages, status: 'failed' as PipelineStatus } };
    }),

  setStageProgress: (stage, progress) =>
    set((state) => {
      if (!state.pipeline) return state;
      const stages = state.pipeline.stages.map((s) =>
        s.name === stage ? { ...s, progress } : s
      );
      return { pipeline: { ...state.pipeline, stages } };
    }),

  addLog: (log) =>
    set((state) => {
      if (!state.pipeline) return state;
      const entry: PipelineLog = {
        ...log,
        id: `log_${++logCounter}`,
        timestamp: new Date().toISOString(),
      };
      return {
        pipeline: {
          ...state.pipeline,
          logs: [...state.pipeline.logs, entry],
          stages: state.pipeline.stages.map((s) =>
            s.name === log.stage ? { ...s, logs: [...s.logs, entry] } : s
          ),
        },
      };
    }),

  retryStage: (stage) =>
    set((state) => {
      if (!state.pipeline) return state;
      const stages = state.pipeline.stages.map((s) =>
        s.name === stage ? { ...s, status: 'running' as const, progress: 0, logs: [] } : s
      );
      return { pipeline: { ...state.pipeline, stages, status: 'running' as PipelineStatus } };
    }),

  setPipelineFromApi: (pipelineData: PipelineState) => set({ pipeline: pipelineData }),

  resetPipeline: () => set({ pipeline: null }),

  getCurrentStage: () => {
    const { pipeline } = get();
    if (!pipeline) return null;
    return pipeline.stages.find((s) => s.name === pipeline.currentStage) || null;
  },
}));
