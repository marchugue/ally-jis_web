import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Guards (checked in order):
 *  1. Must have a valid session (session !== null).
 *  2. Must have a verified email (verified === true).
 *  3. If external-email student, must be admin-approved (isPendingApproval === false).
 *  4. Must have completed onboarding (needsOnboarding === false).
 *
 * Security model:
 *  - Frontend: route-level redirects prevent navigation to unauthorized pages.
 *  - Backend: authMiddleware enforces the same approval gate on every API call,
 *    so a student cannot bypass the UI to query data directly.
 *
 * While the auth state is loading we show a spinner.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, verified, isPendingApproval, needsOnboarding } = useAuth();
  const location = useLocation();

  // ── Still loading session — show spinner ──────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#090D16] flex items-center justify-center transition-colors">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 dark:border-emerald-500/20 border-t-[#1A6B3C] dark:border-t-emerald-400 rounded-full animate-spin" />
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

  // ── Verified but onboarding not complete ──────────────────────────────
  // Send them back to finish onboarding (Steps 2-4). Allow /onboarding and /register through
  // to avoid an infinite redirect loop.
  if (needsOnboarding && location.pathname !== '/onboarding' && location.pathname !== '/register') {
    return <Navigate to="/register" replace />;
  }

  // ── External-email student pending admin approval ─────────────────────
  // Once onboarding is complete, hard-lock to /pending-approval until an admin
  // verifies their student identity.
  if (isPendingApproval && location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />;
  }

  // ── Fully authenticated, verified, approved, and onboarded ───────────
  return <>{children}</>;
}
