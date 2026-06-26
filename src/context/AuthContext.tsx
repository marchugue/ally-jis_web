import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient, AuthSession, AuthUser, isApiConfigured } from "@/api/client";

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setMockUser: (user: AuthUser | null) => void;
  setSession: (session: AuthSession | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  setMockUser: () => {},
  setSession: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mockUser, setMockUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConfigured) {
      setLoading(false);
      return;
    }

    apiClient
      .getSession()
      .then((nextSession) => {
        setSession(nextSession);
      })
      .catch((err) => {
        console.error("Session error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: mockUser || session?.user || null,
      session,
      loading,
      setMockUser: (user: AuthUser | null) => setMockUserState(user),
      setSession,
      signOut: async () => {
        setMockUserState(null);
        setSession(null);
        if (!isApiConfigured) return;
        try {
          await apiClient.logout();
        } catch (error) {
          console.error("Sign out error:", error);
          apiClient.setAccessToken(null);
        }
      },
    }),
    [loading, session, mockUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export { isApiConfigured };
