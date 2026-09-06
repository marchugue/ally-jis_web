import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiClient, AuthSession, AuthUser, isApiConfigured } from "@/api/client";
import { AUTH_UNAUTHORIZED_EVENT } from "@/api/http";
import { disconnectSocket, initSocket } from "@/lib/socket";

import { clearRolePromptFlag } from "@/components/DashboardRoleGate";

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  verified: boolean;
  /** True when the user is a non-CHMSU student waiting for admin approval of their student ID. */
  isPendingApproval: boolean;
  /** True when the user is logged-in and verified but hasn't finished the onboarding form yet. */
  needsOnboarding: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setMockUser: (user: AuthUser | null) => void;
  /** Use this after login/confirm — sets both session AND verified atomically. */
  completeLogin: (session: AuthSession, verified: boolean) => void;
  /** Only use this to clear the session (e.g. on unverified restore). */
  setSession: (session: AuthSession | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  verified: false,
  isPendingApproval: false,
  needsOnboarding: false,
  signOut: async () => {},
  deleteAccount: async () => {},
  setMockUser: () => {},
  completeLogin: () => {},
  setSession: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [mockUser, setMockUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  // On mount: restore session from stored token and check email verification.
  useEffect(() => {
    if (!isApiConfigured) {
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        const nextSession = await apiClient.getSession();

        if (!nextSession?.user) {
          setSession(null);
          setVerified(false);
          return;
        }

        // Check email verification status
        const emailStatus = await apiClient.getEmailStatus(nextSession.user.id);

        // Set both atomically so ProtectedRoute never sees an inconsistent state
        setVerified(emailStatus.isEmailVerified);
        setSession(nextSession);
        // Eagerly connect socket so chat hooks can subscribe immediately.
        initSocket();

      } catch (err) {
        console.error('AuthContext: session load error', err);
        setSession(null);
        setVerified(false);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  // ── Global 401 handler ─────────────────────────────────────────────────────
  // Any API request that returns 401 fires AUTH_UNAUTHORIZED_EVENT.
  // We react here by clearing auth state so the ProtectedRoute redirects to /login.
  const handleUnauthorized = useCallback(() => {
    setSession(null);
    setVerified(false);
    setMockUserState(null);
    disconnectSocket();
    clearRolePromptFlag();
    // Clear any stale token (http.ts already does this, but belt-and-suspenders)
    try { apiClient.setAccessToken(null); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [handleUnauthorized]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: mockUser || session?.user || null,
      session,
      loading,
      verified,
      // isPendingApproval: external-email student whose identity hasn't been
      // approved by admin yet. Uses backend-computed is_approved flag —
      // single source of truth, not reconstructed from multiple fields.
      isPendingApproval: Boolean(
        session &&
        verified &&
        session.user?.user_metadata?.email_type === 'external' &&
        !session.user?.user_metadata?.is_approved
      ),
      // needsOnboarding: logged-in, verified, but profile not fully completed yet.
      // All students (CHMSU and external) must complete onboarding steps first.
      needsOnboarding: Boolean(
        session &&
        verified &&
        !session.user?.user_metadata?.onboarding_complete
      ),
      setMockUser: (user: AuthUser | null) => setMockUserState(user),
      setSession,
      // Atomic setter used by LoginPage and ConfirmPage — avoids the race
      // where session is set but verified is still false, causing ProtectedRoute
      // to redirect to /login while LoginPage redirects back → infinite loop.
      completeLogin: (newSession: AuthSession, isVerified: boolean) => {
        setSession(newSession);
        setVerified(isVerified);
        // Socket must be alive before MessagesPage mounts and tries to subscribe.
        initSocket();
      },

      signOut: async () => {
        setMockUserState(null);
        setSession(null);
        setVerified(false);
        disconnectSocket();
        clearRolePromptFlag();

        if (!isApiConfigured) return;

        try {
          await apiClient.logout();
        } catch (error) {
          console.error("Sign out error:", error);
          apiClient.setAccessToken(null);
        }
      },

      deleteAccount: async () => {
        setMockUserState(null);
        setSession(null);
        setVerified(false);
        disconnectSocket();
        clearRolePromptFlag();

        if (!isApiConfigured) return;

        try {
          await apiClient.deleteAccount();
        } catch (error) {
          console.error("Delete account error:", error);
          apiClient.setAccessToken(null);
        }
      },
    }),
    [loading, session, mockUser, verified]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export { isApiConfigured };
