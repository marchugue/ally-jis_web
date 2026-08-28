import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Guards:
 *  1. Must have a valid session (session !== null).
 *  2. Must have a verified email (verified === true).
 *
 * While the auth state is loading we show a spinner.
 * Un-authenticated users are redirected to /login.
 * Authenticated but un-verified users are redirected to /login
 * with an "unverified" flag so LoginPage can display a message.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, verified } = useAuth();
  const location = useLocation();

  // ── Still loading session — show spinner ──────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
      </div>
    );
  }

  // ── No session at all — redirect to login ─────────────────────────────
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Session exists but email not verified — redirect to login ─────────
  if (!verified) {
    return (
      <Navigate
        to="/login"
        state={{ from: location, reason: "unverified" }}
        replace
      />
    );
  }

  // ── Fully authenticated & verified ────────────────────────────────────
  return <>{children}</>;
}
