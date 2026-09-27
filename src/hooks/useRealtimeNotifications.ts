import { useCallback, useEffect, useState } from 'react';
import { isApiConfigured } from '@/api/client';
import { Notification } from '../types/ally';
import { notificationService, mapNotification } from '../lib/services/notificationService';
import { getSocket } from '@/lib/socket';
import { showBrowserNotification } from '../lib/browserNotifications';

const FALLBACK_POLL_INTERVAL_MS = 60000; // Relaxed 60s fallback

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
      const data = await notificationService.list(50);
      setNotifications(data);
    } catch (err: any) {
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

  // ── Real-time Socket.IO delivery & Read Synchronization ──────────────────
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewOrUpdatedNotification = (payload: any) => {
      if (!payload || typeof payload !== 'object') {
        void loadNotifications(false);
        return;
      }

      try {
        const item = mapNotification(payload);

        // Display native browser notification if app is in background
        if (
          document.visibilityState !== 'visible' &&
          item.category &&
          ['messages', 'connections', 'ally', 'safety'].includes(item.category)
        ) {
          showBrowserNotification({
            title: item.title,
            body: item.description,
            category: item.category,
            tag: item.groupKey || item.id,
            url: item.redirection?.webUrl,
          });
        }

        // Update state without duplicate entries (Facebook-Style collapse)
        setNotifications((prev) => {
          const groupKey = item.groupKey || item.targetId || item.id;
          const index = prev.findIndex(
            (n) => (n.groupKey && n.groupKey === groupKey) || n.id === item.id
          );

          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...item };
            return next.sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          } else {
            return [item, ...prev];
          }
        });
      } catch {
        void loadNotifications(false);
      }
    };

    const handleNotificationRead = (payload: any) => {
      if (!payload) return;
      const targetId = payload.targetId || payload.conversationId;
      const notificationId = payload.id;

      setNotifications((prev) =>
        prev.map((n) => {
          if (notificationId && n.id === notificationId) {
            return { ...n, isRead: true, unreadCount: 0 };
          }
          if (targetId && (n.targetId === targetId || n.groupKey?.includes(targetId))) {
            return { ...n, isRead: true, unreadCount: 0 };
          }
          if (payload.category && n.category === payload.category) {
            return { ...n, isRead: true, unreadCount: 0 };
          }
          return n;
        })
      );
    };

    const handleNotificationCleared = (payload: any) => {
      if (!payload) return;
      if (payload.all) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, unreadCount: 0 })));
        return;
      }
      handleNotificationRead(payload);
    };

    const handleNotificationReadAll = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, unreadCount: 0 })));
    };

    socket.on('notification:new', handleNewOrUpdatedNotification);
    socket.on('notification:updated', handleNewOrUpdatedNotification);
    socket.on('notification', handleNewOrUpdatedNotification);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notification:cleared', handleNotificationCleared);
    socket.on('notification:read_all', handleNotificationReadAll);
    socket.on('connect', () => void loadNotifications(false));

    return () => {
      socket.off('notification:new', handleNewOrUpdatedNotification);
      socket.off('notification:updated', handleNewOrUpdatedNotification);
      socket.off('notification', handleNewOrUpdatedNotification);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notification:cleared', handleNotificationCleared);
      socket.off('notification:read_all', handleNotificationReadAll);
      socket.off('connect');
    };
  }, [userId, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (notificationId: string) => {
    if (!isApiConfigured) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, unreadCount: 0 } : n)),
    );
    await notificationService.markAsRead(notificationId);
  };

  const markTargetAsRead = async (targetId: string) => {
    if (!isApiConfigured) return;
    setNotifications((prev) =>
      prev.map((n) =>
        n.targetId === targetId || n.groupKey?.includes(targetId)
          ? { ...n, isRead: true, unreadCount: 0 }
          : n
      )
    );
    await notificationService.markTargetAsRead(targetId);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, unreadCount: 0 })));
    if (!isApiConfigured) return;
    await notificationService.markAllAsRead();
  };

  const clearAll = async () => {
    setNotifications([]);
    if (!isApiConfigured) return;
    await notificationService.clearAll();
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markTargetAsRead,
    markAllAsRead,
    clearAll,
  };
}