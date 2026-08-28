/**
 * DashboardRoleGate
 *
 * Renders as a transparent wrapper around the dashboard.
 * On the FIRST visit per browser session it hits /admin/me to see whether
 * the logged-in user has an elevated role (admin / super_admin / moderator).
 *
 *  • Regular user  → renders children immediately, no interruption.
 *  • Privileged user → shows RoleSelectionModal so they can choose:
 *      - "Continue as Admin/Super Admin/Moderator" → navigates to /admin
 *      - "Continue as Regular User" → dismisses modal, stays on /dashboard
 *
 * The check is suppressed after the first display per session (sessionStorage
 * flag) so navigating away and back doesn't re-show the modal every time.
 * The flag is cleared on sign-out (because a new login should always prompt).
 */

import { useEffect, useRef, useState } from 'react';
import { apiClient, isApiConfigured } from '@/api/client';
import type { AdminRole } from '@/api/client';
import { RoleSelectionModal } from '@/components/RoleSelectionModal';
import { useAuth } from '@/context/AuthContext';

const SESSION_KEY = 'ally_role_prompt_shown';

interface DashboardRoleGateProps {
  children: React.ReactNode;
}

export function DashboardRoleGate({ children }: DashboardRoleGateProps) {
  const { user } = useAuth();
  const [pendingRole, setPendingRole] = useState<AdminRole | null>(null);
  const [checked, setChecked] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only run once per component mount; bail if API isn't wired up.
    if (!isApiConfigured || !user || hasFetched.current) return;

    // If we already showed the prompt this session, skip silently.
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setChecked(true);
      return;
    }

    hasFetched.current = true;

    const checkRole = async () => {
      try {
        const adminInfo = await apiClient.getAdminMe();
        if (adminInfo?.role) {
          // Mark that we've shown (or are about to show) the prompt
          sessionStorage.setItem(SESSION_KEY, 'true');
          setPendingRole(adminInfo.role);
        }
      } catch {
        // 403 → regular user; network error → treat as regular user too
      } finally {
        setChecked(true);
      }
    };

    checkRole();
  }, [user]);

  // If the modal is open, render it in-place (full-screen overlay).
  // The modal handles navigation internally — once dismissed we fall
  // through to rendering children on the next render cycle.
  if (pendingRole) {
    return (
      <RoleSelectionModal
        role={pendingRole}
        onClose={() => setPendingRole(null)}
      />
    );
  }

  // While the async check is in flight and we haven't already cleared it,
  // show a subtle spinner so the dashboard doesn't flash in.
  if (!checked && isApiConfigured && user) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A6B3C]/20 border-t-[#1A6B3C] rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

/** Call this on sign-out so the next login triggers a fresh prompt. */
export function clearRolePromptFlag() {
  sessionStorage.removeItem(SESSION_KEY);
}
