// src/components/admin/AdminLayout.tsx

import { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bot, Flag, BarChart3, ShieldCheck,
  ScrollText, Bell, Search, Settings, Sun, Moon, ChevronRight, LogOut, UserCog, ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminMe } from '@/hooks/useAdminMe';
import { useAdminTheme } from './AdminThemeProvider';
import { AdminGlobalSearch } from './AdminGlobalSearch';
import type { Permission } from '@/api/client';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  permission?: Permission;
  enabled: boolean; // false = built later, shown as roadmap, not clickable
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, permission: 'view_analytics', enabled: true },
  { label: 'Users', path: '/admin/users', icon: Users, permission: 'manage_users', enabled: true },
  { label: 'Bots', path: '/admin/bots', icon: Bot, permission: 'manage_bots', enabled: false },
  { label: 'Reports', path: '/admin/reports', icon: Flag, permission: 'view_reports', enabled: true },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3, permission: 'view_analytics', enabled: false },
  { label: 'Admins', path: '/admin/admins', icon: ShieldCheck, permission: 'manage_admins', enabled: true },
  { label: 'Activity Log', path: '/admin/activity', icon: ScrollText, enabled: true },
  { label: 'Settings', path: '/admin/settings', icon: Settings, permission: 'manage_settings', enabled: true },
  { label: 'Avatars', path: '/admin/avatars', icon: ImageIcon, permission: 'manage_settings', enabled: true },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const { role, hasPermission } = useAdminMe();
  const { theme, toggleTheme } = useAdminTheme();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const currentItem = NAV_ITEMS.find((item) => item.path === location.pathname);

  return (
    <div className="h-screen flex bg-[#F7F4EF] dark:bg-[#0F1512] font-jakarta transition-colors">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white dark:bg-[#161D19] border-r border-gray-100 dark:border-white/5 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100 dark:border-white/5">
          <p className="font-fraunces text-lg font-bold text-[#1A6B3C] dark:text-emerald-400">Ally-jis Admin</p>
          <p className="text-[11px] text-gray-400 dark:text-white/40 capitalize">{role?.replace('_', ' ')}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission) || role === 'super_admin').map((item) => {
            const Icon = item.icon;
            if (!item.enabled) {
              return (
                <div
                  key={item.path}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-gray-300 dark:text-white/20 text-sm cursor-not-allowed"
                >
                  <span className="flex items-center gap-2.5"><Icon size={16} /> {item.label}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wide bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">Soon</span>
                </div>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1A6B3C] text-white dark:bg-emerald-600'
                      : 'text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`
                }
              >
                <Icon size={16} /> {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-white/5 space-y-0.5">
          <Link
            to="/settings"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <UserCog size={16} /> Account Settings
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#161D19] flex items-center justify-between px-6">
          <div className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-white/40">
            <span>Admin</span>
            {currentItem && currentItem.path !== '/admin' && (
              <>
                <ChevronRight size={13} />
                <span className="text-gray-700 dark:text-white/80 font-medium">{currentItem.label}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <AdminGlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
