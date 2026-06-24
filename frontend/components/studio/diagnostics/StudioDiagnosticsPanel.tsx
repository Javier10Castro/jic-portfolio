'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncEngine } from '@/lib/sync/sync-engine';
import { eventService } from '@/services/events';
import { observability } from '@/lib/sync/observability';
import { offlineDetector } from '@/lib/sync/offline';
import { useConversationStore } from '@/store/conversationStore';
import { usePipelineStore } from '@/store/pipelineStore';
import { useDeploymentStore } from '@/store/deploymentStore';
import { useSummaryStore } from '@/store/summaryStore';

export default function StudioDiagnosticsPanel() {
  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<'stores' | 'sse' | 'perf' | 'sync'>('stores');
  const [_, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate((n) => n + 1), []);

  useEffect(() => {
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-gray-700"
      >
        DX
      </button>
    );
  }

  const sseStatus = eventService.getStatus();
  const syncStatus = syncEngine.getAllStatus();
  const perfSummary = observability.getSummary();
  const offline = offlineDetector.getStatus();
  const conversationCount = useConversationStore((s) => s.conversations.length);
  const pipelineActive = usePipelineStore((s) => s.pipeline !== null);
  const deploymentStatus = useDeploymentStore((s) => s.deployment.status);
  const summaryExists = useSummaryStore((s) => s.summary !== null);

  return (
    <div className="fixed bottom-0 right-0 z-50 w-96 max-h-[70vh] bg-gray-900 border border-gray-700 rounded-tl-xl shadow-2xl overflow-hidden flex flex-col text-xs font-mono">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-gray-200 font-semibold tracking-wide">Studio DX</span>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-400 hover:text-white text-sm leading-none"
        >
          ✕
        </button>
      </div>

      <div className="flex border-b border-gray-700">
        {(['stores', 'sse', 'perf', 'sync'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-center text-[10px] uppercase tracking-wider font-medium ${
              tab === t ? 'bg-gray-700 text-blue-300' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tab === 'stores' && (
          <>
            <div className="space-y-1">
              <Line label="Conversations" value={String(conversationCount)} />
              <Line label="Pipeline" value={pipelineActive ? 'active' : 'idle'} color={pipelineActive ? 'green' : 'gray'} />
              <Line label="Deployment" value={deploymentStatus} color={deploymentStatus === 'deployed' ? 'green' : deploymentStatus === 'failed' ? 'red' : 'gray'} />
              <Line label="Summary" value={summaryExists ? 'present' : 'none'} color={summaryExists ? 'green' : 'gray'} />
            </div>
            {Object.entries(syncStatus).map(([name, s]) => (
              <div key={name} className="border-t border-gray-700 pt-1">
                <div className="text-gray-300 font-medium capitalize mb-0.5">{name}</div>
                <Line label="Synced" value={String(s.synced)} color={s.synced ? 'green' : 'red'} />
                <Line label="Dirty" value={String(s.dirty)} color={s.dirty ? 'yellow' : 'green'} />
                <Line label="Reconciling" value={String(s.reconciling)} />
                {s.lastSync && <Line label="Last Sync" value={new Date(s.lastSync).toLocaleTimeString()} />}
                {s.validationErrors.length > 0 && (
                  <div className="text-red-400 mt-0.5">
                    {s.validationErrors.map((err, i) => (
                      <div key={i}>⚠ {err}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'sse' && (
          <div className="space-y-1">
            <Line label="Status" value={sseStatus.status} color={sseStatus.status === 'connected' || sseStatus.status === 'healthy' ? 'green' : sseStatus.status === 'reconnecting' ? 'yellow' : 'red'} />
            <Line label="Events Received" value={String(sseStatus.totalEvents)} />
            <Line label="Reconnects" value={String(sseStatus.reconnectCount)} />
            <Line label="Last Event" value={sseStatus.lastEventTime ? new Date(sseStatus.lastEventTime).toLocaleTimeString() : 'never'} />
            <Line label="Last Event ID" value={sseStatus.lastEventId || 'none'} />
            <Line label="Online" value={String(offline.online)} color={offline.online ? 'green' : 'red'} />
          </div>
        )}

        {tab === 'perf' && (
          <div className="space-y-1">
            {Object.keys(perfSummary).length === 0 && (
              <div className="text-gray-500 text-center py-4">No performance data yet</div>
            )}
            {Object.entries(perfSummary).map(([event, stats]) => (
              <div key={event} className="flex justify-between items-center border-b border-gray-700 pb-0.5">
                <span className="text-gray-300">{event}</span>
                <span className="text-gray-400">{stats.count}x · {stats.avgMs}ms avg</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'sync' && (
          <div className="space-y-1">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { syncEngine.sync().catch(() => {}); }}
                className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-[10px]"
              >
                Sync All
              </button>
              <button
                onClick={() => { eventService.reconnect(); }}
                className="px-2 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-[10px]"
              >
                Reconnect SSE
              </button>
              <button
                onClick={() => { syncEngine.persist(); }}
                className="px-2 py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded text-[10px]"
              >
                Persist
              </button>
              <button
                onClick={() => { syncEngine.hydrate(); refresh(); }}
                className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-[10px]"
              >
                Hydrate
              </button>
            </div>
            <div className="text-gray-400 text-[10px] mt-2">
              Auto-sync: 30s · Cache: sessionStorage · Max SSE retries: 20
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: 'green' | 'red' | 'yellow' | 'gray';
}) {
  const colorMap: Record<string, string> = {
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    gray: 'text-gray-400',
  };
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={color ? colorMap[color] : 'text-gray-300'}>{value}</span>
    </div>
  );
}
