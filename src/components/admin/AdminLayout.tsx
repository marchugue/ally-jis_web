// src/components/admin/AdminLayout.tsx

import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bot, Flag, BarChart3, ShieldCheck,
  ScrollText, Bell, Search, Settings, Sun, Moon, ChevronRight, LogOut, UserCog, ImageIcon,
  Menu, Sparkles, Command
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminMe } from '@/hooks/useAdminMe';
import { useAdminTheme } from './AdminThemeProvider';
import { AdminGlobalSearch } from './AdminGlobalSearch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/api/client';
import type { Permission } from '@/api/client';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  permission?: Permission;
  enabled: boolean;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const currentItem = NAV_ITEMS.find((item) => item.path === location.pathname);

  // Fetch pending count for nav badge indicator
  useEffect(() => {
    apiClient.adminListPendingVerifications()
      .then((items) => setPendingCount(items.length))
      .catch(() => setPendingCount(0));
  }, [location.pathname]);

  // Global ⌘K / Ctrl+K keyboard shortcut for admin search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderNavContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="font-fraunces text-lg font-bold text-[#1A6B3C] dark:text-emerald-400">Ally-jis Admin</p>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-white/40 capitalize ml-4 font-medium">
            {role?.replace('_', ' ') ?? 'Administrator'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? 'bg-[#1A6B3C] text-white dark:bg-emerald-600 shadow-sm'
                    : 'text-gray-600 dark:text-white/70 hover:bg-gray-100/70 dark:hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
              {item.path === '/admin/users' && pendingCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white animate-pulse tabular-nums font-fraunces">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile Section */}
      <div className="p-3 border-t border-gray-100 dark:border-white/5 space-y-1">
        <Link
          to="/settings"
          onClick={() => setMobileMenuOpen(false)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors active:scale-[0.98]"
        >
          <UserCog size={16} />
          <span>Account Settings</span>
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium active:scale-[0.98]"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#F7F4EF] dark:bg-[#0F1512] font-jakarta antialiased transition-colors">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white dark:bg-[#161D19] border-r border-gray-200/80 dark:border-white/5 flex-col shadow-xs">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-[#161D19] border-r border-gray-200/80 dark:border-white/10">
          {renderNavContent()}
        </SheetContent>
      </Sheet>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Sticky Header */}
        <header className="h-16 shrink-0 border-b border-gray-200/80 dark:border-white/5 bg-white/90 dark:bg-[#161D19]/90 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-30">
          {/* Mobile Menu Button + Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-gray-600 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors active:scale-95"
              aria-label="Open mobile menu"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-400 dark:text-white/40">
              <span className="hidden sm:inline font-medium">Admin</span>
              {currentItem && currentItem.path !== '/admin' && (
                <>
                  <ChevronRight size={13} className="hidden sm:inline" />
                  <span className="text-gray-800 dark:text-white/90 font-bold">{currentItem.label}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions & Profile Header Controls */}
          <div className="flex items-center gap-2">
            {/* Hotkey Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-xs font-medium active:scale-[0.97]"
            >
              <Search size={15} />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-[10px] font-semibold text-gray-500 dark:text-white/60 font-mono">
                <Command size={10} />K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            {/* Admin User Quick Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-[0.97]">
                  <div className="w-7 h-7 rounded-lg bg-[#1A6B3C] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.email?.charAt(0).toUpperCase() ?? 'A'}
                  </div>
                  <span className="hidden md:block text-xs font-semibold text-gray-700 dark:text-white/80 max-w-[100px] truncate">
                    {user?.email?.split('@')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl bg-white dark:bg-[#161D19] border-gray-200 dark:border-white/10">
                <div className="px-3 py-2 space-y-0.5">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.email}</p>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    {role?.replace('_', ' ') ?? 'Administrator'}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/5" />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer text-xs flex items-center gap-2 py-2 rounded-xl">
                    <UserCog size={14} /> Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/5" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-xs text-red-600 dark:text-red-400 flex items-center gap-2 py-2 rounded-xl focus:bg-red-50 dark:focus:bg-red-950/20"
                >
                  <LogOut size={14} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <Outlet />
        </main>
      </div>

      {/* Global Search Dialog */}
      <AdminGlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
