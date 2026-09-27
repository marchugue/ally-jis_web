// src/components/admin/AdminRoute.tsx

import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdminMe } from '@/hooks/useAdminMe';
import { AdminThemeProvider } from './AdminThemeProvider';
import { AdminAccessDenied } from './AdminAccessDenied';

export function AdminRoute() {
  const { role, loading, forbidden } = useAdminMe();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F4EF] dark:bg-[#0F1512] transition-colors">
        <Loader2 className="animate-spin text-[#1A6B3C] dark:text-emerald-400" size={28} />
      </div>
    );
  }

  if (forbidden || !role) {
    return <AdminAccessDenied />;
  }

  return (
    <AdminThemeProvider>
      <Outlet />
    </AdminThemeProvider>
  );
}
