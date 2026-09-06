import { useCallback, useEffect, useState } from 'react';
import { isApiConfigured } from '@/api/client';
import { Notification } from '../types/ally';
import { notificationService } from '../lib/services/notificationService';
import { getSocket } from '@/lib/socket';

const FALLBACK_POLL_INTERVAL_MS = 60000; // Relaxed 60s fallback only if socket misses
const EXCLUDED_NOTIFICATION_TYPES: Notification['type'][] = ['message'];

export function useRealtimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async (isInitial = false) => {
    if (!userId || !isApiConfigured) {
      setLoading(false);
      return;
    }

    if (isInitial) setLoading(true);
    try {
      const data = await notificationService.list(20);
      const filtered = data.filter(
        (n) => !EXCLUDED_NOTIFICATION_TYPES.includes(n.type),
      );
      setNotifications(filtered);
    } catch (err: any) {
      // 401 = token expired → AuthContext will sign the user out; swallow.
      if (err?.status === 401) return;
      if (err?.message?.includes('Network error') || err?.message?.includes('Failed to fetch')) return;
      console.error('[notifications] failed to load:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [userId]);

  // ── Initial load + Window focus revalidation + Slow safety net ───────────
  useEffect(() => {
    if (!userId || !isApiConfigured) {
      setLoading(false);
      return;
    }

    void loadNotifications(true);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadNotifications(false);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    // Passive low-frequency fallback (60s instead of 10s)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadNotifications(false);
      }
    }, FALLBACK_POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
      clearInterval(interval);
    };
  }, [userId, loadNotifications]);

  // ── Real-time Socket.IO delivery ──────────────────────────────────────────
  // Listens for backend `notification:new` events for instantaneous updates
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    const onNotificationNew = () => {
      void loadNotifications(false);
    };

    const onConnect = () => {
      void loadNotifications(false);
    };

    socket.on('notification:new', onNotificationNew);
    socket.on('notification', onNotificationNew);
    socket.on('connect', onConnect);

    return () => {
      socket.off('notification:new', onNotificationNew);
      socket.off('notification', onNotificationNew);
      socket.off('connect', onConnect);
    };
  }, [userId, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (notificationId: string) => {
    if (!isApiConfigured) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
    );
    await notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (!isApiConfigured) return;
    await notificationService.markAllAsRead();
  };

  const clearAll = async () => {
    setNotifications([]);
    if (!isApiConfigured) return;
    await notificationService.clearAll();
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, clearAll };
}