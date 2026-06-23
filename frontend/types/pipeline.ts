import { StudioStage } from './studio';

export interface PipelineState {
  projectId: string;
  stages: PipelineStageState[];
  currentStage: StudioStage;
  status: PipelineStatus;
  startedAt: string;
  logs: PipelineLog[];
}

export type PipelineStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface PipelineStageState {
  name: StudioStage;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  progress: number;
  logs: PipelineLog[];
}

export interface PipelineLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  stage?: string;
}

export const PIPELINE_STAGES: { name: StudioStage; label: string }[] = [
  { name: 'conversation', label: 'Conversation' },
  { name: 'questions', label: 'Questions' },
  { name: 'context', label: 'Context' },
  { name: 'architecture', label: 'Architecture' },
  { name: 'knowledge', label: 'Knowledge' },
  { name: 'composer', label: 'Composer' },
  { name: 'generator', label: 'Generator' },
  { name: 'evaluation', label: 'Evaluation' },
  { name: 'deployment', label: 'Deployment' },
  { name: 'workspace', label: 'Workspace' },
];
