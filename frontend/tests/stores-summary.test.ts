import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSummaryStore } from '@/store/summaryStore';
import type { ProjectSummary } from '@/types/summary';

describe('Summary store', () => {
  beforeEach(() => {
    useSummaryStore.setState({ summary: null, editing: false });
  });

  it('initial state has null summary', () => {
    const { summary, editing } = useSummaryStore.getState();
    expect(summary).toBeNull();
    expect(editing).toBe(false);
  });

  it('setSummary stores summary', () => {
    const summary: ProjectSummary = {
      name: 'My Project',
      pages: [],
      features: [],
      colorPalette: ['#ff0000', '#00ff00'],
      typography: 'Inter',
      deploymentTarget: 'vercel',
      estimatedCost: 100,
      estimatedTokens: 5000,
      estimatedTime: 30,
    };
    useSummaryStore.getState().setSummary(summary);
    expect(useSummaryStore.getState().summary).toEqual(summary);
  });

  it('updateSummary merges updates', () => {
    useSummaryStore.getState().setSummary({
      name: 'Original',
      pages: [],
      features: [],
      colorPalette: [],
      typography: 'Inter',
      deploymentTarget: 'netlify',
      estimatedCost: 0,
      estimatedTokens: 0,
      estimatedTime: 0,
    });
    useSummaryStore.getState().updateSummary({ name: 'Updated', estimatedCost: 200 });
    const { summary } = useSummaryStore.getState();
    expect(summary?.name).toBe('Updated');
    expect(summary?.estimatedCost).toBe(200);
    expect(summary?.typography).toBe('Inter');
  });

  it('updateSummary does nothing when summary is null', () => {
    useSummaryStore.getState().updateSummary({ name: 'Nope' });
    expect(useSummaryStore.getState().summary).toBeNull();
  });

  it('setEditing toggles editing', () => {
    useSummaryStore.getState().setEditing(true);
    expect(useSummaryStore.getState().editing).toBe(true);
    useSummaryStore.getState().setEditing(false);
    expect(useSummaryStore.getState().editing).toBe(false);
  });

  it('clearSummary clears summary', () => {
    useSummaryStore.getState().setSummary({
      name: 'Test',
      pages: [],
      features: [],
      colorPalette: [],
      typography: 'Arial',
      deploymentTarget: 'vercel',
      estimatedCost: 0,
      estimatedTokens: 0,
      estimatedTime: 0,
    });
    useSummaryStore.getState().setEditing(true);
    useSummaryStore.getState().clearSummary();
    const { summary, editing } = useSummaryStore.getState();
    expect(summary).toBeNull();
    expect(editing).toBe(false);
  });
});
