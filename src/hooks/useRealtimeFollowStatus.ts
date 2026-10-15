// src/hooks/useRealtimeFollowStatus.ts
//
// Realtime hook that tracks follow relationships for notifications:
// 1. Fetches backend follow status for all follower notifications
// 2. Subscribes to Socket.io events ('follow:updated', 'notification:new')
// 3. Handles follow-back verification directly on the backend
// 4. Manages reset to descriptive state upon clicking 'Close'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { followService } from '@/lib/services/followService';
import { getSocket } from '@/lib/socket';
import { toast } from 'sonner';
import type { Notification } from '@/types/ally';

interface UseRealtimeFollowStatusOptions {
  userId?: string | null;
  notifications: Notification[];
  onRemoveNotification?: (notificationId: string) => void;
}

export function useRealtimeFollowStatus({ userId, notifications, onRemoveNotification }: UseRealtimeFollowStatusOptions) {
  // Map of targetUserId -> boolean (true if current user follows targetUserId)
  const [followStatusMap, setFollowStatusMap] = useState<Record<string, boolean>>({});

  // Map of notificationId -> boolean (true if user clicked 'Close' on follower CTA buttons)
  const [dismissedCtaMap, setDismissedCtaMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(`ally_dismissed_follower_ctas_${userId || 'guest'}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Map of targetUserId -> boolean for network in-flight operations
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});

  // Prevent duplicate checks for the same targetUserId within a short window
  const inFlightChecksRef = useRef<Set<string>>(new Set());

  // Extract all unique target user IDs from 'new_follower' notifications
  const followerUserIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of notifications) {
      if (n.type === 'new_follower') {
        const uId = n.fromUserId || n.targetId;
        if (uId && uId !== userId) {
          ids.add(uId);
        }
      }
    }
    return Array.from(ids);
  }, [notifications, userId]);

  // Query backend for follow status of a given user ID
  const checkFollowStatus = useCallback(
    async (targetUserId: string): Promise<boolean> => {
      if (!targetUserId || !userId || targetUserId === userId) return false;
      if (inFlightChecksRef.current.has(targetUserId)) return false;

      inFlightChecksRef.current.add(targetUserId);
      try {
        const res = await followService.getStatus(targetUserId);
        const isFollowing = Boolean(res?.isFollowing);
        setFollowStatusMap((prev) => {
          if (prev[targetUserId] === isFollowing) return prev;
          return { ...prev, [targetUserId]: isFollowing };
        });
        return isFollowing;
      } catch (err) {
        console.warn(`[useRealtimeFollowStatus] Could not check status for ${targetUserId}:`, err);
        return false;
      } finally {
        inFlightChecksRef.current.delete(targetUserId);
      }
    },
    [userId]
  );

  // Initial and reactive check for all follower user IDs on notifications change
  useEffect(() => {
    if (!userId || followerUserIds.length === 0) return;

    let isMounted = true;

    // Check all followers in parallel
    const verifyAll = async () => {
      const unverified = followerUserIds.filter(
        (id) => followStatusMap[id] === undefined && !inFlightChecksRef.current.has(id)
      );
      if (unverified.length === 0) return;

      const settled = await Promise.allSettled(
        unverified.map(async (tId) => {
          inFlightChecksRef.current.add(tId);
          try {
            const res = await followService.getStatus(tId);
            return { targetUserId: tId, isFollowing: Boolean(res?.isFollowing) };
          } finally {
            inFlightChecksRef.current.delete(tId);
          }
        })
      );

      if (!isMounted) return;

      const newStatuses: Record<string, boolean> = {};
      for (const res of settled) {
        if (res.status === 'fulfilled' && res.value) {
          newStatuses[res.value.targetUserId] = res.value.isFollowing;
          if (res.value.isFollowing && onRemoveNotification) {
            for (const n of notifications) {
              if (n.type === 'new_follower' && (n.fromUserId === res.value.targetUserId || n.targetId === res.value.targetUserId)) {
                onRemoveNotification(n.id);
              }
            }
          }
        }
      }

      if (Object.keys(newStatuses).length > 0) {
        setFollowStatusMap((prev) => ({ ...prev, ...newStatuses }));
      }
    };

    void verifyAll();

    return () => {
      isMounted = false;
    };
  }, [userId, followerUserIds, followStatusMap, notifications, onRemoveNotification]);

  // Real-time socket event subscription
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    // Handle real-time follow:updated events
    const handleFollowUpdated = (payload: any) => {
      if (!payload || typeof payload !== 'object') return;
      const { followerId, targetUserId, isFollowing } = payload;

      // If the current user followed or unfollowed targetUserId
      if (followerId === userId && targetUserId) {
        setFollowStatusMap((prev) => ({
          ...prev,
          [targetUserId]: Boolean(isFollowing),
        }));
        if (isFollowing && onRemoveNotification) {
          for (const n of notifications) {
            if (n.type === 'new_follower' && (n.fromUserId === targetUserId || n.targetId === targetUserId)) {
              onRemoveNotification(n.id);
            }
          }
        }
      }

      // If another user followed or unfollowed the current user
      if (targetUserId === userId && followerId) {
        void checkFollowStatus(followerId);
      }
    };

    // When a new follower notification arrives live
    const handleNewNotification = (payload: any) => {
      if (!payload) return;
      if (payload.type === 'new_follower') {
        const fromId = payload.from_user_id || payload.target_id || payload.fromUserId;
        if (fromId && fromId !== userId) {
          void checkFollowStatus(fromId);
        }
      }
    };

    socket.on('follow:updated', handleFollowUpdated);
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:updated', handleNewNotification);
    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('follow:updated', handleFollowUpdated);
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:updated', handleNewNotification);
      socket.off('notification', handleNewNotification);
    };
  }, [userId, checkFollowStatus, notifications, onRemoveNotification]);

  // Execute follow back and verify on backend
  const handleFollowBack = useCallback(
    async (targetUserId: string, notificationId?: string) => {
      if (!userId || !targetUserId || busyMap[targetUserId]) return;

      setBusyMap((prev) => ({ ...prev, [targetUserId]: true }));
      try {
        // 1. Send follow request to backend
        await followService.follow(targetUserId);

        // 2. Always verify on backend that user is now followed back
        const statusRes = await followService.getStatus(targetUserId);
        const verifiedFollowing = Boolean(statusRes?.isFollowing);

        setFollowStatusMap((prev) => ({
          ...prev,
          [targetUserId]: verifiedFollowing,
        }));

        if (verifiedFollowing) {
          toast.success('Followed back!');
          if (notificationId && onRemoveNotification) {
            onRemoveNotification(notificationId);
          }
          if (onRemoveNotification) {
            for (const n of notifications) {
              if (n.type === 'new_follower' && (n.fromUserId === targetUserId || n.targetId === targetUserId)) {
                onRemoveNotification(n.id);
              }
            }
          }
        } else {
          toast.success('Follow request sent');
        }
      } catch (err: any) {
        console.error('[useRealtimeFollowStatus] Failed to follow back:', err);
        toast.error(err?.message || 'Failed to follow back. Please try again.');
        // Re-check backend status to stay accurate
        void checkFollowStatus(targetUserId);
      } finally {
        setBusyMap((prev) => ({ ...prev, [targetUserId]: false }));
      }
    },
    [userId, busyMap, checkFollowStatus, notifications, onRemoveNotification]
  );

  // Close CTA buttons: resets notification to descriptive state
  const handleCloseFollowCta = useCallback(
    (notificationId: string) => {
      if (!notificationId) return;
      setDismissedCtaMap((prev) => {
        const next = { ...prev, [notificationId]: true };
        try {
          localStorage.setItem(
            `ally_dismissed_follower_ctas_${userId || 'guest'}`,
            JSON.stringify(next)
          );
        } catch {}
        return next;
      });
    },
    [userId]
  );

  return {
    followStatusMap,
    dismissedCtaMap,
    busyMap,
    handleFollowBack,
    handleCloseFollowCta,
    checkFollowStatus,
  };
}
