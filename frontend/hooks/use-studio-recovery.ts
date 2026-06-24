'use client';

import { useEffect, useRef } from 'react';
import { syncEngine } from '@/lib/sync/sync-engine';
import { registerSyncAdapters } from '@/lib/sync/store-sync';
import { eventService, getAuthToken } from '@/services';
import { offlineDetector } from '@/lib/sync/offline';
import { useConversationStore } from '@/store/conversationStore';
import { usePipelineStore } from '@/store/pipelineStore';
import { useDeploymentStore } from '@/store/deploymentStore';
import { usePreviewStore } from '@/store/previewStore';
import { useSummaryStore } from '@/store/summaryStore';

const RECOVERY_KEY = 'studio:recovery';

interface RecoverySnapshot {
  activeConversationId: string | null;
  pipelineActive: boolean;
  deploymentActive: boolean;
  previewActive: boolean;
  summaryActive: boolean;
  timestamp: number;
}

let adaptersRegistered = false;

export function useStudioRecovery() {
  const initialized = useRef(false);
  const setActiveConversation = useConversationStore((s) => s.setActiveConversation);
  const activeConvId = useConversationStore((s) => s.activeConversationId);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!adaptersRegistered) {
      registerSyncAdapters();
      adaptersRegistered = true;
    }

    const token = getAuthToken();
    if (!token) return;

    eventService.connect(token);

    const saved = loadRecoverySnapshot();
    if (saved) {
      syncEngine.hydrate();

      if (saved.pipelineActive || saved.deploymentActive || saved.previewActive) {
        syncEngine.sync().catch(() => {});
      }

      if (saved.activeConversationId && saved.activeConversationId !== saved.activeConversationId) {
        setActiveConversation(null);
        setActiveConversation(saved.activeConversationId);
      }

      saveRecoverySnapshot({
        ...saved,
        timestamp: Date.now(),
      });
    } else {
      saveInitialSnapshot();
    }

    const unsubOffline = offlineDetector.onChange((online) => {
      if (online) {
        eventService.reconnect();
        syncEngine.sync().catch(() => {});
      }
    });

    return () => {
      saveRecoverySnapshot({
        activeConversationId: activeConvId ?? null,
        pipelineActive: usePipelineStore.getState().pipeline !== null,
        deploymentActive: useDeploymentStore.getState().deployment.status !== 'idle',
        previewActive: usePreviewStore.getState().preview.status !== 'idle',
        summaryActive: useSummaryStore.getState().summary !== null,
        timestamp: Date.now(),
      });
      unsubOffline();
    };
  }, [setActiveConversation, activeConvId]);
}

function loadRecoverySnapshot(): RecoverySnapshot | null {
  try {
    const raw = sessionStorage.getItem(RECOVERY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RecoverySnapshot;
    if (Date.now() - parsed.timestamp > 3600000) {
      sessionStorage.removeItem(RECOVERY_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveRecoverySnapshot(snapshot: RecoverySnapshot): void {
  try {
    sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(snapshot));
  } catch { /* ignore */ }
}

function saveInitialSnapshot(): void {
  saveRecoverySnapshot({
    activeConversationId: null,
    pipelineActive: false,
    deploymentActive: false,
    previewActive: false,
    summaryActive: false,
    timestamp: Date.now(),
  });
}
