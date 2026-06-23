import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePipelineStore } from '@/store/pipelineStore';
import { PIPELINE_STAGES } from '@/types/pipeline';

describe('Pipeline store', () => {
  beforeEach(() => {
    usePipelineStore.setState({ pipeline: null });
  });

  it('startPipeline initializes with all stages', () => {
    usePipelineStore.getState().startPipeline('project-1');
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline).not.toBeNull();
    expect(pipeline!.projectId).toBe('project-1');
    expect(pipeline!.stages).toHaveLength(PIPELINE_STAGES.length);
    expect(pipeline!.stages.map(s => s.name)).toEqual(PIPELINE_STAGES.map(s => s.name));
    expect(pipeline!.status).toBe('running');
    expect(pipeline!.logs).toEqual([]);
  });

  it('startPipeline sets first stage as running', () => {
    usePipelineStore.getState().startPipeline('project-1');
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline!.stages[0].status).toBe('running');
    expect(pipeline!.stages[0].progress).toBe(0);
    expect(pipeline!.currentStage).toBe(PIPELINE_STAGES[0].name);
  });

  it('advanceStage sets stage to running', () => {
    usePipelineStore.getState().startPipeline('project-1');
    usePipelineStore.getState().advanceStage('questions');
    const { pipeline } = usePipelineStore.getState();
    const stage = pipeline!.stages.find(s => s.name === 'questions');
    expect(stage?.status).toBe('running');
    expect(pipeline!.currentStage).toBe('questions');
  });

  it('completeStage marks stage completed and advances to next', () => {
    usePipelineStore.getState().startPipeline('project-1');
    usePipelineStore.getState().completeStage('conversation');
    const { pipeline } = usePipelineStore.getState();
    const convStage = pipeline!.stages.find(s => s.name === 'conversation');
    expect(convStage?.status).toBe('completed');
    expect(convStage?.progress).toBe(100);
    expect(pipeline!.currentStage).toBe('questions');
    expect(pipeline!.status).toBe('running');
  });

  it('completeStage on last stage sets pipeline completed', () => {
    usePipelineStore.getState().startPipeline('project-1');
    PIPELINE_STAGES.forEach((stage) => {
      usePipelineStore.getState().completeStage(stage.name);
    });
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline!.status).toBe('completed');
    expect(pipeline!.stages.every(s => s.status === 'completed')).toBe(true);
  });

  it('failStage marks stage as failed and pipeline as failed', () => {
    usePipelineStore.getState().startPipeline('project-1');
    usePipelineStore.getState().failStage('conversation', 'Something went wrong');
    const { pipeline } = usePipelineStore.getState();
    const stage = pipeline!.stages.find(s => s.name === 'conversation');
    expect(stage?.status).toBe('failed');
    expect(pipeline!.status).toBe('failed');
  });

  it('setStageProgress updates stage progress', () => {
    usePipelineStore.getState().startPipeline('project-1');
    usePipelineStore.getState().setStageProgress('conversation', 75);
    const stage = usePipelineStore.getState().pipeline!.stages.find(s => s.name === 'conversation');
    expect(stage?.progress).toBe(75);
  });

  it('addLog adds log entry to pipeline and stage', () => {
    usePipelineStore.getState().startPipeline('project-1');
    usePipelineStore.getState().addLog({ level: 'info', message: 'Pipeline started', stage: 'conversation' });
    const { pipeline } = usePipelineStore.getState();
    expect(pipeline!.logs).toHaveLength(1);
    expect(pipeline!.logs[0].message).toBe('Pipeline started');
    expect(pipeline!.logs[0].level).toBe('info');
    const stage = pipeline!.stages.find(s => s.name === 'conversation');
    expect(stage?.logs).toHaveLength(1);
    expect(stage?.logs[0].message).toBe('Pipeline started');
  });

  it('retryStage resets stage to running', () => {
    usePipelineStore.getState().startPipeline('project-1');
    usePipelineStore.getState().failStage('conversation', 'Error');
    usePipelineStore.getState().retryStage('conversation');
    const { pipeline } = usePipelineStore.getState();
    const stage = pipeline!.stages.find(s => s.name === 'conversation');
    expect(stage?.status).toBe('running');
    expect(stage?.progress).toBe(0);
    expect(stage?.logs).toEqual([]);
    expect(pipeline!.status).toBe('running');
  });

  it('resetPipeline clears pipeline', () => {
    usePipelineStore.getState().startPipeline('project-1');
    usePipelineStore.getState().resetPipeline();
    expect(usePipelineStore.getState().pipeline).toBeNull();
  });

  it('getCurrentStage returns current stage', () => {
    usePipelineStore.getState().startPipeline('project-1');
    const current = usePipelineStore.getState().getCurrentStage();
    expect(current).not.toBeNull();
    expect(current!.name).toBe(PIPELINE_STAGES[0].name);
  });

  it('getCurrentStage returns null when no pipeline', () => {
    expect(usePipelineStore.getState().getCurrentStage()).toBeNull();
  });
});
