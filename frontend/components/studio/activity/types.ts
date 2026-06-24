export interface ActivityEvent {
  id: string;
  stage: string;
  agent: string;
  action: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  timestamp: number;
  duration?: number;
  detail?: string;
  provider?: string;
}
