export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export type WorkflowStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  order: number;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  url?: string;
  environment: 'development' | 'staging' | 'production';
  createdAt: string;
}

export type DeploymentStatus = 'pending' | 'building' | 'deployed' | 'failed';

export interface Agent {
  id: string;
  name: string;
  description?: string;
  status: AgentStatus;
  capabilities: string[];
  createdAt: string;
}

export type AgentStatus = 'active' | 'idle' | 'error';

export interface Plugin {
  id: string;
  name: string;
  description?: string;
  version: string;
  enabled: boolean;
  author?: string;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  config?: Record<string, unknown>;
}
