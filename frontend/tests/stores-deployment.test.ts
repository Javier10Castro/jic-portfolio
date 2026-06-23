import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeploymentStore } from '@/store/deploymentStore';
import type { DeploymentRecord } from '@/types/deployment';

describe('Deployment store', () => {
  beforeEach(() => {
    useDeploymentStore.setState({ deployment: { status: 'idle', url: null, logs: [], history: [], environment: 'development' } });
  });

  it('initial state is idle', () => {
    const { deployment } = useDeploymentStore.getState();
    expect(deployment.status).toBe('idle');
    expect(deployment.url).toBeNull();
    expect(deployment.logs).toEqual([]);
    expect(deployment.history).toEqual([]);
    expect(deployment.environment).toBe('development');
  });

  it('setStatus updates status', () => {
    useDeploymentStore.getState().setStatus('building');
    expect(useDeploymentStore.getState().deployment.status).toBe('building');
    useDeploymentStore.getState().setStatus('deploying');
    expect(useDeploymentStore.getState().deployment.status).toBe('deploying');
  });

  it('setUrl sets url and status deployed', () => {
    useDeploymentStore.getState().setUrl('https://myapp.vercel.app');
    const { deployment } = useDeploymentStore.getState();
    expect(deployment.url).toBe('https://myapp.vercel.app');
    expect(deployment.status).toBe('deployed');
  });

  it('addLog adds log entry', () => {
    useDeploymentStore.getState().addLog({ level: 'info', message: 'Build started' });
    useDeploymentStore.getState().addLog({ level: 'info', message: 'Build completed' });
    const { logs } = useDeploymentStore.getState().deployment;
    expect(logs).toHaveLength(2);
    expect(logs[0].message).toBe('Build started');
    expect(logs[0].level).toBe('info');
    expect(logs[0].id).toBeDefined();
    expect(logs[0].timestamp).toBeDefined();
  });

  it('addToHistory adds deployment record', () => {
    const record: DeploymentRecord = {
      id: 'dep-1',
      projectId: 'project-1',
      url: 'https://v1.myapp.vercel.app',
      version: 'v1.0.0',
      deployedAt: new Date().toISOString(),
      status: 'success',
      environment: 'development',
    };
    useDeploymentStore.getState().addToHistory(record);
    expect(useDeploymentStore.getState().deployment.history).toHaveLength(1);
    expect(useDeploymentStore.getState().deployment.history[0]).toEqual(record);
  });

  it('setEnvironment changes environment', () => {
    useDeploymentStore.getState().setEnvironment('staging');
    expect(useDeploymentStore.getState().deployment.environment).toBe('staging');
    useDeploymentStore.getState().setEnvironment('production');
    expect(useDeploymentStore.getState().deployment.environment).toBe('production');
  });

  it('resetDeployment returns to idle', () => {
    useDeploymentStore.getState().setUrl('https://example.com');
    useDeploymentStore.getState().addLog({ level: 'info', message: 'test' });
    useDeploymentStore.getState().setEnvironment('production');
    useDeploymentStore.getState().resetDeployment();
    const { deployment } = useDeploymentStore.getState();
    expect(deployment.status).toBe('idle');
    expect(deployment.url).toBeNull();
    expect(deployment.logs).toEqual([]);
    expect(deployment.history).toEqual([]);
    expect(deployment.environment).toBe('development');
  });
});
