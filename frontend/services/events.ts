type EventCallback = (event: ServerEvent) => void;

export interface ServerEvent {
  type: string;
  source?: string;
  severity?: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
  timestamp?: number;
  id?: string;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

class EventSubscriptionService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;
  private url: string = '';
  private _status: ConnectionStatus = 'disconnected';

  get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(s: ConnectionStatus) {
    this._status = s;
    this.statusListeners.forEach((fn) => fn(s));
  }

  onStatusChange(fn: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  connect(token: string, filters?: { type?: string; source?: string; severity?: string }): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.url = `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/events/stream?token=${encodeURIComponent(token)}`;
    if (filters?.type) this.url += `&type=${encodeURIComponent(filters.type)}`;
    if (filters?.source) this.url += `&source=${encodeURIComponent(filters.source)}`;
    if (filters?.severity) this.url += `&severity=${encodeURIComponent(filters.severity)}`;

    this.reconnectAttempts = 0;
    this.connectInternal();
  }

  private connectInternal(): void {
    try {
      this.eventSource = new EventSource(this.url);

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
      };

      this.eventSource.addEventListener('event', (e: MessageEvent) => {
        try {
          const event: ServerEvent = JSON.parse(e.data);
          this.dispatch(event.type, event);
          this.dispatch('*', event);
        } catch { /* ignore parse errors */ }
      });

      this.eventSource.onerror = () => {
        this.eventSource?.close();
        this.setStatus('reconnecting');
        this.reconnectAttempts++;
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
          const delay = Math.min(this.baseDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
          setTimeout(() => this.connectInternal(), delay);
        } else {
          this.setStatus('error');
        }
      };
    } catch {
      this.setStatus('error');
    }
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.setStatus('disconnected');
  }

  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    return () => this.listeners.get(eventType)?.delete(callback);
  }

  private dispatch(eventType: string, event: ServerEvent): void {
    const typeListeners = this.listeners.get(eventType);
    if (typeListeners) {
      typeListeners.forEach((fn) => {
        try { fn(event); } catch { /* ignore listener errors */ }
      });
    }
  }
}

export const eventService = new EventSubscriptionService();
export default eventService;
