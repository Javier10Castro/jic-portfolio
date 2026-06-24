type OfflineCallback = (online: boolean) => void;

class OfflineDetector {
  private _online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<OfflineCallback> = new Set();
  private eventSourceAttached = false;

  get online(): boolean {
    return this._online;
  }

  private attach() {
    if (typeof window === 'undefined' || this.eventSourceAttached) return;
    this.eventSourceAttached = true;
    window.addEventListener('online', () => { this._online = true; this.notify(); });
    window.addEventListener('offline', () => { this._online = false; this.notify(); });
  }

  private notify() {
    this.listeners.forEach((fn) => { try { fn(this._online); } catch { /* ignore */ } });
  }

  onChange(fn: OfflineCallback): () => void {
    this.attach();
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  getStatus() {
    return { online: this._online, detected: typeof navigator !== 'undefined' ? !navigator.onLine : false };
  }
}

export const offlineDetector = new OfflineDetector();
