import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient, isApiConfigured } from '@/api/client';
import { useAuth } from './AuthContext';

interface PresenceContextValue {
  onlineUserIds: Set<string>;
  isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUserIds: new Set(),
  isOnline: () => false,
});

const HEARTBEAT_INTERVAL_MS = 30000;
const POLL_INTERVAL_MS = 30000;

export function PresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !isApiConfigured) {
      setOnlineUserIds(new Set());
      return;
    }

    const refreshOnlineUsers = async () => {
      try {
        const { userIds } = await apiClient.getOnlineUsers();
        setOnlineUserIds(new Set(userIds));
      } catch {
        // presence is best-effort
      }
    };

    const sendHeartbeat = async () => {
      try {
        await apiClient.sendPresenceHeartbeat();
      } catch {
        // presence is best-effort
      }
    };

    void sendHeartbeat();
    void refreshOnlineUsers();

    const heartbeatInterval = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const pollInterval = setInterval(() => {
      void refreshOnlineUsers();
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(pollInterval);
    };
  }, [user?.id]);

  const value = {
    onlineUserIds,
    isOnline: (id: string) => onlineUserIds.has(id),
  };

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  return useContext(PresenceContext);
}
