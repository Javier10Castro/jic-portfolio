type EventCallback = (event: ServerEvent) => void;

export interface ServerEvent {
  type: string;
  source?: string;
  severity?: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
  timestamp?: number;
  id?: string;
  sequence?: number;
}

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error'
  | 'healthy'
  | 'degraded';

export interface StatusSnapshot {
  status: ConnectionStatus;
  lastEventTime: number | null;
  reconnectCount: number;
  totalEvents: number;
  lastEventId: string | null;
}

class EventSubscriptionService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectHandler: (() => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private baseDelay = 1000;
  private maxDelay = 30000;
  private _status: ConnectionStatus = 'disconnected';
  private lastEventTime: number | null = null;
  private totalEvents = 0;
  private lastEventId: string | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private processedIds: Set<string> = new Set();
  private idOrder: string[] = [];
  private idCapacity = 1000;
  private lastSequenceBySource: Map<string, number> = new Map();
  private staleThresholdMs = 60000;
  private heartbeatIntervalMs = 45000;
  private connectionToken = '';
  private connectionFilters?: { type?: string; source?: string; severity?: string };

  get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(s: ConnectionStatus) {
    this._status = s;
    this.statusListeners.forEach((fn) => {
      try {
        fn(s);
      } catch {
        /* ignore listener errors */
      }
    });
  }

  onStatusChange(fn: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  setReconnectHandler(fn: () => void): void {
    this.reconnectHandler = fn;
  }

  getStatus(): StatusSnapshot {
    return {
      status: this._status,
      lastEventTime: this.lastEventTime,
      reconnectCount: this.reconnectAttempts,
      totalEvents: this.totalEvents,
      lastEventId: this.lastEventId,
    };
  }

  connect(
    token: string,
    filters?: { type?: string; source?: string; severity?: string }
  ): void {
    if (this.eventSource) {
      this.disconnect();
    }
    this.connectionToken = token;
    this.connectionFilters = filters;
    this.reconnectAttempts = 0;
    this.connectInternal();
  }

  private buildUrl(): string {
    const base = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    let url = `${base}/events/stream?token=${encodeURIComponent(this.connectionToken)}`;
    if (this.connectionFilters?.type) {
      url += `&type=${encodeURIComponent(this.connectionFilters.type)}`;
    }
    if (this.connectionFilters?.source) {
      url += `&source=${encodeURIComponent(this.connectionFilters.source)}`;
    }
    if (this.connectionFilters?.severity) {
      url += `&severity=${encodeURIComponent(this.connectionFilters.severity)}`;
    }
    if (this.lastEventId) {
      url += `&lastEventId=${encodeURIComponent(this.lastEventId)}`;
    }
    return url;
  }

  private connectInternal(): void {
    this.cleanupReconnectTimer();
    this.cleanupHeartbeat();
    try {
      this.eventSource = new EventSource(this.buildUrl());

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.lastEventTime = Date.now();
        this.setStatus('connected');
        this.startHeartbeat();
      };

      this.eventSource.addEventListener('event', (e: MessageEvent) => {
        try {
          const event: ServerEvent = JSON.parse(e.data as string);
          if (event.id) {
            this.lastEventId = event.id;
          }
          if (this.acceptEvent(event)) {
            this.lastEventTime = Date.now();
            this.totalEvents++;
            this.setStatus('healthy');
            this.dispatch(event.type, event);
            this.dispatch('*', event);
          }
        } catch {
          /* ignore parse errors */
        }
      });

      this.eventSource.onerror = () => {
        this.eventSource?.close();
        this.eventSource = null;
        this.cleanupHeartbeat();
        this.scheduleReconnect();
      };
    } catch {
      this.cleanupHeartbeat();
      this.setStatus('error');
    }
  }

  private acceptEvent(event: ServerEvent): boolean {
    if (event.id) {
      if (this.processedIds.has(event.id)) {
        return false;
      }
      this.trackId(event.id);
    }

    if (event.timestamp !== undefined) {
      if (Date.now() - event.timestamp > this.staleThresholdMs) {
        return false;
      }
    }

    if (event.sequence !== undefined && event.source) {
      const lastSeq = this.lastSequenceBySource.get(event.source);
      if (lastSeq !== undefined) {
        if (event.sequence < lastSeq) {
          return false;
        }
        if (event.sequence > lastSeq + 1) {
          console.warn(
            `[SSE] Missing events from ${event.source}: gap ${lastSeq + 1} to ${event.sequence - 1}`
          );
        }
      }
      this.lastSequenceBySource.set(event.source, event.sequence);
    }

    return true;
  }

  private trackId(id: string): void {
    if (this.processedIds.has(id)) return;
    this.processedIds.add(id);
    this.idOrder.push(id);
    if (this.idOrder.length > this.idCapacity) {
      const evicted = this.idOrder.shift()!;
      this.processedIds.delete(evicted);
    }
  }

  private startHeartbeat(): void {
    this.cleanupHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (
        this.lastEventTime &&
        Date.now() - this.lastEventTime > this.heartbeatIntervalMs
      ) {
        this.setStatus('degraded');
        this.eventSource?.close();
        this.eventSource = null;
        this.scheduleReconnect();
      }
    }, 5000);
  }

  private cleanupHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private cleanupReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      this.setStatus('error');
      return;
    }
    this.setStatus('reconnecting');
    if (this.reconnectHandler) {
      try {
        this.reconnectHandler();
      } catch {
        /* ignore handler errors */
      }
    }
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxDelay
    );
    this.reconnectTimer = setTimeout(() => this.connectInternal(), delay);
  }

  reconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.cleanupHeartbeat();
    this.cleanupReconnectTimer();
    this.reconnectAttempts = 0;
    this.setStatus('reconnecting');
    this.connectInternal();
  }

  disconnect(): void {
    this.cleanupHeartbeat();
    this.cleanupReconnectTimer();
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
        try {
          fn(event);
        } catch {
          /* ignore listener errors */
        }
      });
    }
  }
}

export const eventService = new EventSubscriptionService();
export default eventService;
