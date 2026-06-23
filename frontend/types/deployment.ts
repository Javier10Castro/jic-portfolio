export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface PreviewState {
  url: string | null;
  html: string | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  device: DeviceType;
  error?: string;
}

export interface DeploymentState {
  status: 'idle' | 'building' | 'deploying' | 'deployed' | 'failed';
  url: string | null;
  logs: DeploymentLogEntry[];
  history: DeploymentRecord[];
  environment: 'development' | 'staging' | 'production';
}

export interface DeploymentLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface DeploymentRecord {
  id: string;
  projectId: string;
  url: string;
  version: string;
  deployedAt: string;
  status: 'success' | 'failed' | 'rolled-back';
  environment: 'development' | 'staging' | 'production';
}
