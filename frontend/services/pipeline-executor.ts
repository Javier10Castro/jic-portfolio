import api from './api';
import { eventService } from './events';
import { observability } from '@/lib/sync/observability';

export interface StageResult {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  output?: Record<string, unknown>;
  provider?: string;
  tokens?: number;
  cost?: number;
  latency?: number;
  logs?: string[];
}

export type StageCallback = (stage: string, result: StageResult) => void;

const STAGE_ORDER = [
  'conversation',
  'questions',
  'context',
  'planner',
  'design',
  'content',
  'generation',
  'postprocessing',
  'deployment',
] as const;

export type PipelineStageName = typeof STAGE_ORDER[number];

class PipelineExecutor {
  private onStageUpdate: StageCallback | null = null;
  private cancelled = false;

  onStage(callback: StageCallback): void {
    this.onStageUpdate = callback;
  }

  cancel(): void {
    this.cancelled = true;
  }

  reset(): void {
    this.cancelled = false;
  }

  async execute(conversationId: string): Promise<StageResult[]> {
    this.cancelled = false;
    const results: StageResult[] = [];

    try {
      const pipeRes = await api.runPipeline(conversationId);
      const pipeData = (pipeRes as unknown as Record<string, unknown>).data as Record<string, unknown> | undefined;
      const pipelineId = pipeData?.pipelineId as string || pipeData?.id as string;

      if (!pipelineId) {
        const failed: StageResult = {
          name: 'pipeline',
          status: 'failed',
          duration: 0,
          error: 'No pipeline ID returned',
        };
        this.onStageUpdate?.('pipeline', failed);
        results.push(failed);
        return results;
      }

      for (const stage of STAGE_ORDER) {
        if (this.cancelled) break;

        const start = performance.now();
        const running: StageResult = {
          name: stage,
          status: 'running',
          duration: 0,
        };
        this.onStageUpdate?.(stage, running);

        try {
          const res = await api.generate({ pipelineId, stage });
          const data = (res as unknown as Record<string, unknown>).data as Record<string, unknown> | undefined;
          const duration = performance.now() - start;
          const completed: StageResult = {
            name: stage,
            status: 'completed',
            duration,
            output: data,
            provider: data?.provider as string | undefined,
            tokens: data?.tokens as number | undefined,
            cost: data?.cost as number | undefined,
            latency: data?.latency as number | undefined,
          };
          observability.track(`stage.${stage}`, duration);
          this.onStageUpdate?.(stage, completed);
          results.push(completed);
        } catch (err) {
          const duration = performance.now() - start;
          const failed: StageResult = {
            name: stage,
            status: 'failed',
            duration,
            error: err instanceof Error ? err.message : String(err),
          };
          observability.track(`stage.${stage}.failed`, duration);
          this.onStageUpdate?.(stage, failed);
          results.push(failed);
          break;
        }
      }

      return results;
    } catch (err) {
      const failed: StageResult = {
        name: 'pipeline',
        status: 'failed',
        duration: 0,
        error: err instanceof Error ? err.message : 'Pipeline execution failed',
      };
      this.onStageUpdate?.('pipeline', failed);
      results.push(failed);
      return results;
    }
  }
}

export const pipelineExecutor = new PipelineExecutor();
