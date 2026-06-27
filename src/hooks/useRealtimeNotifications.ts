import { useCallback, useEffect, useState } from 'react';
import { isApiConfigured } from '@/api/client';
import { Notification } from '../types/ally';
import { notificationService } from '../lib/services/notificationService';

const POLL_INTERVAL_MS = 10000;

// Exclude chat/message notifications from the notification bell
const EXCLUDED_NOTIFICATION_TYPES: Notification['type'][] = ['message'];

export function useRealtimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!userId || !isApiConfigured) return;

    const data = await notificationService.list(20);
    const filtered = data.filter(
      (n) => !EXCLUDED_NOTIFICATION_TYPES.includes(n.type)
    );

    setNotifications(filtered);
    setUnreadCount(filtered.filter((n) => !n.isRead).length);
  }, [userId]);

  useEffect(() => {
    if (!userId || !isApiConfigured) return;

    void loadNotifications();
    const interval = setInterval(() => {
      void loadNotifications();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [userId, loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!isApiConfigured) return;
    await notificationService.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return { notifications, unreadCount, markAsRead };
}