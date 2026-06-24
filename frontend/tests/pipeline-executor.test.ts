import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pipelineExecutor } from '@/services/pipeline-executor';
import api from '@/services/api';

vi.mock('@/services/api', () => ({
  default: {
    runPipeline: vi.fn(),
    generate: vi.fn(),
  },
}));

vi.mock('@/services/events', () => ({
  eventService: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
}));

vi.mock('@/lib/sync/observability', () => ({
  observability: { track: vi.fn() },
}));

describe('PipelineExecutor', () => {
  beforeEach(() => {
    pipelineExecutor.reset();
    vi.clearAllMocks();
  });

  it('execute returns results for all stages on success', async () => {
    vi.mocked(api.runPipeline).mockResolvedValue({ data: { pipelineId: 'pipe-1' } });
    vi.mocked(api.generate).mockResolvedValue({ data: { status: 'ok' } });

    const results = await pipelineExecutor.execute('conv-1');

    expect(results).toHaveLength(9);
    expect(results.every((r) => r.status === 'completed')).toBe(true);
    expect(results.map((r) => r.name)).toEqual([
      'conversation', 'questions', 'context', 'planner',
      'design', 'content', 'generation', 'postprocessing', 'deployment',
    ]);
  });

  it('cancels execution mid-way', async () => {
    vi.mocked(api.runPipeline).mockResolvedValue({ data: { pipelineId: 'pipe-1' } });
    let callCount = 0;
    vi.mocked(api.generate).mockImplementation(async () => {
      callCount++;
      if (callCount === 3) pipelineExecutor.cancel();
      return { data: { status: 'ok' } };
    });

    const results = await pipelineExecutor.execute('conv-1');

    expect(results.length).toBeLessThan(9);
    expect(callCount).toBeLessThanOrEqual(3);
  });

  it('fails gracefully when pipeline ID is missing', async () => {
    vi.mocked(api.runPipeline).mockResolvedValue({ data: {} });
    const results = await pipelineExecutor.execute('conv-1');

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('failed');
    expect(results[0].error).toContain('No pipeline ID');
  });

  it('fails gracefully when runPipeline API throws', async () => {
    vi.mocked(api.runPipeline).mockRejectedValue(new Error('Network error'));
    const results = await pipelineExecutor.execute('conv-1');

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('failed');
    expect(results[0].error).toContain('Network error');
  });

  it('fails gracefully when generate throws on a stage', async () => {
    vi.mocked(api.runPipeline).mockResolvedValue({ data: { pipelineId: 'pipe-1' } });
    vi.mocked(api.generate)
      .mockResolvedValueOnce({ data: { status: 'ok' } })
      .mockRejectedValueOnce(new Error('Generation failed'));

    const results = await pipelineExecutor.execute('conv-1');

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('completed');
    expect(results[1].status).toBe('failed');
    expect(results[1].error).toContain('Generation failed');
  });

  it('calls onStage callback for each stage', async () => {
    vi.mocked(api.runPipeline).mockResolvedValue({ data: { pipelineId: 'pipe-1' } });
    vi.mocked(api.generate).mockResolvedValue({ data: { status: 'ok' } });
    const callback = vi.fn();
    pipelineExecutor.onStage(callback);

    await pipelineExecutor.execute('conv-1');

    expect(callback).toHaveBeenCalledTimes(18);
    expect(callback).toHaveBeenNthCalledWith(1, 'conversation', expect.objectContaining({ status: 'running' }));
    expect(callback).toHaveBeenNthCalledWith(2, 'conversation', expect.objectContaining({ status: 'completed' }));
  });

  it('includes provider/tokens/cost/latency when returned by API', async () => {
    vi.mocked(api.runPipeline).mockResolvedValue({ data: { pipelineId: 'pipe-1' } });
    vi.mocked(api.generate).mockResolvedValue({
      data: { provider: 'claude', tokens: 1500, cost: 0.045, latency: 3200 },
    });

    const results = await pipelineExecutor.execute('conv-1');

    expect(results[0].provider).toBe('claude');
    expect(results[0].tokens).toBe(1500);
    expect(results[0].cost).toBe(0.045);
    expect(results[0].latency).toBe(3200);
  });

  it('reset clears cancelled flag', async () => {
    pipelineExecutor.cancel();
    pipelineExecutor.reset();

    vi.mocked(api.runPipeline).mockResolvedValue({ data: { pipelineId: 'pipe-1' } });
    vi.mocked(api.generate).mockResolvedValue({ data: { status: 'ok' } });

    const results = await pipelineExecutor.execute('conv-1');
    expect(results).toHaveLength(9);
  });
});
