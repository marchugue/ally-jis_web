// src/hooks/useAdminMe.ts

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/api/client';
import type { AdminMeResponse, Permission } from '@/api/client';

export interface UseAdminMeResult {
  role: AdminMeResponse['role'] | null;
  permissions: Permission[];
  loading: boolean;
  /** true once the request has resolved and it's clear this user has no
   * admin-tier role (a 403 from the backend) — distinct from "still
   * loading", so the route guard doesn't flash content before redirecting. */
  forbidden: boolean;
  hasPermission: (permission: Permission) => boolean;
}

export function useAdminMe(): UseAdminMeResult {
  const [role, setRole] = useState<AdminMeResponse['role'] | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getAdminMe()
      .then((res) => {
        if (cancelled) return;
        setRole(res.role);
        setPermissions(res.permissions);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) setForbidden(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    role,
    permissions,
    loading,
    forbidden,
    hasPermission: (permission) => permissions.includes(permission),
  };
}
