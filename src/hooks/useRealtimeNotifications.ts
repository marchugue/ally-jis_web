import { useCallback, useEffect, useState } from 'react';
import { isApiConfigured } from '@/api/client';
import { Notification } from '../types/ally';
import { notificationService } from '../lib/services/notificationService';

const POLL_INTERVAL_MS = 10000;

const EXCLUDED_NOTIFICATION_TYPES: Notification['type'][] = ['message'];

export function useRealtimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true); // ← new

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
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !isApiConfigured) {
      setLoading(false);
      return;
    }

    void loadNotifications(true); // first load shows the skeleton
    const interval = setInterval(() => void loadNotifications(false), POLL_INTERVAL_MS); // background polls don't
    return () => clearInterval(interval);
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