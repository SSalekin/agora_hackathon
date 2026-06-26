export type NotificationType = 'question-answered' | 'question-skipped' | 'call-failed' | 'call-retry';

export interface Notification {
  id: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  message: string;
  listingId?: string;
  createdAt: string;
  read: boolean;
  data?: Record<string, unknown>;
}

// In-memory storage for demo (would be database in production)
const notifications: Map<string, Notification[]> = new Map();

export function createNotification(
  tenantId: string,
  type: NotificationType,
  title: string,
  message: string,
  listingId?: string,
  data?: Record<string, unknown>
): Notification {
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    type,
    title,
    message,
    listingId,
    createdAt: new Date().toISOString(),
    read: false,
    data,
  };

  const tenantNotifications = notifications.get(tenantId) || [];
  tenantNotifications.push(notification);
  notifications.set(tenantId, tenantNotifications);

  return notification;
}

export function getTenantNotifications(tenantId: string): Notification[] {
  return notifications.get(tenantId) || [];
}

export function markNotificationAsRead(notificationId: string, tenantId: string): boolean {
  const tenantNotifications = notifications.get(tenantId) || [];
  const notification = tenantNotifications.find(n => n.id === notificationId);

  if (notification) {
    notification.read = true;
    return true;
  }

  return false;
}

export function getUnreadNotificationCount(tenantId: string): number {
  const tenantNotifications = notifications.get(tenantId) || [];
  return tenantNotifications.filter(n => !n.read).length;
}
