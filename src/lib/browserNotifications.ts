// src/lib/browserNotifications.ts
//
// Web Browser Notifications API Support
// Respects user permission and displays browser notifications only for:
// - New messages
// - Connection requests
// - Ally matches
// - Safety alerts

export type AllowedBrowserCategory = 'messages' | 'connections' | 'ally' | 'safety';

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission {
  if (!isBrowserNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowserNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[BrowserNotifications] Failed to request permission:', err);
    return 'denied';
  }
}

export interface ShowBrowserNotificationOptions {
  title: string;
  body: string;
  category?: AllowedBrowserCategory | string;
  tag?: string;
  icon?: string;
  badge?: string;
  url?: string;
  onClick?: () => void;
}

export function showBrowserNotification(options: ShowBrowserNotificationOptions): Notification | null {
  if (!isBrowserNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  // Strict filter: Only show browser notifications for allowed high-priority categories
  const allowed = ['messages', 'connections', 'ally', 'safety'];
  if (options.category && !allowed.includes(options.category)) {
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      // tag groups and collapses notifications in browser/OS notification center
      tag: options.tag || (options.category ? `ally_${options.category}` : undefined),
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch {}

      if (options.onClick) {
        options.onClick();
      } else if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('[BrowserNotifications] Error displaying notification:', err);
    return null;
  }
}
