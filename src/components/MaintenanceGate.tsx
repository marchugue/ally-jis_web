// src/components/MaintenanceGate.tsx

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useMaintenance } from '@/context/MaintenanceContext';
import MaintenancePage from '@/pages/MaintenancePage';

interface MaintenanceGateProps {
  children: React.ReactNode;
}

/**
 * MaintenanceGate intercepts app rendering when maintenance mode is active.
 *
 * Rules:
 * - If isMaintenance is true:
 *   - Routes starting with `/admin` or `/login` are allowed through so administrators
 *     can log in and manage or toggle settings.
 *   - Direct route `/maintenance` is allowed through.
 *   - All other routes (student dashboard, feed, profile, onboarding, etc.)
 *     gracefully display the Maintenance UI.
 * - When maintenance mode ends, normal app views are immediately restored.
 */
export function MaintenanceGate({ children }: MaintenanceGateProps) {
  const { isMaintenance, isPreview } = useMaintenance();
  const location = useLocation();

  // Allow admin routes and login through so admins are never locked out
  const isAdminOrAuthRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname === '/maintenance';

  if (isMaintenance && !isAdminOrAuthRoute && !isPreview) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
