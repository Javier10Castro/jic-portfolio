export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface StudioNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: number;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

type NotificationCallback = (notification: StudioNotification) => void;

class NotificationService {
  private listeners: Set<NotificationCallback> = new Set();
  private counter = 0;

  show(type: NotificationType, title: string, message?: string, action?: StudioNotification['action']): string {
    const id = `notif_${++this.counter}_${Date.now()}`;
    const notification: StudioNotification = {
      id,
      type,
      title,
      message,
      timestamp: Date.now(),
      action,
    };
    this.listeners.forEach((fn) => fn(notification));
    return id;
  }

  success(title: string, message?: string): string {
    return this.show('success', title, message);
  }

  error(title: string, message?: string): string {
    return this.show('error', title, message);
  }

  info(title: string, message?: string): string {
    return this.show('info', title, message);
  }

  warning(title: string, message?: string): string {
    return this.show('warning', title, message);
  }

  onNotification(callback: NotificationCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const studioNotifications = new NotificationService();
