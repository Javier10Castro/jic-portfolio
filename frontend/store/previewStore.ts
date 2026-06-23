import { create } from 'zustand';
import { PreviewState, DeviceType } from '@/types/deployment';

interface PreviewStoreState {
  preview: PreviewState;

  setPreviewUrl: (url: string) => void;
  setPreviewHtml: (html: string) => void;
  setPreviewStatus: (status: PreviewState['status']) => void;
  setDevice: (device: DeviceType) => void;
  setError: (error: string) => void;
  resetPreview: () => void;
}

const defaultPreview: PreviewState = {
  url: null,
  html: null,
  status: 'idle',
  device: 'desktop',
};

export const usePreviewStore = create<PreviewStoreState>()((set) => ({
  preview: { ...defaultPreview },

  setPreviewUrl: (url) => set((state) => ({ preview: { ...state.preview, url, status: 'ready' } })),
  setPreviewHtml: (html) => set((state) => ({ preview: { ...state.preview, html, status: 'ready' } })),
  setPreviewStatus: (status) => set((state) => ({ preview: { ...state.preview, status } })),
  setDevice: (device) => set((state) => ({ preview: { ...state.preview, device } })),
  setError: (error) => set((state) => ({ preview: { ...state.preview, error, status: 'error' } })),
  resetPreview: () => set({ preview: { ...defaultPreview } }),
}));
