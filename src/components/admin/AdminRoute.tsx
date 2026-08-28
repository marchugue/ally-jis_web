// src/components/admin/AdminRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdminMe } from '@/hooks/useAdminMe';
import { AdminThemeProvider } from './AdminThemeProvider';

export function AdminRoute() {
  const { role, loading, forbidden } = useAdminMe();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F4EF]">
        <Loader2 className="animate-spin text-[#1A6B3C]" size={28} />
      </div>
    );
  }

  if (forbidden || !role) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminThemeProvider>
      <Outlet />
    </AdminThemeProvider>
  );
}
