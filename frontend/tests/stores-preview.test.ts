import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePreviewStore } from '@/store/previewStore';

describe('Preview store', () => {
  beforeEach(() => {
    usePreviewStore.setState({ preview: { url: null, html: null, status: 'idle', device: 'desktop' } });
  });

  it('initial state is idle', () => {
    const { preview } = usePreviewStore.getState();
    expect(preview.status).toBe('idle');
    expect(preview.url).toBeNull();
    expect(preview.html).toBeNull();
    expect(preview.device).toBe('desktop');
  });

  it('setPreviewUrl sets url and status ready', () => {
    usePreviewStore.getState().setPreviewUrl('https://example.com/preview');
    const { preview } = usePreviewStore.getState();
    expect(preview.url).toBe('https://example.com/preview');
    expect(preview.status).toBe('ready');
  });

  it('setPreviewHtml sets html and status ready', () => {
    usePreviewStore.getState().setPreviewHtml('<h1>Hello</h1>');
    const { preview } = usePreviewStore.getState();
    expect(preview.html).toBe('<h1>Hello</h1>');
    expect(preview.status).toBe('ready');
  });

  it('setPreviewStatus updates status', () => {
    usePreviewStore.getState().setPreviewStatus('loading');
    expect(usePreviewStore.getState().preview.status).toBe('loading');
    usePreviewStore.getState().setPreviewStatus('ready');
    expect(usePreviewStore.getState().preview.status).toBe('ready');
  });

  it('setDevice changes device type', () => {
    usePreviewStore.getState().setDevice('tablet');
    expect(usePreviewStore.getState().preview.device).toBe('tablet');
    usePreviewStore.getState().setDevice('mobile');
    expect(usePreviewStore.getState().preview.device).toBe('mobile');
  });

  it('setError sets error and status error', () => {
    usePreviewStore.getState().setError('Failed to load preview');
    const { preview } = usePreviewStore.getState();
    expect(preview.error).toBe('Failed to load preview');
    expect(preview.status).toBe('error');
  });

  it('resetPreview returns to idle', () => {
    usePreviewStore.getState().setPreviewUrl('https://example.com');
    usePreviewStore.getState().setDevice('mobile');
    usePreviewStore.getState().resetPreview();
    const { preview } = usePreviewStore.getState();
    expect(preview.status).toBe('idle');
    expect(preview.url).toBeNull();
    expect(preview.html).toBeNull();
    expect(preview.device).toBe('desktop');
    expect(preview.error).toBeUndefined();
  });
});
