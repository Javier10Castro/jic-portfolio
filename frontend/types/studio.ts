export interface StudioProject {
  id: string;
  name: string;
  prompt: string;
  status: StudioBuildStatus;
  stage: StudioStage;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export type StudioBuildStatus = 'idle' | 'running' | 'completed' | 'failed';

export type StudioStage =
  | 'conversation'
  | 'questions'
  | 'context'
  | 'architecture'
  | 'knowledge'
  | 'composer'
  | 'generator'
  | 'evaluation'
  | 'deployment'
  | 'workspace';

export interface BuildStatus {
  projectId: string;
  buildId: string;
  stage: StudioStage;
  status: StudioBuildStatus;
  progress: number;
  data?: Record<string, unknown>;
}

export interface StartStudioBuildRequest {
  prompt: string;
  projectId?: string;
}

export interface AdvanceStageRequest {
  projectId: string;
  stage: StudioStage;
  data?: Record<string, unknown>;
}

export interface CompleteStageRequest {
  projectId: string;
  stage: StudioStage;
  data?: Record<string, unknown>;
}
