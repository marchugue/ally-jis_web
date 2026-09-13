import React from 'react';

interface DashboardRoleGateProps {
  children: React.ReactNode;
}

/**
 * DashboardRoleGate
 *
 * Transparent wrapper around dashboard routes.
 * Directly renders children without role modal interception.
 */
export function DashboardRoleGate({ children }: DashboardRoleGateProps) {
  return <>{children}</>;
}

/** Legacy no-op helper preserved for sign-out compatibility */
export function clearRolePromptFlag() {
  // No-op
}
