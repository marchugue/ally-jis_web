import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { apiClient, isApiConfigured } from '@/api/client';
import { getSocket } from '@/lib/socket';
import { useAuth } from './AuthContext';

interface PresenceContextValue {
  onlineUserIds: Set<string>;
  gameOnlineUserIds: Set<string>;
  gameOnlineCount: number;
  onlineCount: number;
  isOnline: (userId: string) => boolean;
  isGameOnline: (userId: string) => boolean;
  refreshOnlineUsers: () => Promise<void>;
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUserIds: new Set(),
  gameOnlineUserIds: new Set(),
  gameOnlineCount: 0,
  onlineCount: 0,
  isOnline: () => false,
  isGameOnline: () => false,
  refreshOnlineUsers: async () => {},
});

const HEARTBEAT_INTERVAL_MS = 25000;
const POLL_INTERVAL_MS = 30000;

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [gameOnlineUserIds, setGameOnlineUserIds] = useState<Set<string>>(new Set());
  const [gameOnlineCount, setGameOnlineCount] = useState<number>(0);

  const refreshOnlineUsers = useCallback(async () => {
    try {
      const data = await apiClient.getOnlineUsers();
      setOnlineUserIds(new Set(data.userIds || []));
      const gameIds = data.gameUserIds || [];
      setGameOnlineUserIds(new Set(gameIds));
      setGameOnlineCount(data.gameCount ?? gameIds.length ?? 0);
    } catch {
      // presence is best-effort
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    try {
      await apiClient.sendPresenceHeartbeat('web');
    } catch {
      // presence is best-effort
    }
  }, []);

  useEffect(() => {
    if (!user || !isApiConfigured) {
      setOnlineUserIds(new Set());
      setGameOnlineUserIds(new Set());
      setGameOnlineCount(0);
      return;
    }

    void sendHeartbeat();
    void refreshOnlineUsers();

    const heartbeatInterval = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const pollInterval = setInterval(() => {
      void refreshOnlineUsers();
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat();
        void refreshOnlineUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Real-Time Socket.io Presence Listeners ─────────────────────────────
    const socket = getSocket();

    const onUserOnline = (payload: { userId?: string; user_id?: string; platform?: string }) => {
      const id = payload?.userId || payload?.user_id;
      if (!id) return;
      setOnlineUserIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      if (payload.platform === 'game') {
        setGameOnlineUserIds((prev) => {
          if (prev.has(id)) return prev;
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        setGameOnlineCount((c) => c + 1);
      }
    };

    const onUserOffline = (payload: { userId?: string; user_id?: string }) => {
      const id = payload?.userId || payload?.user_id;
      if (!id) return;
      setOnlineUserIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setGameOnlineUserIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        setGameOnlineCount((c) => Math.max(0, c - 1));
        return next;
      });
    };

    const onPresenceChange = (payload: { userId?: string; user_id?: string; status?: string; platform?: string }) => {
      if (payload?.status === 'offline') {
        onUserOffline(payload);
      } else {
        onUserOnline(payload);
      }
    };

    if (socket) {
      socket.on('presence:online', onUserOnline);
      socket.on('presence:offline', onUserOffline);
      socket.on('presence:change', onPresenceChange);
    }

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (socket) {
        socket.off('presence:online', onUserOnline);
        socket.off('presence:offline', onUserOffline);
        socket.off('presence:change', onPresenceChange);
      }
    };
  }, [user?.id, sendHeartbeat, refreshOnlineUsers]);

  const value: PresenceContextValue = {
    onlineUserIds,
    gameOnlineUserIds,
    gameOnlineCount,
    onlineCount: onlineUserIds.size,
    isOnline: (id: string) => onlineUserIds.has(id),
    isGameOnline: (id: string) => gameOnlineUserIds.has(id),
    refreshOnlineUsers,
  };

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  return useContext(PresenceContext);
}
