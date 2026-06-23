'use client';

import { usePipelineStore } from '@/store/pipelineStore';
import { PIPELINE_STAGES } from '@/types/pipeline';
import PipelineStage from './PipelineStage';
import StageLog from './StageLog';

export default function BuildPipeline() {
  const pipeline = usePipelineStore((s) => s.pipeline);

  if (!pipeline) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No pipeline running</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pipeline</h2>
      </div>
      <div className="p-4">
        <div className="hidden lg:flex items-start gap-2 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stageDef, idx) => {
            const stage = pipeline.stages.find((s) => s.name === stageDef.name);
            if (!stage) return null;
            return (
              <div key={stage.name} className="flex items-center gap-2 shrink-0">
                <div className="w-48">
                  <PipelineStage stage={stage} isCurrent={pipeline.currentStage === stage.name} />
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="w-6 h-px bg-gray-300 dark:bg-gray-600 shrink-0 mt-4" />
                )}
              </div>
            );
          })}
        </div>
        <div className="lg:hidden space-y-2">
          {PIPELINE_STAGES.map((stageDef, idx) => {
            const stage = pipeline.stages.find((s) => s.name === stageDef.name);
            if (!stage) return null;
            return (
              <div key={stage.name} className="relative flex items-start">
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="absolute left-[19px] top-10 w-0.5 h-6 bg-gray-300 dark:bg-gray-600" />
                )}
                <div className="flex-1">
                  <PipelineStage stage={stage} isCurrent={pipeline.currentStage === stage.name} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <StageLog logs={pipeline.logs} />
      </div>
    </div>
  );
}
